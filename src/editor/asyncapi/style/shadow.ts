import { AsyncApiCaller } from "../basic/asyncapi";
import { Color, Shadow } from "../../../data";

export class ShadowAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-fills-color');
    }

    modifySolidColor(actions: { shadow: Shadow, color: Color }[]) {
        try {
            for (const t of actions) this.api.setShadowColor(t.shadow, t.color);
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