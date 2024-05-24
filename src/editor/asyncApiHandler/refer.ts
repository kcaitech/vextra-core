import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView } from "../../dataview";

export class ReferHandleApiCaller extends AsyncApiCaller {

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page)

    }

    start() {
        return this.__repo.start('refer-line-action');
    }

    execute() {
        try {

        } catch (e) {
            console.error('ReferHandleApiCaller.execute');
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {

            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}