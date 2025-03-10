/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CoopRepository } from "../../../coop/cooprepo";
import { Document, Page } from "../../../data";
import { Operator } from "../../../coop/recordop";
import { PageView, adapt2Shape } from "../../../dataview";

/**
 * @description合并同类型API，适用于鼠标的拖拽动作
 */
export class AsyncApiCaller {
    __repo: CoopRepository;
    __document: Document;
    api: Operator;
    page: Page;
    pageView: PageView;

    exception: boolean = false;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        this.__repo = repo;
        this.__document = document;
        this.pageView = page;
        this.page = adapt2Shape(page) as Page;
        this.api = this.start()
    }

    start() {
        return this.__repo.start('');
    }

    updateView() {
        this.__repo.transactCtx.fireNotify();
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}

