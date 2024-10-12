import { CoopRepository } from "../coop";
import { Document, GroupShape, Page, Shape } from "../data";

export function assign(shape: Shape) {
    const parent = shape.parent! as GroupShape;
    const names = parent.childs.map(i => {
        if (i.id !== shape.id) return i.name;
    }).filter(i => i);
}

export class MossClipboardInterface {
    private readonly __repo: CoopRepository;
    private readonly __page: Page;
    private readonly __document: Document;

    constructor(repo: CoopRepository, page: Page, document: Document) {
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    private __assign_set: Set<Shape> = new Set();

    /**
     * @description 根据所属环境重新命名
     */
    private assign() {

    }

    paste(shapes: Shape[], envs?: GroupShape[]) {
        const ENVS = envs ? envs : [this.__page];
    }

}