import { AsyncApiCaller } from "../basic/asyncapi";
import { Color } from "../../../data";

export class backgorundAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-backgorund-color');
    }

    modifySolidColor(actions: { color: Color }[]) {
        try {
            for (const t of actions) this.api.pageModifyBackground(this.__document, this.page.id, t.color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
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