import { Document } from "../data/document";
import { Page } from "../data/page";
import { Shape, TextShape } from "../data/shape";
import { ISave4Restore } from "../data/basic";
import { DocEditor } from "./document";
import { PageEditor } from "./page";
import { ShapeEditor } from "./shape";
import { Controller } from "./controller";
import { CoopRepository } from "./command/cooprepo";
import { TextShapeEditor } from "./textshape";

export { DocEditor } from "./document";
export { PageEditor } from "./page";

export class Editor {
    private m_data: Document;
    // private m_selection: Selection;
    private m_repo: CoopRepository;
    // private m_shadows: ShapeNaviShadowMgr | undefined;
    private m_docEditor: DocEditor | undefined;
    private m_pageEditors: Map<string, PageEditor> = new Map();

    constructor(data: Document, repo: CoopRepository, selection: ISave4Restore) {
        this.m_data = data;
        // this.m_selection = selection;
        this.m_repo = repo;
    }

    editor4Doc(): DocEditor {
        if (this.m_docEditor === undefined) {
            this.m_docEditor = new DocEditor(this.m_data, this.m_repo);
        }
        return this.m_docEditor;
    }

    editor4Page(page: Page): PageEditor {
        let e = this.m_pageEditors.get(page.id);
        if (e) {
            return e;
        }
        e = new PageEditor(this.m_repo, page, this.m_data);
        this.m_pageEditors.set(page.id, e);
        return e;
    }

    editor4Shape(shape: Shape): ShapeEditor {
        // get page
        let p: Shape | undefined = shape;
        while (p && (!(p instanceof Page))) {
            p = p.parent;
        }
        if (!p) throw Error("shape has not parent Page!")
        const pe = this.editor4Page(p as Page);
        return pe.editor4Shape(shape);
    }

    editor4TextShape(shape: TextShape): TextShapeEditor {
        // get page
        let p: Shape | undefined = shape;
        while (p && (!(p instanceof Page))) {
            p = p.parent;
        }
        if (!p) throw Error("shape has not parent Page!")
        const pe = this.editor4Page(p as Page);
        return pe.editor4TextShape(shape);
    }
    controller(): Controller {
        const e = new Controller(this.m_repo, this.data);
        return e;
    }

    get data() {
        return this.m_data;
    }
    get repo() {
        return this.m_repo;
    }
    // get selection() {
    //     return this.m_selection;
    // }
}