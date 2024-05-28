import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { BasicArray, Document } from "../../data";
import { PageView } from "../../dataview";
import { ReferLine } from "../../data/baseclasses";
import { uuid } from "../../basic/uuid";

export class ReferHandleApiCaller extends AsyncApiCaller {
    private referLine: ReferLine | undefined;
    private referId: string = '';

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page)

    }

    start() {
        return this.__repo.start('refer-line-action');
    }

    create(direction: 'hor' | 'ver') {
        try {
            const page = this.page;
            let cid = 0;
            if (direction === "hor" && page.horReferLines) {
                cid = page.horReferLines.length;
            }
            if (direction === "ver" && page.verReferLines) {
                cid = page.verReferLines.length;
            }

            this.api.insertReferLine(this.page, new ReferLine([cid] as BasicArray<number>, uuid(), 0), direction);

            this.updateView();

            return cid;
        } catch (e) {
            console.error('ReferHandleApiCaller.create');
            this.exception = true;
        }
    }

    private __recovery: boolean = true;

    modifyOffset(direction: 'hor' | 'ver', index: number, offset: number, recovery: boolean) {
        try {
            this.__recovery = recovery;
            this.api.modifyReferLineOffset(this.page, direction, index, offset);

            this.updateView();
        } catch (e) {
            console.error('ReferHandleApiCaller.modifyOffset');
            this.exception = true;
        }
    }

    modifyReferId(direction: 'hor' | 'ver', index: number, referId: string) {
        try {
            if (this.referId === referId) return;

            this.referId = referId;
            this.api.modifyReferLineReferId(this.page, direction, index, referId);
            this.updateView();
        } catch (e) {
            console.error('ReferHandleApiCaller.modifyReferId');
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception && !this.__recovery) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}