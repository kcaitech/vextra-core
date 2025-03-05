
import { v4 as uuid } from "uuid"
import { BaseCreator } from "./base"
import * as shapeCreator from "../../../editor/creator"
import { getFormatFromBase64 } from "../../../basic/utils"
import { ShapeFrame } from "../../../data"

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
