import { CoopRepository } from "../../editor/coop/cooprepo";
import { Document } from "../../data/document";
import { Api } from "../../editor/coop/recordapi";
import { Page } from "../../data/page";
import { PageView, adapt2Shape } from "../../dataview";
import { ISave4Restore, LocalCmd } from "editor/coop/localcmd";

export type FrameLike = {
    x: number;
    y: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

export class AsyncApiCaller {
    __repo: CoopRepository;
    __document: Document;
    api: Api;
    page: Page;

    exception: boolean = false;

    constructor(repo: CoopRepository, document: Document, page: PageView, desc: string) {
        this.__repo = repo;
        this.__document = document;

        this.page = adapt2Shape(page) as Page;

        this.api = this.start(desc)
    }

    start(desc: string) {
        return this.__repo.start(desc);
    }

    updateView() {
        this.__repo.transactCtx.fireNotify();
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}

