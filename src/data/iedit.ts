import { Page } from "./page";
import { GroupShape, Shape } from "./shape";

export interface IDocEdit {
    delete(page: Page): boolean;
    insert(index: number, page: Page): boolean;
    // create(): Page;
    modify(page: Page, attribute: string, value: any): boolean;
    move(page: Page, index: number): boolean;
}

export interface IPageEdit {
    delete(shape: Shape): boolean;
    insert(parent: GroupShape, index: number, shape: Shape): boolean;
    // create(parent: GroupShape, type: string): Shape;
    modify(shape: Shape, attribute: string, value: any): boolean;
    move(shape: Shape, target: GroupShape, index: number): boolean;
}

export interface ITextEdit {
    // todo
}