/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CoopRepository } from "../../../coop/cooprepo";
import { AsyncApiCaller } from "../basic/asyncapi";
import { Document } from "../../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../../dataview";
import { Transform } from "../../../data/transform";

export type RotateUnit = {
    shape: ShapeView;
    x: number;
    y: number;
    targetRotate: number;
}

export class Rotator extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('sync-rotate')
    }

    execute(params: {
        shape: ShapeView;
        transform2: Transform,
    }[]) {
        try {
            for (let i = 0; i < params.length; i++) {
                const item = params[i];
                const shape = adapt2Shape(item.shape);
                this.api.shapeModifyTransform(this.page, shape, (params[i].transform2.clone()));
            }
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }
}