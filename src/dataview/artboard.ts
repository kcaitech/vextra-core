import { DataView } from "./basic";
import { EL } from "./el";
import { GroupShapeView } from "./groupshape";
import { ShapeView } from "./shape";

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

    protected renderProps(): { [key: string]: string } {
        const ab_props: { [key: string]: string } = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden"
        }
        return ab_props;
    }

    render(): { tag: string; attr: { [key: string]: string; }; childs: (ShapeView | EL)[]; } | undefined {
        const r = super.render();
        if (r) {
            r.tag = "svg";
        }
        return r;
    }
}