import { BlurType, Color, SymbolShape } from "../data/classes";
import { EL, elh, PageView, ShapeView } from "../dataview";
import { objectId } from "../basic/objectid";
import { innerShadowId } from "./SVG";
export { findOverrideAndVar } from "../data/utils";

// export function isColorEqual(lhs: Color, rhs: Color): boolean {
//     return lhs.equals(rhs);
// }

export const DefaultColor = Color.DefaultColor;

export function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}


export class Renderer {
    constructor(private view: ShapeView) {
    }

    render() {
        switch (this.view.m_ctx.gl) {
            case "SVG":
                return this.render4SVG();
            case "Canvas":
                return this.render4Canvas();
            case "H5":
                return this.render4H5();
            default:
                this.render4SVG();
        }
    }

    protected m_render_version: number = 0;

    protected checkAndResetDirty(): boolean {
        return this.view.m_ctx.removeDirty(this.view);
    }

    private render4SVG() {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView)?.getView(masked.id)?.render();
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
        const autoInfo = (this.m_data as SymbolShape).autoLayout;
        if (autoInfo && autoInfo.stackReverseZIndex) {
            childs = childs.reverse();
        }

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.renderProps();
        let children = [...fills, ...childs, ...borders];
        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", {filter}, children)];
        }

        // 模糊
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (this.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
            } else {
                const __props: any = {};
                if (props.opacity) {
                    __props.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.["mix-blend-mode"]) {
                    __props["mix-blend-mode"] = props.style["mix-blend-mode"];
                    delete props.style["mix-blend-mode"];
                }
                children = [...blur, elh('g', __props, children)];
            }
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, {transform: _mask_space.toString()});
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", {style: {transform: __body_transform}}, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', {id}, children);
            const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    private render4Canvas() {
    }

    private render4H5() {
    }


    protected renderProps(): { [key: string]: string } & { style: any } {
        const props: any = {};
        const style: any = {};

        style['transform'] = this.view.transform.toString();

        const contextSettings = this.view.contextSettings;

        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            style['mix-blend-mode'] = contextSettings.blenMode;
        }

        props.style = style;

        return props;
    }

    protected renderContents(): EL[] {
        const childs = this.view.m_children;
        childs.forEach((c) => c.render());
        return childs;
    }

     protected renderFills(): EL[] {
        const fills = this.view.getFills();
        return renderFills(elh, fills, this.view.size, this.view.getPathStr());
    }
}