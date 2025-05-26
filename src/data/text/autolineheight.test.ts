/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

const ratio = 0.21

function auto(v: number) {
    return Math.round(v * ratio)
}
/*
10 2
12 3
13 3
14 3
15 3
16 3
20 4
24 5
32 7
36 8
40 8
48 10
*/
describe('auto line height', () => {
    test('figma', () => {
        expect(auto(10)).toBe(2)
        expect(auto(12)).toBe(3)
        expect(auto(13)).toBe(3)
        expect(auto(14)).toBe(3)
        expect(auto(15)).toBe(3)
        expect(auto(16)).toBe(3)
        expect(auto(20)).toBe(4)
        expect(auto(24)).toBe(5)
        expect(auto(32)).toBe(7)
        expect(auto(36)).toBe(8)
        expect(auto(40)).toBe(8)
        expect(auto(48)).toBe(10)
        expect(auto(64)).toBe(13)
        expect(auto(96)).toBe(20)
        expect(auto(128)).toBe(27)
    })
})