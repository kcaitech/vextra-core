import { elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderFills } from "../render";

export class ArtboradView extends GroupShapeView {

    // 检查显示区域
    // 1. 太小时显示成image
    // 2. 

    // private _bubblewatcher(...args: any[]) {

    // }

    // onDestory(): void {
    //     super.onDestory();
    //     this.m_data.unbubblewatch(this._bubblewatcher);
    // }

    // toSVGString(): string {
    //     return this.m_el?.outerHTML || "";
    // }

    protected renderFills() {
        // if (!this.m_fills) {
        //     this.m_fills = renderFills(elh, this.getFills(), this.frame, this.getPathStr());
        // }
        // return this.m_fills;
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderProps(): { [key: string]: string } {
        const shape = this.m_data;
        const props: any = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden"
        }
        const contextSettings = shape.style.contextSettings;
        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            props.opacity = contextSettings.opacity;
        }

        const frame = shape.frame;
        props.width = frame.width;
        props.height = frame.height;
        props.x = frame.x;
        props.y = frame.y;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
    }

    render(): number {
        const isDirty = this.m_ctx.removeDirty(this);
        if (!isDirty) {
            return this.m_render_version;
        }

        if (!this.isVisible()) {
            this.reset("");
            return ++this.m_render_version;
        }

        // fill
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderProps();

        const filterId = this.m_data.id.slice(0, 4);
        const shadows = this.renderShadows(filterId);

        if (shadows.length > 0) { // 阴影
            const frame = this.frame;
            const ex_props: any = {};
            ex_props.opacity = props.opacity;
            ex_props.transform = `translate(${frame.x},${frame.y})`;

            // delete props.style;
            // delete props.transform;
            delete props.opacity;
            props.x = '0';
            props.y = '0';
            const inner_url = innerShadowId(filterId, this.getShadows());
            props.filter = `url(#pd_outer-${filterId}) ${inner_url}`;
            const body = elh("svg", props, [...fills, ...childs, ...borders]);
            this.reset("g", ex_props, [...shadows, body])
        }
        else {
            this.reset("svg", props, [...fills, ...childs, ...borders]);
        }
        return ++this.m_render_version;
    }
}