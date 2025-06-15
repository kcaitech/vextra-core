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
import { IRepository } from "../../repo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, PathShapeView } from "../../dataview";
import { PathShape } from "../../data/shape";
import { update_frame_by_points } from "../utils/path";
export class LineHandleApiCaller extends AsyncApiCaller {
    readonly line: PathShapeView;

    constructor(repo: IRepository, document: Document, page: PageView, lineView: PathShapeView) {
        super(repo, document, page)

        this.line = lineView;
    }

    start() {
        return this.__repo.start('straight-line-modify');
    }

    execute(start: { x: number, y: number }, end: { x: number, y: number }) {
        try {
            const shape = adapt2Shape(this.line) as PathShape;

            const points = shape?.pathsegs[0]?.points;

            const __start = points[0];
            const __end = points[1];

            const api = this.api;
            const page = this.page;

            if ((__start.x !== start.x) || (__start.y !== start.y)) {
                api.shapeModifyCurvPoint(page, shape, 0, start, 0);
            }
            if ((__end.x !== end.x) || (__end.y !== end.y)) {
                api.shapeModifyCurvPoint(page, shape, 1, end, 0);
            }

            this.updateView();
        } catch (e) {
            console.error(e);
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            update_frame_by_points(this.api, this.page, adapt2Shape(this.line) as PathShape, true);
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}