import {
    AutoLayout, Border, ContextSettings, CornerRadius, Fill, MarkerType, OverrideType, PrototypeInterAction,
    Shadow, Shape, ShapeFrame, ShapeSize, SymbolRefShape, SymbolShape, SymbolUnionShape, Variable, VariableType,
    ShapeType, BasicArray,
    getPathOfRadius, makeShapeTransform1By2, makeShapeTransform2By1
} from "../data";
import { fixFrameByConstrain, frame2Parent2, ShapeView } from "./shape";
import { DataView, RootView } from "./view";
import { getShapeViewId } from "./basic";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { findOverride, findVar } from "./basic";
import { objectId } from "../basic/objectid";
import { findOverrideAll } from "../data/utils";
import { PageView } from "./page";
import { innerShadowId } from "../render";
import { elh } from "./el";

// 播放页组件状态切换会话存储refId的key值；
export const sessionRefIdKey = 'ref-id-cf76c6c6-beed-4c33-ae71-134ee876b990';

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.symwatcher = this.symwatcher.bind(this);
        this.loadsym();
        this.updateMaskMap();
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
        // let refframe;
        const parent = this.parent;
        const parentFrame = parent?.hasSize() ? parent.frame : undefined;
        this._layout(this.m_data, parentFrame, varsContainer, this.m_scale, this.m_uniform_scale);
        this.updateFrames();
    }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const swap_ref_id = this.getSessionRefId();
        if (swap_ref_id) {
            return swap_ref_id as string;
        }
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : (this.m_data as SymbolRefShape).refId;
    }

    getSessionRefId(): boolean | string {
        const pathname = window.location.pathname;
        const jsonString = sessionStorage.getItem(sessionRefIdKey);
        if (!pathname.includes("document") && jsonString) {
            const refIdArray = JSON.parse(jsonString);
            const maprefIdArray = new Map(refIdArray) as Map<string, string>;
            if (maprefIdArray.has(this.id)) {
                return maprefIdArray.get(this.id) || false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    maskMap: Map<string, Shape | boolean> = new Map;

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
        if (args.includes('childs')) this.updateMaskMap();
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
        this.m_pathstr = '';
        this.m_path = undefined;
        this.m_ctx.setReLayout(this);
    }

    onDestory(): void {
        super.onDestory();
        if (this.m_union) this.m_union.unwatch(this.symwatcher);
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
    }

    private layoutChild(
        child: Shape,
        idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined,
        uniformScale: number | undefined
    ): boolean {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, scale, varsContainer, isVirtual: true, uniformScale };

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
        if (props && !this.updateLayoutProps(props, needLayout)) return;

        this.m_ctx.setDirty(this);
        this.m_ctx.addNotifyLayout(this);

        const varsContainer = (this.varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym) {
            if (this.m_sym.parent instanceof SymbolUnionShape) {
                varsContainer.push(this.m_sym.parent);
            }
            varsContainer.push(this.m_sym);
        }

        const parent = this.parent;
        const parentFrame = parent?.hasSize() ? parent.frame : undefined;
        this._layout(this.data, parentFrame, varsContainer, this.m_scale, this.m_uniform_scale)
    }

    get frame4child() {
        return this.frame;
    }

    protected _layout(
        shape: Shape,
        parentFrame: ShapeSize | undefined,
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        _scale: { x: number; y: number; } | undefined,
        uniformScale: number | undefined
    ): void {
        if (!this.m_sym) {
            this.updateLayoutArgs(shape.transform, shape.frame, 0);
            this.removeChilds(0, this.m_children.length).forEach((c) => c.destory());
            return;
        }
        const prescale = { x: _scale?.x ?? 1, y: _scale?.y ?? 1 }
        const scale = { x: prescale.x, y: prescale.y }
        const childscale = { x: scale.x, y: scale.y }

        // 调整过大小的，使用用户调整的大小，否则跟随symbol大小
        if ((this.m_data as SymbolRefShape).isCustomSize) {
            // 使用自己大小
            childscale.x *= this.m_data.size.width / this.m_sym.size.width;
            childscale.y *= this.m_data.size.height / this.m_sym.size.height;
        } else {
            // 跟随symbol大小
            scale.x *= this.m_sym.size.width / this.m_data.size.width;
            scale.y *= this.m_sym.size.height / this.m_data.size.height;
        }
        const transform = shape.transform;
        // case 1 不需要变形
        if (scale.x === 1 && scale.y === 1) {
            let frame = this.m_data.frame;
            this.updateLayoutArgs(transform, frame, 0);
            this.layoutChilds(varsContainer, frame, childscale, this.uniformScale);
            return;
        }

        const skewTransform = (scalex: number, scaley: number) => {
            let t = transform;
            if (scalex !== scaley) {
                t = t.clone();
                t.scale(scalex, scaley);
                // 保留skew去除scale
                const t2 = makeShapeTransform2By1(t);
                t2.clearScaleSize();
                t = makeShapeTransform1By2(t2);
            }
            return t;
        }

        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        // 当前对象如果没有frame,需要childs layout完成后才有
        // 但如果有constrain,则需要提前计算出frame?当前是直接不需要constrain
        if (!this.hasSize() && (resizingConstraint === 0 || !parentFrame)) {
            let frame = this.frame; // 不需要更新
            const t0 = transform.clone();
            t0.scale(scale.x, scale.y);
            const save1 = t0.computeCoord(0, 0);
            const t = skewTransform(scale.x, scale.y).clone();
            const save2 = t.computeCoord(0, 0)
            const dx = save1.x - save2.x;
            const dy = save1.y - save2.y;
            t.trans(dx, dy);
            this.updateLayoutArgs(t, frame, 0);
            this.layoutChilds(varsContainer, undefined, childscale, this.uniformScale);
            return;
        }

        const size = this.data.frame; // 如果是group,实时计算的大小。view中此时可能没有
        const frame = frame2Parent2(transform, size);
        const saveW = frame.width;
        const saveH = frame.height;

        let scaleX = scale.x;
        let scaleY = scale.y;

        if (parentFrame && resizingConstraint !== 0) {
            fixFrameByConstrain(shape, parentFrame, frame, scaleX, scaleY, this.m_uniform_scale);
            scaleX = frame.width / saveW;
            scaleY = frame.height / saveH;
        } else {
            if (uniformScale) {
                scaleX /= uniformScale;
                scaleY /= uniformScale;
                frame.x *= prescale.x / uniformScale;
                frame.y *= prescale.y / uniformScale;
            } else {
                frame.x *= prescale.x;
                frame.y *= prescale.y;
            }

            frame.width *= scaleX;
            frame.height *= scaleY;
        }

        const t = skewTransform(scaleX, scaleY).clone();
        const cur = t.computeCoord(0, 0);
        t.trans(frame.x - cur.x, frame.y - cur.y);

        const inverse = t.inverse;
        const rb = inverse.computeCoord(frame.x + frame.width, frame.y + frame.height);
        const size2 = new ShapeFrame(0, 0, rb.x, rb.y);
        this.updateLayoutArgs(t, size2, 0);
        // 重新计算 childscale
        childscale.x = size2.width / this.m_sym.size.width;
        childscale.y = size2.height / this.m_sym.size.height;
        this.layoutChilds(varsContainer, this.frame, childscale, this.uniformScale);
    }

    protected layoutChilds(
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        parentFrame: ShapeSize | undefined,
        scale?: { x: number, y: number },
        uniformScale?: number
    ): void {
        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i];
            // update childs
            if (this.layoutChild(cc, i, scale, varsContainer, resue, rootView, uniformScale)) changed = true;
        }

        // 删除多余的
        if (this.m_children.length > childs.length) {
            const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
            if (rootView) rootView.addDelayDestory(removes);
            else removes.forEach((c => c.destory()));
            changed = true;
        }

        if (changed) this.notify("childs");
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

    protected _findOV2All(ot: OverrideType, vt: VariableType): Variable[] | undefined {
        const data = this.data;
        const varsContainer = (this.varsContainer || []).concat(data);
        const id = ""; // ?
        return findOverrideAll(id, ot, varsContainer);
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

    get prototypeInterActions(): BasicArray<PrototypeInterAction> | undefined {
        // 三个合并
        const v = this._findOV2All(OverrideType.ProtoInteractions, VariableType.ProtoInteractions);
        if (!v) {
            return this.inheritPrototypeInterActions;
        }
        // 需要做合并
        // 合并vars
        const overrides = new BasicArray<PrototypeInterAction>();
        v.reverse().forEach(v => {
            const o = (v.value as BasicArray<PrototypeInterAction>).slice(0).reverse();
            o.forEach(o => {
                if (!overrides.find(o1 => o1.id === o.id)) overrides.push(o);
            })
        })
        overrides.reverse();

        const deleted = overrides.filter((v) => !!v.isDeleted);
        const inherit = (this.inheritPrototypeInterActions || []) as BasicArray<PrototypeInterAction>;
        const ret = new BasicArray<PrototypeInterAction>();
        inherit.forEach(v => {
            if (v.isDeleted) return;
            if (deleted.find(v1 => v1.id === v.id)) return;
            const o = overrides.find(v1 => v1.id === v.id);
            ret.push(o ? o : v);
        })
        overrides.forEach(v => {
            if (v.isDeleted) return;
            if (inherit.find(v1 => v1.id === v.id)) return;
            ret.push(v);
        })
        return ret;
    }

    get inheritPrototypeInterActions(): BasicArray<PrototypeInterAction> | undefined {
        if (this.m_data.prototypeInteractions) {
            return this.m_data.prototypeInteractions.slice(0).concat(...(this.m_sym?.prototypeInteractions || [])) as BasicArray<PrototypeInterAction>
        }
        return this.m_sym?.prototypeInteractions;
    }

    get autoLayout(): AutoLayout | undefined {
        const v = this._findOV2(OverrideType.AutoLayout, VariableType.AutoLayout);
        if (v) return v.value;
        return this.m_sym?.autoLayout;
    }
    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView).getView(masked.id)?.render();
            this.reset("g");
            return ++this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorders();
        let childs = this.renderContents();

        if (this.uniformScale) childs = [elh('g', { transform: `scale(${this.uniformScale})` }, childs)];

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        let props = this.renderProps();
        let children = [...fills, ...childs, ...borders];

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        if (blur.length) {
            let filter: string = '';
            filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }
}