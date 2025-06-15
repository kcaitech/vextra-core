/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Api, IRepository } from "../../repo";

export class Modifier {
    private __repo: IRepository;

    constructor(repo: IRepository) {
        this.__repo = repo;
    }

    get repo() {
        return this.__repo;
    }

    private m_api: Api | undefined;
    protected getApi(desc: string): Api {
        return this.m_api ?? (this.m_api = this.__repo.start(desc));
    }

    protected rollback() {
        this.__repo.rollback();
        this.m_api = undefined;
    }

    protected commit() {
        this.__repo.commit();
        this.m_api = undefined;
    }
}