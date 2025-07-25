/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "../basic/asyncapi";
import { importShadow } from "../../../data/baseimport";
import { BasicArray, OverrideType, Shadow, VariableType } from "../../../data";
import { PageView, ShapeView } from "../../../dataview";
import { Operator } from "../../../operator";
import { override_variable } from "../../symbol";

export class ShadowAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-fills-color');
    }

    getShadowsVariable(op: Operator, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
            const shadows = _var?.value ?? view.getShadows();
            return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
                return importShadow(v);
            }))
        }, op, view)!;
    }

    modifySolidColor(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.operator));
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