/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document } from "../data/document";
import { DocEditor } from "./document";
import { PageEditor } from "./page";
import { ShapeEditor } from "./shape";
import { Controller } from "./controller"; /* 逐步取消Controller */
import { CoopRepository } from "../coop/cooprepo";
import { TextShapeEditor } from "./textshape";
import { TableEditor } from "./table";
import { resizingConstraintEditor } from "./resizingConstraint";
import { ISave4Restore } from "../coop/localcmd";
import { PageView, ShapeView, TableCellView, TableView, TextShapeView } from "../dataview";
import { Page } from "../data/page";

export * from "./utils/auto_layout"
export * from "./utils/auto_layout2"

export { DocEditor } from "./document";
export { PageEditor } from "./page";

export { RefUnbind } from "./symbol"

export { ContactLineModifier } from "./contact";

export class Editor {
    private m_data: Document;
    // private m_selection: Selection;
    private m_repo: CoopRepository;
    // private m_shadows: ShapeNaviShadowMgr | undefined;
    private m_docEditor: DocEditor | undefined;
    // private m_pageEditors: Map<string, PageEditor> = new Map();

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

    editor4Page(page: PageView): PageEditor {
        // let e = this.m_pageEditors.get(page.id);
        // if (e) {
        //     return e;
        // }
        // e = new PageEditor(this.m_repo, page.data, this.m_data);
        // this.m_pageEditors.set(page.id, e);
        // return e;
        if ((!page.data) || (!(page.data instanceof Page))) throw Error("page.data is not Page!")
        return new PageEditor(this.m_repo, page, this.m_data);
    }

    editor4Shape(page: PageView, shape: ShapeView): ShapeEditor {
        // get page
        // const p: ShapeView | undefined = shape.getPage();
        // if ((!p) || (!(p instanceof PageView))) throw Error("shape has not parent Page!")
        // const pe = this.editor4Page(p);
        // return pe.editor4Shape(shape);
        return new ShapeEditor(shape, page, this.m_repo, this.m_data);
    }

    editor4TextShape(page: PageView, shape: TextShapeView | TableCellView): TextShapeEditor {
        // get page
        // const p: ShapeView | undefined = shape.getPage();
        // if ((!p) || (!(p instanceof PageView))) throw Error("shape has not parent Page!")
        // const pe = this.editor4Page(p);
        // return pe.editor4TextShape(shape);
        return new TextShapeEditor(shape, page, this.m_repo, this.m_data);
    }
    editor4Table(page: PageView, shape: TableView): TableEditor {
        // get page
        // const p: ShapeView | undefined = shape.getPage();
        // if ((!p) || (!(p instanceof PageView))) throw Error("shape has not parent Page!")
        // const pe = this.editor4Page(p);
        // return pe.editor4Table(shape);
        return new TableEditor(shape, page, this.m_repo, this.m_data);
    }
    controller(): Controller {
        const e = new Controller(this.m_repo, this.data);
        return e;
    }
    editor4ResizingConstraint(page: Page) {
        return new resizingConstraintEditor(page, this.m_repo, this.data);
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