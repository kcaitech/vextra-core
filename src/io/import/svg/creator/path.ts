/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseCreator } from "./base"
import * as shapeCreator from "../../../../creator"
import { ShapeFrame } from "../../../../data"
import {BaseTreeNode} from "../tree"
import { Path } from "@kcaitech/path";
import { ColVector3D } from "../../../../basic/matrix2";


export class PathCreator extends BaseCreator {
    afterAllAdjust() {
        if (this.attributes.fill || !this.attributes.stroke) return; // 本节点不是描边

        const svgRoot = this.root?.htmlElement?.root
        if (!svgRoot) return;

        // 填充部分
        let fillPart: PathCreator | undefined
        let position: "inside" | "center" | "outside"

        const findFillPart = (item: BaseTreeNode) => {
            return item instanceof PathCreator
                && item.attributes.fill
                && item.attributes.x === this.attributes.x
                && item.attributes.y === this.attributes.y
                && item.attributes.width === this.attributes.width
                && item.attributes.height === this.attributes.height
                && item.localAttributes["d"] === this.localAttributes["d"]
        }

        const mask = this.localAttributes["mask"]
        const clip = this.localAttributes["clip-path"]
        if ((mask && mask.startsWith("url(#")) || (clip && clip.startsWith("url(#"))) { // 外部、内部
            position = mask ? "outside" : "inside"
            const urlId = (mask || clip).slice(5, -1)
            const el = svgRoot.querySelector(`#${urlId}>path`)
            if (el) {
                const creator = (el as any).creator as BaseCreator
                if (creator instanceof PathCreator && creator.localAttributes["d"] === this.localAttributes["d"]) {
                    fillPart = this.parent?.siblings().find(findFillPart) as PathCreator | undefined // 父节点的兄弟节点
                    if (!fillPart) fillPart = this.parent?.siblings().reduce((prev, cur) => { // 父节点的兄弟节点的子节点
                        prev.push(...cur.children)
                        return prev
                    }, [] as BaseTreeNode[]).find(findFillPart) as PathCreator | undefined;
                }
            }
        } else { // 中心
            position = "center"
            fillPart = this.siblings().find(findFillPart) as PathCreator | undefined
            if (!fillPart) fillPart = this.parent?.siblings().find(findFillPart) as PathCreator | undefined; // 父节点的兄弟节点
            if (!fillPart) fillPart = this.parent?.siblings().reduce((prev, cur) => { // 父节点的兄弟节点的子节点
                prev.push(...cur.children)
                return prev
            }, [] as BaseTreeNode[]).find(findFillPart) as PathCreator | undefined;
        }

        if (!fillPart) fillPart = this;

        // 设置填充部分的描边
        let strokeWidth = this.attributes.strokeWidth
        if (strokeWidth && position !== "center") strokeWidth /= 2;
        fillPart.attributes.stroke = {
            ...this.attributes.stroke,
            width: strokeWidth,
            position: position,
        }

        if (fillPart !== this) this.remove(); // 有填充的情况下移除描边部分
    }

    createShape() {
        const d = this.attributes.d
        if (!d) return;
        const x = this.attributes.pathX || 0
        const y = this.attributes.pathY || 0
        const width = this.attributes.width || 0
        const height = this.attributes.height || 0

        const path = new Path(d)

        path.translate(-x, -y)
        let diffTranslate = new ColVector3D([x, y, 0])
        diffTranslate = this.transform.clone().clearTranslate().transform(diffTranslate).col0

        // dev code
        // if (this.localAttributes["node-id"] === "123") {
        //     console.log("node-id=123", -x, -y)
        // }
        // if (this.localAttributes["id"] === "路径_348") {
        //     console.log("路径_348 path transform", this.transform.toString())
        // }

        const x1 = diffTranslate.x + (this.attributes.x || 0)
        const y1 = diffTranslate.y + (this.attributes.y || 0)
        this.transform.translate(new ColVector3D([x1, y1, 0]))
        this.shape = shapeCreator.newPathShape("路径", new ShapeFrame(x1, y1, width, height), path, this.context.styleMgr, this.style)

        // dev code
        // if (this.localAttributes["id"] === "路径_348") {
        //     console.log("路径_348 path", x, y, width, height, this.transform.toString())
        // }
    }
}
