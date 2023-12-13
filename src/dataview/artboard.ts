import { elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { renderFills } from "../render";

export class ArtboradView extends GroupShapeView {

    // 检查显示区域
    // 1. 太小时显示成image
    // 2. 

    // private _bubblewatcher(...args: any[]) {

    // }

    // onCreate(): void {
    //     super.onCreate();
    //     this._bubblewatcher = this._bubblewatcher.bind(this);
    //     this.m_data.bubblewatch(this._bubblewatcher);
    // }

    // onDestory(): void {
    //     super.onDestory();
    //     this.m_data.unbubblewatch(this._bubblewatcher);
    // }

    // toSVGString(): string {
    //     return this.m_el?.outerHTML || "";
    // }

    protected renderFills() {
        if (!this.m_fills) {
            this.m_fills = renderFills(elh, this.getFills(), this.getFrame(), this.getPath());
        }
        return this.m_fills;
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
        const r = super.render();
        if (r) {
            this.tag = "svg";
        }
        return r;
    }
}