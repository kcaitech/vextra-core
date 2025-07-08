/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { IRepository } from "../../repo";
import { Operator } from "../../operator";

export class Modifier {
    private __repo: IRepository;

    constructor(repo: IRepository) {
        this.__repo = repo;
    }

    get repo() {
        return this.__repo;
    }

    private m_operator: Operator | undefined;
    protected getOperator(desc: string): Operator {
        return this.m_operator ?? (this.m_operator = this.__repo.start(desc));
    }

    protected rollback() {
        this.__repo.rollback();
        this.m_operator = undefined;
    }

    protected commit() {
        this.__repo.commit();
        this.m_operator = undefined;
    }
}