/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator/creator"
import { ShapeFrame } from "../../../data"

export class TextCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0

        const text = this.htmlElement!.node.textContent
        if (!text) return;

        const fontStyleAttr = this.attributes.styleAttributes?.font
        const fill = this.attributes.textFill

        const textShape = shapeCreator.newTextShape("文本", this.context.styleMgr, new ShapeFrame(x, y, 0, 0))
        textShape.text.insertText(text, 0)

        this.shape = textShape
    }
}
