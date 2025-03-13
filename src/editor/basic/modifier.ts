/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Api, CoopRepository } from "../../coop";

export class Modifier {
    private __repo: CoopRepository;

    constructor(repo: CoopRepository) {
        this.__repo = repo;
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