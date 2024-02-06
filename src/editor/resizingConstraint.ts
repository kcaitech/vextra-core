import { Page } from "data/page";
import { Document } from "../data/classes";
import { Shape } from "data/typesdefine";
import { CoopRepository } from "./coop/cooprepo";

export class resizingConstraintEditor {
    protected __repo: CoopRepository;
    protected __page: Page;
    protected __document: Document;

    constructor(page: Page, repo: CoopRepository, document: Document) {
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    modifyResizingConstraint(shapes: Shape[]) {}

    toggleFixedToLeft(shapes: Shape[]) {
        
    }
}