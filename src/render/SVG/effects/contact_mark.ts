/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shape } from "../../../data/shape";

export function render(h: Function, shape: Shape, maskId: any, frame: { x: number, y: number, width: number, height: number }, locate: { x: number, y: number }): any {
    const mask_props: any = {
        id: maskId
    }
    const mask_c1_props: any = {
        x: frame.x - 20,
        y: frame.y - 20,
        width: frame.width + 40,
        height: frame.height + 40,
        fill: 'white'
    }

    const mask_c2_props: any = {
        x: locate.x,
        y: locate.y,
        // width: layout.contentWidth,
        // height: layout.contentHeight,
        width: 200,
        height: 40,
        fill: 'black'
    }
    return h('mask', mask_props, [h('rect', mask_c1_props), h('rect', mask_c2_props)]);
}