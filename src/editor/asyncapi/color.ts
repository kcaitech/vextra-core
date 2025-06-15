/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../repo/cooprepo";
import { Document } from "../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../dataview";
import { shape4fill } from "../../editor/symbol";
import { PaintFilterType } from "../../data";

export class ColorPicker extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page)
    }

    start() {
        return this.__repo.start('color-picker');
    }

    execute() {
        try {
            // todo ColorPicker的异步操作
            this.updateView();
        } catch (e) {
            console.log('ColorPicker.execute:', e);
            this.exception = true;
        }
    }

    executeImageScale(shapes: ShapeView[], scale: number, index: number) {
        try {
            const api = this.api;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const s = shape4fill(api, this.pageView, shape);
                // api.setFillImageScale(page, s, index, scale);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('ColorPicker.executeImageScale', e);
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