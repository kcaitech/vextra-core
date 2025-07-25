import { Document } from "../data/document";
import { DocEditor } from "./document";
import { PageEditor } from "./page";
import { ShapeEditor } from "./shape";
import { Controller } from "./controller"; /* 逐步取消Controller */
import { IRepository } from "../repo";
import { TextShapeEditor } from "./textshape";
import { TableEditor } from "./table";
import { ResizingConstraintEditor } from "./resizingconstraint";
import { ISave4Restore } from "../repo";
import { PageView, ShapeView, TableCellView, TableView, TextShapeView } from "../dataview";
import { Page } from "../data/page";

export class Editor {
    private m_data: Document;
    private m_repo: IRepository;
    private m_docEditor: DocEditor | undefined;

    constructor(data: Document, repo: IRepository, selection: ISave4Restore) {
        this.m_data = data;
        this.m_repo = repo;
    }

    editor4Doc(): DocEditor {
        if (this.m_docEditor === undefined) {
            this.m_docEditor = new DocEditor(this.m_data, this.m_repo);
        }
        return this.m_docEditor;
    }

    editor4Page(page: PageView): PageEditor {
        if ((!page.data) || (!(page.data instanceof Page))) throw Error("page.data is not Page!")
        return new PageEditor(this.m_repo, page, this.m_data);
    }

    editor4Shape(page: PageView, shape: ShapeView): ShapeEditor {
        return new ShapeEditor(shape, page, this.m_repo, this.m_data);
    }

    editor4TextShape(page: PageView, shape: TextShapeView | TableCellView): TextShapeEditor {
        return new TextShapeEditor(shape, page, this.m_repo, this.m_data);
    }
    editor4Table(page: PageView, shape: TableView): TableEditor {
        return new TableEditor(shape, page, this.m_repo, this.m_data);
    }
    controller(): Controller {
        const e = new Controller(this.m_repo, this.data);
        return e;
    }
    editor4ResizingConstraint(page: Page) {
        return new ResizingConstraintEditor(page, this.m_repo, this.data);
    }

    get data() {
        return this.m_data;
    }
    get repo() {
        return this.m_repo;
    }
}