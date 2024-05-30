import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Artboard, BasicArray, Document, Guide, GuideAxis, Page, Shape, ShapeType } from "../../data";
import { PageView } from "../../dataview";
import { uuid } from "../../basic/uuid";

export class ReferHandleApiCaller extends AsyncApiCaller {
    private __recovery: boolean = true;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page)

    }

    start() {
        return this.__repo.start('guide-line');
    }

    create(axis: GuideAxis, offset: number) {
        try {
            const page = this.page;

            let index = 0;
            if (page.guides) {
                index = page.guides.length;
            }

            this.api.insertGuideToPage(this.page, new Guide([index] as BasicArray<number>, uuid(), axis, offset));

            this.updateView();
            this.__recovery = false;
            console.log("CREATE SUCCESS");
            return index;
        } catch (e) {
            console.error('ReferHandleApiCaller.create');
            this.exception = true;
            return -1;
        }
    }

    modifyOffset(env: Shape, index: number, offset: number, recovery: boolean) {
        try {
            this.api.modifyGuideOffset(env, index, offset);
            this.__recovery = recovery;
            this.updateView();
            console.log('modifyOffset');
        } catch (e) {
            console.error('ReferHandleApiCaller.modifyOffset');
            this.exception = true;
        }
    }

    migrate(env1: Shape, index1: number, env2: Shape, index2: number) {
        try {
            if (!env1.isContainer || !env2.isContainer || (env1.id === env2.id)) {
                return;
            }
            const guides1 = (env1 as Artboard).guides || [];
            const guides2 = (env2 as Artboard).guides || [];
            const guide1 = guides1[index1];
            const guide2 = guides2[index2];

            if (!guide1 || !guide2) {
                return;
            }

            const api = this.api;
            let gui;
            if (env1.type === ShapeType.Page) {
                gui = api.deleteGuideFromPage(env1 as Page, index1);
            } else {
                gui = api.deleteGuide(env1, index1);
            }

            if (!gui) {
                this.exception = true;
                return;
            }

            if (env2.type === ShapeType.Page) {
                api.insertGuideToPage(env2 as Page, gui);
            } else {
                api.insertGuide(env2, gui);
            }

        } catch (e) {
            console.error('ReferHandleApiCaller.migrate');
            this.exception = true;
        }
    }

    commit() {
        console.log('=RECOVERY=', this.__recovery);
        if (this.__repo.isNeedCommit() && !this.exception && !this.__recovery) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}