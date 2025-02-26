import { AsyncApiCaller } from "../basic/asyncapi";
import { importShadow } from "../../../data/baseimport";
import { BasicArray, OverrideType, Shadow, VariableType } from "../../../data";
import { PageView, ShapeView } from "../../../dataview";
import { Api } from "../../../coop";
import { override_variable } from "../../symbol";

export class ShadowAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-fills-color');
    }

    getShadowsVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
            const shadows = _var?.value ?? view.getShadows();
            return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
                return importShadow(v);
            }))
        }, api, view)!;
    }

    modifySolidColor(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
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