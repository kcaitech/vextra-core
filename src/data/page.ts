
import { IPageEditor } from "./ieditor";
import { GroupShape } from "./shape";
import { AtomGroup } from "./transact";

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
    private __shadows: IPageEditor[] = [];
    // private __editor: PageEditor | undefined;
    addShadow(shadow: IPageEditor) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageEditor) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }
    get shadows() { // for editor
        return this.__shadows;
    }

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