import { IPageShadow } from "../data/ishadow";
import { Shape, GroupShape } from "../data/shape";
import { isProxy, Repository } from "../data/transact";
import { PageSDisp } from "./sdispatcher";
import { ShapeEditor } from "./shapeeditor";

export class PageEditor {
    private __shadows: IPageShadow[];
    private __shadowDisp: PageSDisp;
    private __repo: Repository;
    // private __selection: Selection;
    constructor(repo: Repository, shadows: IPageShadow[]) {
        this.__repo = repo;
        this.__shadows = shadows;
        this.__shadowDisp = new PageSDisp(shadows);
        // this.__selection = selection;
    }
    group(shapes: Shape[]): boolean {
        throw new Error("Method not implemented.");
    }
    ungroup(shape: Shape): boolean {
        throw new Error("Method not implemented.");
    }

    addShadow(shadow: IPageShadow) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageShadow) {
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
    move(shape: Shape, target: GroupShape, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(shape, target, index);
        })
        throw new Error("Method not implemented.");
    }
    editorFor(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__repo, this.__shadowDisp);
    }
}