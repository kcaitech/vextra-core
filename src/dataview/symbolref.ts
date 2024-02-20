import { Border, BorderOptions, ContextSettings, Fill, OverrideType, Shadow, Shape, ShapeFrame, SymbolRefShape, SymbolShape, SymbolUnionShape, Variable, VariableType } from "../data/classes";
import { ShapeView } from "./shape";
import { ShapeType } from "../data/classes";
import { DataView, RootView } from "./view";
import { fixFrameByConstrain, isDiffRenderTransform, isDiffVarsContainer, isNoTransform } from "./shape";
import { RenderTransform, findOverrideAndVar, getShapeViewId } from "./basic";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";
import { findOverride, findVar } from "./basic";
import { objectId } from "../basic/objectid";

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);

        this.symwatcher = this.symwatcher.bind(this);
        this.loadsym(true);
        // const data = this.m_data as SymbolRefShape
        // const symMgr = data.getSymbolMgr();
        // const refId = this.getRefId();
        // this.m_refId = refId;
        // symMgr?.get(refId).then((sym) => {
        //     if (this.m_refId === refId) {
        //         this.m_sym = sym;
        //         this.m_ctx.setReLayout(this);
        //     }
        // }).catch((err) => {
        //     console.error(err);
        // })
        this.afterInit();
    }

    protected afterInit(): void {
        if (!this.m_sym) {
            super.afterInit();
            return;
        }
        const varsContainer = (this.varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym.parent);
        }
        varsContainer.push(this.m_sym);
        this._layout(this.m_data, this.m_transx, varsContainer);
    }

    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : (this.m_data as SymbolRefShape).refId;
    }

    private m_refId: string | undefined;
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

    onDataChange(...args: any[]): void {
        this.loadsym();
    }

    symwatcher(...args: any[]) {
        // todo
        this.m_ctx.setReLayout(this);
    }

    // todo
    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        if (this.symData) {
            const override = this.symData.getOverrid(refId, type);
            if (override) {
                const ret = [override.v];
                if (this.varsContainer) findVar(override.v.id, ret, this.varsContainer);
                return ret;
            }
        }
        const override = this.data.getOverrid(refId, type);
        if (override) {
            const ret = [override.v];
            // this.id
            refId = override.v.id;
            if (this.isVirtualShape) {
                refId = (this.data).id + '/' + refId;
            }
            else {
                refId = this.id + '/' + refId;
            }
            if (this.varsContainer) findVar(refId, ret, this.varsContainer);
            return ret;
        }
        const thisId = this.isVirtualShape ? (this.data).id : this.id;
        if (refId !== thisId) refId = thisId + '/' + refId; // fix ref自己查找自己的override
        return this.varsContainer && findOverride(refId, type, this.varsContainer);
    }

    // todo
    findVar(varId: string, ret: Variable[]) {            // todo subdata, proxy
        if (this.symData) {
            const override = this.symData.getOverrid(varId, OverrideType.Variable);
            if (override) {
                ret.push(override.v);
                // scope??
                varId = override.v.id;
            }
            else {
                const _var = this.symData.getVar(varId);
                if (_var) {
                    ret.push(_var);
                }
            }
        }
        const override = this.data.getOverrid(varId, OverrideType.Variable);
        if (override) {
            ret.push(override.v);
            if (this.varsContainer) findVar(override.v.id, ret, this.varsContainer);
            return;
        }
        const _var = this.data.getVar(varId);
        if (_var) {
            ret.push(_var);
        }
        // 考虑scope
        // varId要叠加上refid
        if (this.isVirtualShape) {
            varId = (this.data).id + '/' + varId;
        }
        else {
            varId = this.id + '/' + varId;
        }
        if (this.varsContainer) findVar(varId, ret, this.varsContainer);
        return;
    }

    // 需要自己加载symbol
    // private __data: SymbolShape | undefined;
    // private __union: SymbolShape | undefined;
    // private __startLoad: string = "";
    loadsym(trysync: boolean = false) {
        const symMgr = (this.m_data as SymbolRefShape).getSymbolMgr();
        if (!symMgr) return;
        const refId = this.getRefId();
        if (this.m_refId === refId) {
            return;
        }
        this.m_refId = refId;
        const onload = (val: SymbolShape) => {
            if (this.m_refId !== refId) return;
            if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
            this.m_sym = val;
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
        if (trysync) {
            const val = symMgr.getSync(refId);
            onload(val as SymbolShape);
            return;
        }
        symMgr.get(refId).then((val) => {
            onload(val as SymbolShape);
        }).catch((e) => {
            console.error(e);
        })
    }

    onDestory(): void {
        super.onDestory();
        if (this.m_union) this.m_union.unwatch(this.symwatcher);
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
    }

    private layoutChild(child: Shape, idx: number, transx: RenderTransform | undefined, varsContainer: VarsContainer | undefined, resue: Map<string, DataView>, rView: RootView | undefined): boolean {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, transx, varsContainer, isVirtual: true };

        if (cdom) {
            const changed = this.moveChild(cdom, idx);
            cdom.layout(props);
            return changed;
        }

        cdom = rView && rView.getView(getShapeViewId(child, varsContainer));
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
        const refframe = this.m_data.frame;
        const symframe = this.m_sym.frame;
        const noTrans = isNoTransform(this.m_transx);
        if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
            this._layout(this.m_data, undefined, varsContainer); // 普通更新
            this.notify("layout");
            return;
        }
        // 先更新自己, 再更新子对象
        if (!noTrans) {
            // todo: 临时hack
            const saveLayoutNormal = this.layoutOnNormal;
            const saveLayoutOnRectShape = this.layoutOnRectShape;
            this.layoutOnNormal = () => { };
            this.layoutOnRectShape = () => { };
            this._layout(this.m_data, this.m_transx, varsContainer);
            this.layoutOnNormal = saveLayoutNormal;
            this.layoutOnRectShape = saveLayoutOnRectShape;
        }
        else { // 第一个
            const shape = this.m_data;
            this.updateLayoutArgs(shape.frame, shape.isFlippedHorizontal, shape.isFlippedVertical, shape.rotation, (shape as any).fixedRadius);
        }
        // 
        // todo
        {

            const refframe = this.m_frame;
            const scaleX = refframe.width / symframe.width;
            const scaleY = refframe.height / symframe.height;

            // todo
            const shape = this.m_sym;
            const frame = shape.frame;
            let x = frame.x;
            let y = frame.y;
            let width = frame.width;
            let height = frame.height;

            const resizingConstraint = shape.resizingConstraint;
            const fixWidth = resizingConstraint && ResizingConstraints.hasWidth(resizingConstraint);
            const fixHeight = resizingConstraint && ResizingConstraints.hasHeight(resizingConstraint);

            const saveW = width;
            const saveH = height;

            if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                x *= scaleX;
                y *= scaleY;
                // 居中
                x += (width * (scaleX - 1)) / 2;
                y += (height * (scaleY - 1)) / 2;
            } if (fixWidth || fixHeight) {
                const newscaleX = fixWidth ? 1 : scaleX;
                const newscaleY = fixHeight ? 1 : scaleY;
                x *= scaleX;
                y *= scaleY;
                if (fixWidth) x += (width * (scaleX - 1)) / 2;
                if (fixHeight) y += (height * (scaleY - 1)) / 2;
                width *= newscaleX;
                height *= newscaleY;
            }
            else {
                const frame = refframe;
                x = frame.x;
                y = frame.y;
                width = frame.width;
                height = frame.height;
            }
            const parentFrame = new ShapeFrame(x, y, width, height);

            fixFrameByConstrain(shape, refframe, parentFrame);

            const cscaleX = parentFrame.width / saveW;
            const cscaleY = parentFrame.height / saveH;
            this.layoutOnRectShape(varsContainer, parentFrame, cscaleX, cscaleY);
        }

        this.notify("layout");
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            // update childs
            if (this.layoutChild(cc, i, undefined, varsContainer, resue, rootView)) {
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

    layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeFrame, scaleX: number, scaleY: number): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i]
            const transform = {
                dx: 0,
                dy: 0,
                scaleX,
                scaleY,
                parentFrame: this.frame,
                vflip: false,
                hflip: false,
                rotate: 0
            }
            // update childs
            if (this.layoutChild(cc, i, transform, varsContainer!, resue, rootView)) {
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
            this.notify("childs"); // notify childs change
        }
    }

    layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix): void {
        throw new Error("Method not implemented.");
    }

    get contextSettings(): ContextSettings | undefined {
        const v = this._findOV(OverrideType.ContextSettings, VariableType.ContextSettings);
        if (v) return v.value;
        if (this.m_data.style.contextSettings) return this.m_data.style.contextSettings;
        return this.m_sym?.style.contextSettings;
    }

    getFills(): Fill[] {
        const v = this._findOV(OverrideType.Fills, VariableType.Fills);
        if (v) return v.value;
        if (this.data.overrideFills) return this.data.style.fills;
        return this.m_sym?.style.fills || [];
    }

    getBorders(): Border[] {
        const v = this._findOV(OverrideType.Borders, VariableType.Borders);
        if (v) return v.value;
        if (this.data.overrideBorders) return this.data.style.borders;
        return this.m_sym?.style.borders || [];
    }

    getBorderOptions(): BorderOptions | undefined {
        const v = this._findOV(OverrideType.BorderOptions, VariableType.BorderOptions);
        if (v) return v.value;
        if (this.data.style.borderOptions) return this.data.style.borderOptions;
        return this.m_sym?.style.borderOptions;
    }

    getShadows(): Shadow[] {
        const v = this._findOV(OverrideType.Shadows, VariableType.Shadows);
        if (v) return v.value;
        if (this.data.overrideShadows) return this.data.style.shadows;
        return this.m_sym?.style.shadows || [];
    }
}