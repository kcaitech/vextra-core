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

        const frame = this.frame;
        props.width = frame.width;
        props.height = frame.height;
        props.x = 0;
        props.y = 0;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
    }

    render(): number {
        const isDirty = this.checkAndResetDirty();
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

        const svgprops = this.renderProps();

        const filterId = this.m_data.id.slice(0, 4);
        const shadows = this.renderShadows(filterId);

        const props: any = {};
        props.opacity = svgprops.opacity;
        delete svgprops.opacity;

        const frame = this.frame;
        if (!this.isNoTransform()) {
            const cx = frame.x + frame.width / 2;
            const cy = frame.y + frame.height / 2;
            const style: any = {}
            style.transform = "translate(" + cx + "px," + cy + "px) "
            if (this.m_hflip) style.transform += "rotateY(180deg) "
            if (this.m_vflip) style.transform += "rotateX(180deg) "
            if (this.m_rotate) style.transform += "rotate(" + this.m_rotate + "deg) "
            style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
            props.style = style;
        } else {
            props.transform = `translate(${frame.x},${frame.y})`;
        }

        if (shadows.length > 0) { // 阴影
            const inner_url = innerShadowId(filterId, this.getShadows());
            svgprops.filter = `url(#pd_outer-${filterId}) ${inner_url}`;
        }

        const body = elh("svg", svgprops, [...fills, ...childs, ...borders]);
        this.reset("g", props, [...shadows, body])
        return ++this.m_render_version;
    }
}