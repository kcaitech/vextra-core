import { Page } from "../data/page";
import { Document } from "../data/document";
import { Repository } from "../data/transact";
import { PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportPage } from "../io/baseexport";
import { importPage } from "../io/baseimport";
import { newDocument } from "./creator";
import { PageCmdDelete, PageCmdInsert, PageCmdMove } from "../coop/data/classes";

export function createDocument(documentName: string, repo: Repository): Document {
    return newDocument(documentName, repo);
}

export class DocEditor {
    private __repo: Repository;
    private __document: Document;
    constructor(document: Document, repo: Repository) {
        this.__repo = repo;
        this.__document = document;
    }
    // 删除页面
    delete(id: string): boolean {
        this.__repo.start('deletepage', {});
        const pagesmgr = this.__document;
        try {
            const index = pagesmgr.indexOfPage(id);
            const isSuccess = pagesmgr.deletePage(id);
            if (isSuccess) {
                this.__repo.commit(PageCmdDelete.Make(this.__document.id, index));
                return true;
            } else {
                this.__repo.rollback();
                return false;
            }
        } catch (error) {
            this.__repo.rollback();
        }
        return true;
    }
    // 插入页面
    insert(index: number, page: Page): boolean {
        this.__repo.start('insertpage', {});
        const pagesmgr = this.__document;
        try {
            pagesmgr.insertPage(index, page);
            const np = exportPage(page);
            this.__repo.commit(PageCmdInsert.Make(this.__document.id, index, JSON.stringify(np)));
        } catch (error) {
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
        this.__repo.start('pagemove', {});
        try {
            const pagesmgr = this.__document.pagesMgr;
            const target = pagesmgr.getPageMetaById(page.id);
            const idx = pagesmgr.getPageIndexById(page.id);
            const descend = idx > to ? to : to - 1;
            if (to !== idx && target) {
                this.__document.pagesList.splice(idx, 1);
                this.__document.pagesList.splice(descend, 0, target);
            }
            this.__repo.commit(PageCmdMove.Make(this.__document.id, idx, descend));
        } catch (e) {
            this.__repo.rollback();
        }
        return true;
    }
    // 页面列表拖拽
    pageListDrag(wandererId: string, hostId: string, offsetOverhalf: boolean) {
        const pages = this.__document.pagesList;
        try {
            this.__repo.start('pagemove', {});
            const wandererIdx = pages.findIndex(i => i.id === wandererId);
            if (wandererIdx > -1) {
                const wanderer = pages[wandererIdx];
                pages.splice(wandererIdx, 1);
                let hostIdx = pages.findIndex(i => i.id === hostId);
                if (hostIdx > -1) {
                    hostIdx = offsetOverhalf ? hostIdx + 1 : hostIdx;
                    pages.splice(hostIdx, 0, wanderer);
                    this.__repo.commit(PageCmdMove.Make(this.__document.id, wandererIdx, hostIdx));
                } else {
                    this.__repo.rollback();
                }
            } else {
                this.__repo.rollback();
            }
        } catch (error) {
            this.__repo.rollback();
        }
    }
}