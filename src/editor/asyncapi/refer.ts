/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Artboard, BasicArray, Document, Guide, GuideAxis, Page, ShapeType } from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { uuid } from "../../basic/uuid";
import { importGuide } from "../../data/baseimport";
import { exportGuide } from "../../data/baseexport";

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
            // console.log("CREATE SUCCESS：", this.page.name, this.page.guides);
            return index;
        } catch (e) {
            console.error('ReferHandleApiCaller.create');
            this.exception = true;
            return -1;
        }
    }

    modifyOffset(_env: ShapeView, index: number, offset: number, recovery: boolean) {
        try {
            const env = adapt2Shape(_env);
            this.api.modifyGuideOffset(env, index, offset);
            this.__recovery = recovery;
            this.updateView();
        } catch (e) {
            console.error('ReferHandleApiCaller.modifyOffset');
            this.exception = true;
        }
    }

    delete(_env: ShapeView, index: number) {
        try {
            const env = adapt2Shape(_env);

            const gui = (env as Artboard)?.guides?.[index];
            if (!gui) return false;

            if (env.type === ShapeType.Page) {
                this.api.deleteGuideFromPage(env as Page, index);
            } else {
                this.api.deleteGuide(env, index);
            }

            this.updateView();

            return true;
        } catch (e) {
            console.error('ReferHandleApiCaller.delete');
            this.exception = true;
            return false;
        }
    }

    migrate(__env1: ShapeView, index: number, __env2: ShapeView, targetOffset: number) {
        const result = { env: __env1, index: index }
        try {

            const env1 = adapt2Shape(__env1);
            const env2 = adapt2Shape(__env2);

            if (!env1.isContainer || !env2.isContainer || (env1.id === env2.id)) {
                return result;
            }
            const guides1 = (env1 as Artboard).guides || [];
            const guide1 = guides1[index];

            if (!guide1) {
                return result;
            }

            const api = this.api;

            let gui;
            if (env1.type === ShapeType.Page) {
                gui = api.deleteGuideFromPage(env1 as Page, index);
            } else {
                gui = api.deleteGuide(env1, index);
            }

            if (!gui) {
                this.exception = true;
                return result;
            }
            gui = importGuide(exportGuide(gui));
            gui.id = uuid();

            let __index;
            if (env2.type === ShapeType.Page) {
                __index = api.insertGuideToPage(env2 as Page, gui);
            } else {
                __index = api.insertGuide(env2, gui);
            }
            const afterGui = (env2 as Artboard).guides?.[__index];
            if (!afterGui) {
                return result;
            }

            api.modifyGuideOffset(env2, __index, targetOffset);

            result.env = __env2;
            result.index = __index;

            this.updateView();

            return result;
        } catch (e) {
            console.error('ReferHandleApiCaller.migrate');
            this.exception = true;
            return result;
        }
    }

    commit() {
        // console.log('=NEED RECOVERY=', this.__recovery);
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}