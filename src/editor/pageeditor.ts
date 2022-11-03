import { IPageEditor } from "../data/ieditor";
import { Shape, GroupShape } from "../data/shape";
import { isProxy, Repository } from "../data/transact";

export class PageEditor implements IPageEditor {
    private __shadows: IPageEditor[];
    private __repo: Repository;
    // private __selection: Selection;
    constructor(repo: Repository, shadows: IPageEditor[]) {
        this.__repo = repo;
        this.__shadows = shadows;
        // this.__selection = selection;
    }

    group(shapes: Shape[]): boolean {
        throw new Error("Method not implemented.");
    }
    ungroup(shape: Shape): boolean {
        throw new Error("Method not implemented.");
    }

    addShadow(shadow: IPageEditor) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IPageEditor) {
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
        if (!isProxy(shape)) {
            //
            // throw new Error("shape not ready to edit.")
            shape = this.__repo.proxy(shape);
        }
        this.__repo.startTransact(attribute, {});
        switch(attribute) {
            case "x": shape.frame.x = value; break;
            case "y": shape.frame.y = value; break;
            case "w": shape.frame.width = value; break;
            case "h": shape.frame.height = value; break;
            default: this.__repo.rollbackTransact(); return false;
        }
        this.__repo.commitTransact({});
        this.__shadows.forEach((s) => {
            s.modify(shape, attribute, value);
        })
        shape.notify();
        return true;
        // throw new Error("Method not implemented.");
    }
    move(shape: Shape, target: GroupShape, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(shape, target, index);
        })
        throw new Error("Method not implemented.");
    }
}