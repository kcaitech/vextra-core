/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { PathShape2, Shape, ShapeFrame, SymbolRefShape, SymbolShape } from "../data/classes";
import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";
import { EL, elh } from "./el";
import { renderBorder } from "../render/SVG/effects";

/**
 * @deprecated 使用 PathShapeView，PathShapeView2不会渲染
 */
export class PathShapeView2 extends ShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        throw new Error('PathShapeView2 has been deprecated.');
    }
}