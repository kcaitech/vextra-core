import { IDocShadow, IPageShadow } from "@/data/ishadow";
import { Page } from "@/data/page";
import { Shape, GroupShape } from "@/data/shape";

export class DocShadowDisp implements IDocShadow {
    private __shadows: IDocShadow[];

    constructor(shadows: IDocShadow[]) {
        this.__shadows = shadows;
    }
    delete(page: Page): boolean {
        this.__shadows.forEach((s) => {
            s.delete(page);
        })
        return true;
    }
    insert(index: number, page: Page): boolean {
        this.__shadows.forEach((s) => {
            s.insert(index, page);
        })
        return true;
    }
    modify(page: Page, attribute: string, value: any): boolean {
        this.__shadows.forEach((s) => {
            s.modify(page, attribute, value);
        })
        return true;
    }
    move(page: Page, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(page, index);
        })
        return true;
    }
}

// shadow dispatcher
export class PageShadowDisp implements IPageShadow {
    private __shadows: IPageShadow[];
    // private __selection: Selection;
    constructor(shadows: IPageShadow[]) {
        this.__shadows = shadows;
        // this.__selection = selection;
    }
    delete(shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.delete(shape);
        })
        return true;
    }
    insert(parent: GroupShape, index: number, shape: Shape): boolean {
        this.__shadows.forEach((s) => {
            s.insert(parent, index, shape);
        })
        return true;
    }
    modify(shape: Shape, attribute: string, value: any): boolean {
        this.__shadows.forEach((s) => {
            s.modify(shape, attribute, value);
        })
        // shape.notify();
        return true;
        // throw new Error("Method not implemented.");
    }
    move(shape: Shape, target: GroupShape, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(shape, target, index);
        })
        return true;
    }
}