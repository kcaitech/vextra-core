import { Selection } from "@/context/selection";
import { Document } from "@/data/document";
import { Page } from "@/data/page";
import { Shape } from "@/data/shape";
import { Repository } from "@/data/transact";
import { Creator } from "./creator";
import { DocEditor } from "./document";
import { PageEditor } from "./page";
import { ShapeEditor } from "./shape";

export { DocEditor } from "./document";
export { PageEditor } from "./page";

export class Editor {
    private m_data: Document;
    private m_selection: Selection;
    private m_repo: Repository;
    // private m_shadows: ShapeNaviShadowMgr | undefined;
    private m_docEditor: DocEditor | undefined;
    private m_pageEditors: Map<string, PageEditor> = new Map();
    private m_creator: Creator;

    constructor(data: Document, selection: Selection) {
        // this.m_data = data;
        this.m_selection = selection;
        this.m_repo = new Repository(this.m_selection);
        this.m_data = this.m_repo.makeProxy(data);
        this.m_creator = new Creator();
    }

    editor4Doc(): DocEditor {
        if (this.m_docEditor === undefined) {
            this.m_docEditor = new DocEditor(this.m_repo as Repository, this.m_data.shadows)
        }
        return this.m_docEditor;
    }

    editor4Page(page: Page): PageEditor {
        let e = this.m_pageEditors.get(page.id);
        if (e) {
            return e;
        }
        e = new PageEditor(this.m_repo as Repository, this.m_creator, page.shadows);
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
    
    get data() {
        return this.m_data;
    }
    get repo() {
        return this.m_repo;
    }
    get selection() {
        return this.m_selection;
    }
}