
import { Notifiable } from "./basic";
import { IPageShadow } from "./ishadow";
import { LzData } from "./lzdata";
import { BoolOp, ExportOptions, GroupShape, Shape, ShapeFrame, ShapeType } from "./shape";
import { Style } from "./style";
import { Atom, AtomGroup } from "./transact";

export class RulerData {
    // "horizontalRulerData": {
    //     "_class": "rulerData",
    //     "base": 0,
    //     "guides": []
    // },
    // "verticalRulerData": {
    //     "_class": "rulerData",
    //     "base": 0,
    //     "guides": []
    // }
}

@AtomGroup
export class Page extends GroupShape {

    // private m_gradients: Map<string, Gradient> | undefined;
    private m_horizontalRulerData: RulerData | undefined;
    private m_verticalRulerData: RulerData | undefined;
    // private __repo: Repository | undefined;
    private __shadows: IPageShadow[] = [];
    // private m_viewbox: ShapeFrame | undefined;

    // private __editor: PageEditor | undefined;
    addShadow(shadow: IPageShadow) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageShadow) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }
    get shadows() { // for editor
        return this.__shadows;
    }
    // get viewBox(): ShapeFrame {
    //     if (this.m_viewbox == undefined) {
    //         throw new Error("");
    //     }
    //     return this.m_viewbox;
    // }
    // bubbleup(...args: any[]): void {
    //     super.bubbleup(...args); // group shape
    //     if (args.length > 2 && args[args.length - 1] == "frame") {
    //         if (this.updateViewBox()) {
    //             this.notify();
    //         }
    //     }
    // }
    // private updateViewBox(): boolean {
    //     const cc = this.childsCount || 0;
    //     const frame = this.frame;
    //     let right = frame.width || 800;
    //     let bottom = frame.height || 600;
    //     let left = 0;
    //     let top = 0;

    //     for (let i = 0; i < cc; i++) {
    //         const child = this.getChildByIndex(i);
    //         const cf = child.frame;
    //         right = Math.max(right, cf.x + cf.width + 1);
    //         bottom = Math.max(bottom, cf.y + cf.height + 1);
    //         left = Math.min(left, cf.x);
    //         top = Math.min(top, cf.y);
    //     }

    //     const expandBox = 20;
    //     const x = left - expandBox;
    //     const y = top - expandBox;
    //     const width = right - x + expandBox;
    //     const height = bottom - y + expandBox;

    //     if (this.m_viewbox == undefined) {
    //         this.m_viewbox = new ShapeFrame(x, y, width, height);
    //         this.m_viewbox.parent = this;
    //         return true;
    //     }
    //     else {
    //         return this.m_viewbox.set(x, y, width, height, false);
    //     }
    // }
    // onIOFinish() {
    //     this.updateViewBox();
    // }

    // initRepo(repo: Repository) {
    //     this.__repo = repo;
    // }

    // get editor(): PageEditor {
    //     if (this.__repo === undefined) {
    //         throw new Error("repo Not initialized!")
    //     }
    //     if (this.__editor === undefined) {
    //         this.__editor = new PageEditor(this.__repo, this.__shadows);
    //     }
    //     return this.__editor;
    // }

    // constructor(lzData: LzData,
    //     type: ShapeType,
    //     name: string,
    //     // nameIsFixed: boolean,
    //     booleanOperation: BooleanOperation,
    //     // isFixedToViewport: boolean,
    //     // isFlippedHorizontal: boolean,
    //     // isFlippedVertical: boolean,
    //     // isLocked: boolean,
    //     // isVisible: boolean,
    //     // layerListExpandedType: LayerListExpandedType,
    //     // maintainScrollPosition: boolean,
    //     exportOptions: ExportOptions,
    //     frame: ShapeFrame,

    //     points: Point[],
    //     imageRef: string) {
    //     super(null, lzData, type, name, booleanOperation, exportOptions, frame, points, imageRef);
    // }

    // initGradients(gradients: Map<string, Gradient>) {
    //     this.m_gradients = gradients;
    // }
    get horizontalRulerData() {
        return this.m_horizontalRulerData;
    }
    get verticalRulerData() {
        return this.m_verticalRulerData;
    }
    // get gradients() {
    // 	return this.m_gradients;
    // }
}