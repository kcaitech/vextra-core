import { CoopRepository } from "../coop";
import { Document, GroupShape, Page, Shape } from "../data";

export function assign(shape: Shape) {
    const parent = shape.parent as GroupShape;

    const names: Set<string> = new Set();
    for (const view of parent.childs) {
        if (view.id === shape.id) continue;
        names.add(view.name);
    }

    const reg = /\d+$/i
    let name = shape.name;
    while (names.has(name)) {
        const match = name.match(reg)
        name = match ? name + Number(match[0] + 1) : name + 1;
    }
    return name;
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