/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { compare, destruct } from "./fmtver"

describe('fmtver', () => {
    test('1', () => {
        const v = destruct(1 as any as string)
        expect(v.main).toBe(1)
        expect(v.second).toBe(0)
        expect(v.third).toBe(0)
    })

    test('1.1', () => {
        const v = destruct('1.1')
        expect(v.main).toBe(1)
        expect(v.second).toBe(1)
        expect(v.third).toBe(0)
    })

    test('1.0.1', () => {
        const v = destruct('1.0.1')
        expect(v.main).toBe(1)
        expect(v.second).toBe(0)
        expect(v.third).toBe(1)
    })

    test('compare', () => {
        expect('1.1' > '1.0.1').toBe(true)
        expect('10.0' > '1.1').toBe(true)
        expect(compare('1', '1.0.0')).toBe(0)
        expect(compare('1.1', '1.0.1') > 0).toBe(true)
        expect(compare('10.0', '1.1') > 0).toBe(true)
    })
})