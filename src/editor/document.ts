import { Page } from "../data/page";
import { Document } from "../data/document";
import { PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportPage } from "../data/baseexport";
import { importPage } from "../data/baseimport";
import { newDocument } from "./creator";
import { CoopRepository } from "./coop/cooprepo";
import { Repository } from "../data/transact";

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
        const p: Page = importPage(np);
        p.name = name;
        p.id = uuid();
        return p;
    }
    // 移动页面
    move(page: PageListItem, to: number): boolean {
        const api = this.__repo.start('pagemove');
        try {
            // const pagesmgr = this.__document.pagesMgr;
            const idx = this.__document.getPageIndexById(page.id);
            const descend = idx >= to ? to : to + 1;
            if (to !== idx) {
                api.pageMove(this.__document, page.id, idx, descend)
            }
            this.__repo.commit();
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return true;
    }
    // 页面列表拖拽
    pageListDrag(wandererId: string, hostId: string, offsetOverhalf: boolean) {
        const pages = this.__document.pagesList;
        const wandererIdx = pages.findIndex(i => i.id === wandererId);
        let hostIdx = pages.findIndex(i => i.id === hostId);
        if (wandererIdx < 0 || hostIdx < 0) return;
        try {
            const api = this.__repo.start('pagemove');
            hostIdx = offsetOverhalf ? hostIdx + 1 : hostIdx;
            // if (wandererIdx <= hostIdx) hostIdx--;
            api.pageMove(this.__document, wandererId, wandererIdx, hostIdx);
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
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

}