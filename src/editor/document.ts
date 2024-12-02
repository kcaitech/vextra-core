import { Page } from "../data/page";
import { Document } from "../data/document";
import { PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportPage } from "../data/baseexport";
import { IImportContext, importPage } from "../data/baseimport";
import { newDocument } from "./creator";
import { CoopRepository } from "../coop/cooprepo";
import { Repository } from "../data/transact";
import * as types from "../data/typesdefine";
import { FMT_VER_latest } from "../data/fmtver";

export function createDocument(documentName: string, repo: Repository): Document {
    return newDocument(documentName, repo);
}

export class DocEditor {
    private __repo: CoopRepository;
    private __document: Document;

    constructor(document: Document, repo: CoopRepository) {
        // check
        if (!(repo instanceof CoopRepository)) throw new Error("repo wrong");
        if (!(document instanceof Document)) throw new Error("document wrong");

        this.__repo = repo;
        this.__document = document;
    }

    // 删除页面
    delete(id: string): boolean {
        const pagesmgr = this.__document;
        const index = pagesmgr.indexOfPage(id);
        if (index < 0) return false;
        const api = this.__repo.start('deletepage');
        try {
            api.pageDelete(this.__document, index);

            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    // 插入页面
    insert(index: number, page: Page): boolean {
        const api = this.__repo.start('insertpage');
        try {
            api.pageInsert(this.__document, page, index);
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    // 创建页面
    create(name: string): Page {
        return newPage(name)
    }

    // 新建副本
    copy(page: Page, name: string): Page {
        const np = exportPage(page);
        np.name = name;

        // 拷贝页面的过程，所有图层ID都需要重制，以图层ID作为属性值的属性需要通过原图层ID映射到新的图层ID
        const refs: types.SymbolRefShape[] = []; // 实例图层
        const contacts: types.ContactShape[] = []; // 连接线图层
        const contactApex: types.Shape[] = []; // 被连接线关联的图层
        const prototypeInterAction: types.Shape[] = []
        // todo 其它以图层ID为值的属性

        const idReflex = new Map<string, string>(); // 旧ID -> 新ID
        const idReflexInverse = new Map<string, string>(); // 新ID -> 旧ID

        const replaceId = (shape: types.Shape) => {
            const id = uuid();
            if (shape.typeId === 'symbol-ref-shape') {
                refs.push(shape as types.SymbolRefShape);
            }
            if (shape.typeId === 'contact-shape') {
                contacts.push(shape as types.ContactShape);
            }
            if (shape.style.contacts?.length) {
                contactApex.push(shape);
            }
            if (shape.prototypeInteractions?.length) {
                prototypeInterAction.push(shape)
            }

            idReflex.set(shape.id, id);
            idReflexInverse.set(id, shape.id);
            shape.id = id;

            const g = shape as types.GroupShape;
            if (Array.isArray(g.childs)) {
                g.childs.forEach(c => replaceId(c));
            }
        }
        replaceId(np);

        // 实例图层重新根据id指向组件
        refs.forEach(ref => {
            const refId = ref.refId;
            const newId = idReflex.get(refId);
            if (newId) ref.refId = newId;
        })
        // 连接线根据id重新关联图层
        contacts.forEach(contact => {
            if (contact.from) {
                const newFromId = idReflex.get(contact.from.shapeId);
                if (newFromId) contact.from.shapeId = newFromId;
            }
            if (contact.to) {
                const newToId = idReflex.get(contact.to.shapeId);
                if (newToId) contact.to.shapeId = newToId;
            }
        })
        // 图层根据id重新绑定连接线
        contactApex.forEach(shape => {
            if (shape.style.contacts?.length) {
                shape.style.contacts.forEach(role => {
                    const newRoleId = idReflex.get(role.shapeId);
                    if (newRoleId) role.shapeId = newRoleId;
                })
            }
        })

        //重新绑定原型的targetid
        prototypeInterAction.forEach(shape => {
            if (shape.prototypeInteractions?.length) {
                shape.prototypeInteractions.forEach(action => {
                    if (action.actions.targetNodeID) {
                        const newTargetid = idReflex.get(action.actions.targetNodeID);
                        if (newTargetid) action.actions.targetNodeID = newTargetid;
                    }
                })
            }
        })

        const document = this.__document;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = np.id;
            fmtVer: string = FMT_VER_latest
        };
        return importPage(np, ctx);
    }

    // 移动页面
    move(page: PageListItem, to: number): boolean {
        const api = this.__repo.start('page-move');
        try {
            const idx = this.__document.getPageIndexById(page.id);
            const descend = idx >= to ? to : to + 1;
            if (to !== idx) {
                api.pageMove(this.__document, idx, descend)
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e)
            this.__repo.rollback();
        }
        return true;
    }

    // 页面列表拖拽
    pageListDrag(wandererId: string, hostId: string, offsetOverHalf: boolean) {
        try {
            const pages = this.__document.pagesList;
            const wandererIdx = pages.findIndex(i => i.id === wandererId);
            let hostIdx = pages.findIndex(i => i.id === hostId);
            const api = this.__repo.start('page-move');
            hostIdx = Math.max(0, offsetOverHalf ? hostIdx + 1 : hostIdx);
            api.pageMove(this.__document, wandererIdx, hostIdx);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    // 新增页面
    insertPage(name: string, index: number) {
        const page = newPage(name);
        const result = this.insert(index, page);
        if (result) return page;
    }

    setPageName(name: string, pageId: string) {
        const api = this.__repo.start("setPageName");
        try {
            api.pageModifyName(this.__document, pageId, name);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    rename(name: string) {
        try {
            const api = this.__repo.start('document-rename');
            api.modifyDocumentName(this.__document, name)
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

}