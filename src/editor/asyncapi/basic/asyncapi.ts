import { CoopRepository } from "../../../coop/cooprepo";
import { Document, Page } from "../../../data";
import { Api } from "../../../coop/recordapi";
import { PageView, adapt2Shape } from "../../../dataview";

export class AsyncApiCaller {
    __repo: CoopRepository;
    __document: Document;
    api: Api;
    page: Page;
    pageView: PageView;

    exception: boolean = false;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        this.__repo = repo;
        this.__document = document;
        this.pageView = page;
        this.page = adapt2Shape(page) as Page;
        this.api = this.start()
    }

    start() {
        return this.__repo.start('');
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

