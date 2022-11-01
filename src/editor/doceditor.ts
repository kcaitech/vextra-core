import { IDocEditor } from "../data/ieditor";
import { Page } from "../data/page";
import { Repository } from "../data/transact";

export class DocEditor implements IDocEditor {
    private __shadows: IDocEditor[];
    private __repo: Repository;

    constructor(repo: Repository, shadows: IDocEditor[]) {
        this.__repo = repo;
        this.__shadows = shadows;
    }
    addShadow(shadow: IDocEditor) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IDocEditor) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }

    delete(page: Page): boolean {
        this.__shadows.forEach((s) => {
            s.delete(page);
        })
        throw new Error("Method not implemented.");
    }
    insert(index: number, page: Page): boolean {
        this.__shadows.forEach((s) => {
            s.insert(index, page);
        })
        throw new Error("Method not implemented.");
    }
    create(): Page {
        throw new Error("Method not implemented.");
    }
    modify(page: Page, attribute: string, value: any): boolean {
        this.__shadows.forEach((s) => {
            s.modify(page, attribute, value);
        })
        throw new Error("Method not implemented.");
    }
    move(page: Page, index: number): boolean {
        this.__shadows.forEach((s) => {
            s.move(page, index);
        })
        throw new Error("Method not implemented.");
    }
}