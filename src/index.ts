/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Path } from "@kcaitech/path"
export { Path } from "@kcaitech/path"
import { gPal, MeasureFun, TextPathFun } from "./basic/pal"
import { setExternalCanvas } from "./basic/canvas"

// 基础模块导出
export * from "./basic"

// 数据模块导出
export * from "./data"
export * from "./dataview"

// IO模块导出
export * as IO from "./io"

// 操作模块导出
export * as Opt from "./operator"

// 仓库模块导出
export * as Repo from "./repo"

// 编辑器模块导出
export * from "./editor"

// 创建器模块导出
export * as Creator from "./creator"

// 初始化函数
export async function initModule(textMeasure: MeasureFun, text2path: TextPathFun, canvas?: {
    Path2D: typeof globalThis.Path2D;
    OffscreenCanvas: typeof globalThis.OffscreenCanvas;
    Image: typeof globalThis.Image;
    DOMMatrix: typeof globalThis.DOMMatrix;
}) {
    gPal.text.textMeasure = textMeasure
    gPal.text.getTextPath = text2path
    await Path.init()

    if (canvas) {
        setExternalCanvas(canvas)
    }
}

// 导出canvas类型
export { Path2D, OffscreenCanvas, DOMMatrix, Image } from "./render/canvas/types"