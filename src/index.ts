/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Path } from "@kcdesign/path"
export { Path } from "@kcdesign/path"
import { gPal, MeasureFun, TextPathFun } from "./basic/pal"

// 基础模块导出
export * from "./basic/index"
// export * as Matrix from "./basic/matrix"
// // export * as Utils from "./basic/utils"
// export * as Event from "./basic/event"
// export * as Error from "./basic/error"

// 数据模块导出
export * from "./data"
export * from "./dataview"

// IO模块导出
export * as IO from "./io"

// 编辑器模块导出
export * as Editor from "./editor"

// 协作模块导出
export * as Coop from "./coop"

// 工具函数导出
// export { exportBorder, exportFill, exportShadow, exportBlur, exportContextSettings } from './data/baseexport'
export * as FigmaConvert from "./figmcpconvert"

// 初始化函数
export async function initModule(textMeasure: MeasureFun, text2path: TextPathFun) {
    gPal.text.textMeasure = textMeasure
    gPal.text.getTextPath = text2path
    await Path.init()
}
