import {
    GroupShape,
    ImageShape,
    PathShape,
    RectShape,
    Shape,
    ShapeFrame,
    ShapeType,
    TextShape,
    CornerRadius,
    getPathOfRadius
} from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { Path } from "./path";
import { RadiusType } from "./consts";
import { Guide,PrototypeInterAction } from "./baseclasses";


export class Artboard extends GroupShape implements classes.Artboard {
    typeId = 'artboard';
    cornerRadius?: CornerRadius
    haveEdit?: boolean | undefined;
    guides?: BasicArray<Guide>;
    prototypeStartingPoint?: classes.PrototypeStartingPoint;
    prototypeInteractions?: BasicArray<PrototypeInterAction>;
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        haveEdit?: boolean,
        guides?: BasicArray<Guide>,
        prototypeStartingPoint?: classes.PrototypeStartingPoint,
        prototypeInteractions?: BasicArray<classes.PrototypeInterAction>

    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Artboard,
            frame,
            style,
            childs
        )
        this.haveEdit = haveEdit;
        this.guides = guides;
        this.prototypeStartingPoint = prototypeStartingPoint
        this.prototypeInteractions = prototypeInteractions
    }

    getOpTarget(path: string[]) {
        const id0 = path[0];
        if (id0 === 'cornerRadius' && !this.cornerRadius) this.cornerRadius = new CornerRadius(0, 0, 0, 0);
        if (id0 === "guides" && !this.guides) {
            this.guides = new BasicArray<Guide>();
        }
        return super.getOpTarget(path);
    }

    getPath(fixedRadius?: number): Path {
        return this.getPathOfFrame(this.frame, fixedRadius);
    }

    getPathOfFrame(frame: classes.ShapeFrame, fixedRadius?: number | undefined): Path {
        return getPathOfRadius(frame, this.cornerRadius, fixedRadius);
    }

    get isContainer() {
        return true;
    }

    get radius(): number[] {
        return [
            this.cornerRadius?.lt || 0,
            this.cornerRadius?.rt || 0,
            this.cornerRadius?.rb || 0,
            this.cornerRadius?.lb || 0,
        ];
    }

    get radiusType() {
        return RadiusType.Rect;
    }
}
