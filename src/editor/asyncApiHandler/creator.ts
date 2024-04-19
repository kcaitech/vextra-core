// 创建一个没有痛苦的Creator
import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { PageView } from "../../dataview";

export class CreatorApiCaller extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('create-shape');
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {

            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}