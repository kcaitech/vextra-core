import { CoopRepository } from "../../editor/coop/cooprepo";
import { Document } from "../../data/document";
import { Api } from "../../editor/coop/recordapi";
import { Page } from "../../data/page";
import { PageView, adapt2Shape } from "../../dataview";

export type FrameLike = { x: number, y: number, width: number, height: number };

export class AsyncApiCaller {
    __repo: CoopRepository;
    __document: Document;
    api: Api;
    page: Page;

    constructor(repo: CoopRepository, document: Document, page: PageView, desc: string) {
        this.__repo = repo;
        this.__document = document;

        this.api = repo.start(desc);
        this.page = adapt2Shape(page) as Page;
    }

    updateView() {
        this.__repo.transactCtx.fireNotify();
    }

    rollback() {
        this.__repo.rollback();
    }

    commit() {
        if (this.__repo.isNeedCommit()) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}

