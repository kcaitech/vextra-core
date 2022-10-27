
import { IPageEdit } from "./iedit";
import { GroupShape, Shape } from "./shape";
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
export class Page extends GroupShape implements IPageEdit {

    // private m_gradients: Map<string, Gradient> | undefined;
    private m_horizontalRulerData: RulerData | undefined;
    private m_verticalRulerData: RulerData | undefined;

    private __shadows: IPageEdit[] = [];
    addShadow(shadow: IPageEdit) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageEdit) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }

    delete(shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.delete(shape);
        })
        throw new Error("Method not implemented.");
    }
    insert(parent: GroupShape, index: number, shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.insert(parent, index, shape);
        })
        throw new Error("Method not implemented.");
    }
    create(parent: GroupShape, type: string): Shape {
        throw new Error("Method not implemented.");
    }
    modify(shape: Shape, attribute: string, value: any): boolean {
        this.__shadows.forEach((s) => {
            s.modify(shape, attribute, value);
        })
        throw new Error("Method not implemented.");
    }
    move(shape: Shape, target: GroupShape, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(shape, target, index);
        })
        throw new Error("Method not implemented.");
    }
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