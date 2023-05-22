import { Page } from "../data/page";
import { Document } from "../data/document";
import { Repository } from "../data/transact";
import { PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportPage } from "../io/baseexport";
import { importPage, IImportContext } from "../io/baseimport";
import { IExportContext } from "../io/baseexport";
import { newDocument } from "./creator";

export function createDocument(documentName: string, repo: Repository): Document {
    return newDocument(documentName, repo);
}
class ExfContext implements IExportContext {
    afterExport(obj: any): void {
        if (!obj.typeId) {
            //
        }
        else if (obj.typeId === 'symbol-ref-shape') {
            this.symbols.add(obj.refId)
            this.allsymbols.add(obj.refId)
        }
        else if (obj.typeId === 'image-shape') {
            this.allmedias.add(obj.imageRef)
        }
        else if (obj.typeId === 'artboard-ref') {
            this.artboards.add(obj.refId)
            this.allartboards.add(obj.refId)
        }
    }

    symbols = new Set<string>()
    artboards = new Set<string>()

    allmedias = new Set<string>()
    allartboards = new Set<string>();
    allsymbols = new Set<string>();
}
const noeffectCtx = new class implements IImportContext {
    afterImport(obj: any): void { }
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
            const isSuccess = pagesmgr.deletePage(id);
            if (isSuccess) {
                this.__repo.commit({});
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
            this.__repo.commit({});
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
        const ectx = new ExfContext();
        const np = exportPage(ectx, page);
        const p: Page = importPage(noeffectCtx, np);
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
            if (to !== idx && target) {
                const descend = idx > to ? to : to - 1;
                this.__document.pagesList.splice(idx, 1);
                this.__document.pagesList.splice(descend, 0, target);
            }
            this.__repo.commit({});
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
                    this.__repo.commit({});
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