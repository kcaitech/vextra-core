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
    getPathOfRadius,
    Transform,
    ShapeSize,
} from "./shape";
import { Style } from "./style";
import * as classes from "./baseclasses";
import { BasicArray } from "./basic";
import { RadiusType } from "./consts";
import { Guide } from "./baseclasses";
import { Path } from "@kcdesign/path";


export class Artboard extends GroupShape implements classes.Artboard {
    get frame(): ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }

    hasSize(): boolean {
        return true;
    }

    typeId = 'artboard';
    // @ts-ignore
    size: ShapeSize
    cornerRadius?: CornerRadius
    haveEdit?: boolean | undefined;
    guides?: BasicArray<Guide>;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        childs: BasicArray<(GroupShape | Shape | ImageShape | PathShape | RectShape | TextShape)>,
        size: ShapeSize,
        haveEdit?: boolean,
        guides?: BasicArray<Guide>,
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Artboard,
            transform,
            style,
            childs
        )
        this.size = size
        this.haveEdit = haveEdit;
        this.guides = guides;
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
        return this.getPathOfSize(this.size, fixedRadius);
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number | undefined): Path {
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
