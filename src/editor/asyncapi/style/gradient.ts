/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { IRepository, Api } from "../../../repo";
import { BasicArray, Fill, OverrideType, VariableType } from "../../../data";
import { PageView, ShapeView } from "../../../dataview";
import { override_variable } from "../../symbol";
import { importBorder, importFill, importGradient, importStop } from "../../../data/baseimport";

export class GradientEditor {
    private __repo: IRepository;
    private exception: boolean = false;

    importGradient = importGradient;
    importStop = importStop;

    getFillsVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
            const fills = _var?.value ?? view.getFills();
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                    const ret = importFill(v);
                    const imgmgr = v.getImageMgr();
                    if (imgmgr) ret.setImageMgr(imgmgr)
                    return ret;
                }
            ))
        }, api, view)!;
    }

    getBorderVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            return importBorder(_var?.value ?? view.getBorder());
        }, api, view)!;
    }

    constructor(repo: IRepository) {
        this.__repo = repo;
    }

    start() {
        return this.__repo.start('async-gradient-editor');
    }

    private m_api: Api | undefined;

    get api(): Api {
        return this.m_api ?? (this.m_api = this.__repo.start('async-gradient-editor'));
    }

    createStop(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyFrom(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyTo(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyEllipseLength(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyStopPosition(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    updateView() {
        this.__repo.fireNotify();
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
        this.m_api = undefined;
    }
}