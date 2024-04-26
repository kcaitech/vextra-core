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
export class Artboard extends GroupShape implements classes.Artboard {
    typeId = 'artboard';
    cornerRadius?: CornerRadius
    haveEdit?: boolean | undefined;
    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        frame: ShapeFrame,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        haveEdit?: boolean
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
    }

    getOpTarget(path: string[]) {
        if (path[0] === 'cornerRadius' && !this.cornerRadius) this.cornerRadius = new CornerRadius(0, 0, 0, 0);
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
