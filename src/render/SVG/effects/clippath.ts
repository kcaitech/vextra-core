/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// import { Shape } from "@kcdesign/data";
// import { EL, h } from "./basic";

// let g_clippath_id = 0; // 要用稳定的id，避免不必要的dom更新
import {FillRule} from "../../../data/typesdefine";

/**
 * return a clipPath el
 * @param shape 
 */
export function render(h: Function, id: string, path: string, clipRule: FillRule = FillRule.Evenodd): any {
    return h("clipPath", { id }, [h("path", { d: path, "clip-rule": clipRule, })]);
}