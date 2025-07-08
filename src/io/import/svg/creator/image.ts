/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { v4 as uuid } from "uuid"
import { BaseCreator } from "./base"
import * as shapeCreator from "../../../../creator"
import { getFormatFromBase64 } from "../../../../basic/utils"
import { ShapeFrame } from "../../../../data"

export class ImageCreator extends BaseCreator {
    createShape() {
        const x = this.attributes.x || 0
        const y = this.attributes.y || 0
        const width = this.attributes.width || 0
        const height = this.attributes.height || 0

        const href = this.attributes.href
        if (!href || !href.startsWith("data:image")) return;

        const media = {
            buff: Uint8Array.from(atob(href.split(",")[1]), c => c.charCodeAt(0)),
            base64: href,
        }

        const format = getFormatFromBase64(href)
        const ref = `${uuid()}.${format}`

        const mediaResourceMgr = this.context.mediaResourceMgr
        mediaResourceMgr.add(ref, media)

        const frame = new ShapeFrame(x, y, width, height);

        const originFrame = { width, height };

        this.shape = shapeCreator.newImageFillShape("图片", frame, mediaResourceMgr, originFrame, this.context.styleMgr, ref)
    }
}
