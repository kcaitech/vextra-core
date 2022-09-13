
import { GroupShape } from "./shape";

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

export class Page extends GroupShape {
    // private m_gradients: Map<string, Gradient> | undefined;
    private m_horizontalRulerData: RulerData | undefined;
    private m_verticalRulerData: RulerData | undefined;

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