/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { Document } from "../../data/document";
import { adapt2Shape, ArtboardView, PageView, ShapeView } from "../../dataview";
import {
    GroupShape,
    Shape,
    ShapeType,
} from "../../data/shape";
import { translate } from "../frame";
import { Page, StackSizing } from "../..//data";
import { after_migrate, unable_to_migrate } from "../utils/migrate";
import { get_state_name, is_state, shape4Autolayout } from "../symbol";
import { CoopRepository } from "../../coop/cooprepo";
import { Api, PaddingDir } from "../../coop/recordapi";

export class AutoLayoutModify extends AsyncApiCaller {
    updateFrameTargets: Set<Shape> = new Set();
    prototype = new Map<string, Shape>()
    protected _page: PageView;
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
        this._page = page;
    }

    start() {
        return this.__repo.start('auto-layout-modify');
    }

    executePadding(shapes: ArtboardView[], value: number, direction: PaddingDir) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutPadding(page, __shape, padding, direction);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executePadding', e);
        }
    }

    executeHorPadding(shapes: ArtboardView[], value: number, right: number) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const r_padding = Math.max(0, Math.round(right));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutHorPadding(page, __shape, padding, r_padding);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeHorPadding', e);
        }
    }

    executeVerPadding(shapes: ArtboardView[], value: number, bottom: number) {
        try {
            const api = this.api;
            const page = this.page;
            const padding = Math.max(0, Math.round(value));
            const b_padding = Math.max(0, Math.round(bottom));
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutVerPadding(page, __shape, padding, b_padding);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeVerPadding', e);
        }
    }

    executeSpace(shapes: ArtboardView[], value: number, direction: PaddingDir) {
        try {
            const api = this.api;
            const page = this.page;
            const space = Math.round(value);
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const __shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutSpace(page, __shape, space, direction);
                api.shapeModifyAutoLayoutGapSizing(page, __shape, StackSizing.Fixed, direction);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('AutoLayoutModify.executeSpace', e);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            if (this.prototype.size) {
                this.prototype.forEach((v) => {
                    this.api.delShapeProtoStart(this.page, v)
                })
            }
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}