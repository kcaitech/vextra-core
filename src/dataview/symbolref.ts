import { Border, ContextSettings, CornerRadius, Fill, MarkerType, OverrideType, Shadow, Shape, ShapeFrame, ShapeSize, SymbolRefShape, SymbolShape, SymbolUnionShape, Variable, VariableType, getPathOfRadius } from "../data/classes";
import { ShapeView } from "./shape";
import { ShapeType } from "../data/classes";
import { DataView, RootView } from "./view";
import { isDiffRenderTransform, isDiffVarsContainer, isNoTransform } from "./shape";
import { getShapeViewId } from "./basic";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { ResizingConstraints } from "../data/consts";
import { findOverride, findVar } from "./basic";
import { objectId } from "../basic/objectid";

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.updateMaskMap();
        this.symwatcher = this.symwatcher.bind(this);
        this.loadsym();
        // this.afterInit();
    }

    onMounted(): void {
        if (!this.m_sym) {
            super.onMounted();
            return;
        }
        const varsContainer = (this.varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym.parent);
        }
        varsContainer.push(this.m_sym);
        let refframe = this.m_data.frame;
        const symframe = this.m_sym.frame;
        if (this.isVirtualShape && !(this.m_data as SymbolRefShape).isCustomSize) {
            refframe = new ShapeFrame(refframe.x, refframe.y, symframe.width, symframe.height);
        }
        const parentFrame = this.parent?.size;
        this._layout(refframe, this.m_data, parentFrame, varsContainer, this.m_transx);
    }

    // protected isNoSupportDiamondScale(): boolean {
    //     return this.m_data.isNoSupportDiamondScale;
    // }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : (this.m_data as SymbolRefShape).refId;
    }

    maskMap: Map<string, Shape> = new Map;
    updateMaskMap() {
        const map = this.maskMap;
        map.clear();

        const children = this.getDataChilds();
        let mask: Shape | undefined = undefined;
        const maskShape: Shape[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask) {
                mask = child;
                maskShape.push(child);
            } else {
                mask && map.set(child.id, mask);
            }
        }
        this.childs.forEach(c => {
            if (c.mask) return;
            c.m_ctx.setDirty(c);
        });
        maskShape.forEach(m => m.notify('rerender-mask'));
        this.notify('mask-env-change');
    }

    // private m_refId: string | undefined;
    private m_sym: SymbolShape | undefined;
    private m_union: SymbolShape | undefined;

    get symData() {
        return this.m_sym;
    }
    get refId(): string {
        return this.getRefId();
    }

    get data() {
        return this.m_data as SymbolRefShape;
    }

    get variables() {
        return this.data.variables;
    }
    get overrides() {
        return this.data.overrides;
    }
    get isCustomSize() {
        return this.data.isCustomSize;
    }

    getPath() {
        if (this.m_path) return this.m_path;
        this.m_path = getPathOfRadius(this.frame, this.cornerRadius, this.m_fixedRadius);
        this.m_path.freeze();
        return this.m_path;
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        this.loadsym();
        if (args.includes('childs')) {
            this.updateMaskMap();
        }
    }

    symwatcher(...args: any[]) {
        // todo
        this.m_ctx.setReLayout(this);
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        const varsContainer = (this.varsContainer || []).concat(this.data);
        return findOverride(refId, type, varsContainer || []);
    }

    findVar(varId: string, ret: Variable[]) {            // todo subdata, proxy
        const varsContainer = (this.varsContainer || []).concat(this.data);
        findVar(varId, ret, varsContainer || []);
    }

    loadsym() {
        const symMgr = (this.m_data as SymbolRefShape).getSymbolMgr();
        if (!symMgr) return;
        const refId = this.getRefId();
        const sym = symMgr.get(refId);
        if (!sym) return;
        // if (this.m_refId === refId) {
        //     return;
        // }

        if (this.m_sym && objectId(this.m_sym) === objectId(sym)) return;

        // this.m_refId = refId;
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
        this.m_sym = sym;
        if (this.m_sym) this.m_sym.watch(this.symwatcher);
        // union
        const union = this.m_sym?.parent instanceof SymbolUnionShape ? this.m_sym.parent : undefined;
        if (this.m_union?.id !== union?.id) {
            if (this.m_union) this.m_union.unwatch(this.symwatcher);
            this.m_union = union;
            if (this.m_union) this.m_union.watch(this.symwatcher);
        }
        this.m_ctx.setReLayout(this);
    }

    onDestory(): void {
        super.onDestory();
        if (this.m_union) this.m_union.unwatch(this.symwatcher);
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
    }

    private layoutChild(child: Shape, idx: number, transx: { x: number, y: number } | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined): boolean {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: true };

        if (cdom) {
            const changed = this.moveChild(cdom, idx);
            cdom.layout(props);
            return changed;
        }

        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            cdom.layout(props);
            return true;
        }

        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
        return true;
    }

    layout(props?: PropsType | undefined): void {
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset

        if (props) {
            // 
            if (props.data.id !== this.m_data.id) throw new Error('id not match');
            const dataChanged = objectId(props.data) !== objectId(this.m_data);
            if (dataChanged) {
                // data changed
                this.setData(props.data);
            }
            // check
            const diffTransform = isDiffRenderTransform(props.transx, this.m_transx);
            const diffVars = isDiffVarsContainer(props.varsContainer, this.varsContainer);
            if (!needLayout &&
                !dataChanged &&
                !diffTransform &&
                !diffVars) {
                return;
            }

            if (diffTransform) {
                // update transform
                this.m_transx = props.transx;
            }
            if (diffVars) {
                // update varscontainer
                this.m_ctx.removeDirty(this);
                this.varsContainer = props.varsContainer;
                const _id = this.id;
                // if (_id !== tid) {
                //     // tid = _id;
                // }
            }
        }

        this.m_ctx.setDirty(this);

        if (!this.m_sym) {
            this.removeChilds(0, this.m_children.length).forEach((c) => c.destory());
            return;
        }
        const varsContainer = (this.varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym.parent);
        }
        varsContainer.push(this.m_sym);

        // let transx: RenderTransform | undefined;
        let refframe = this.m_data.size;
        const symframe = this.m_sym.size;
        if (this.isVirtualShape && !this.data.isCustomSize) {
            refframe = new ShapeSize(symframe.width, symframe.height);
        }
        const parentFrame = this.parent?.size;
        const noTrans = isNoTransform(this.m_transx);
        if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
            this._layout(refframe, this.data, parentFrame, varsContainer, this.m_transx); // 普通更新
            this.notify("layout");
            return;
        }
        // 先更新自己, 再更新子对象
        if (!noTrans) {
            // todo: 临时hack
            const saveLayoutNormal = this.layoutChilds;
            this.layoutChilds = () => { };
            this._layout(refframe, this.m_data, parentFrame, varsContainer, this.m_transx);
            this.layoutChilds = saveLayoutNormal;
        }
        else { // 第一个 noTrans
            const shape = this.data;
            this.updateLayoutArgs(shape.transform, refframe, (shape as any).fixedRadius);
        }
        // 
        // todo
        {
            const refframe = this.size;
            const scaleX = refframe.width / symframe.width;
            const scaleY = refframe.height / symframe.height;

            this.layoutChilds(varsContainer, this.size, { x: scaleX, y: scaleY });
        }

        this.notify("layout");
    }

    protected layoutChilds(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeSize, scale?: { x: number, y: number }): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            // update childs
            if (this.layoutChild(cc, i, scale, varsContainer, resue, rootView)) {
                changed = true;
            }
        }
        // 删除多余的

        if (this.m_children.length > childs.length) {
            const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
            if (rootView) rootView.addDelayDestory(removes);
            else removes.forEach((c => c.destory()));
            changed = true;
        }

        if (changed) {
            this.notify("childs");
        }
    }


    protected _findOV2(ot: OverrideType, vt: VariableType): Variable | undefined {
        const data = this.data;
        const varsContainer = (this.varsContainer || []).concat(data);
        const id = ""; // ?
        const _vars = findOverride(id, ot, varsContainer);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) {
            return _var;
        }
    }

    get contextSettings(): ContextSettings | undefined {
        const v = this._findOV2(OverrideType.ContextSettings, VariableType.ContextSettings);
        if (v) return v.value;
        return this.m_sym?.style.contextSettings;
    }

    getFills(): Fill[] {
        const v = this._findOV2(OverrideType.Fills, VariableType.Fills);
        if (v) return v.value;
        return this.m_sym?.style.fills || [];
    }

    getBorders(): Border[] {
        const v = this._findOV2(OverrideType.Borders, VariableType.Borders);
        if (v) return v.value;
        return this.m_sym?.style.borders || [];
    }

    get startMarkerType(): MarkerType | undefined {
        const v = this._findOV2(OverrideType.StartMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_sym?.style.startMarkerType;
    }
    get endMarkerType(): MarkerType | undefined {
        const v = this._findOV2(OverrideType.EndMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_sym?.style.endMarkerType;
    }

    getShadows(): Shadow[] {
        const v = this._findOV2(OverrideType.Shadows, VariableType.Shadows);
        if (v) return v.value;
        return this.m_sym?.style.shadows || [];
    }
    get cornerRadius(): CornerRadius | undefined {
        const v = this._findOV2(OverrideType.CornerRadius, VariableType.CornerRadius);
        if (v) return v.value;
        return this.m_sym?.cornerRadius;
    }
}