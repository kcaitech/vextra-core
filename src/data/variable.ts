/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Basic } from "./basic"
import * as classes from "./baseclasses"
import { VariableType } from "./baseclasses"

export class Variable extends (Basic) implements classes.Variable {

    typeId = 'variable'
    id: string
    type: VariableType
    name: string
    value: any
    constructor(
        id: string,
        type: VariableType,
        name: string,
        value: any
    ) {
        super()
        this.id = id
        this.type = type
        this.name = name
        this.value = value
    }

}
