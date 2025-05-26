/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {GroupShape, Shape,} from "../../../data"
import {BaseCreator} from "./base"
import {getRectBox, mergeRectBox} from "../utils"
import * as shapeCreator from "../../../editor/creator/creator"
import { ColVector3D } from "../../../basic/matrix2"
// 将父元素的属性合并到子元素
export function mergeAttributes(parent: BaseCreator, child: BaseCreator) {
    const parentShape = parent.shape
    const childShape = child.shape
    if (!parentShape || !childShape) return;

    // 合并transform
    child.transform = child.transform.addTransform(parent.transform) // 先执行子级，再执行父级
    child.updateShapeAttrByTransform()
    // 合并透明度
    if (parent.attributes.opacity) {
        if (child.attributes.opacity) child.attributes.opacity *= parent.attributes.opacity;
        else child.attributes.opacity = parent.attributes.opacity;
    }
    // 合并id
    if (parent.localAttributes.id) {
        if (child.localAttributes.id) child.localAttributes.id = parent.localAttributes.id + child.localAttributes.id;
        else child.localAttributes.id = parent.localAttributes.id;
    }

    child.updateShapeStyle()
}

export class GroupCreator extends BaseCreator {
    createShape() {
        this.shape = shapeCreator.newGroupShape("编组", this.style)
    }

    afterChildrenCreateShape(): void {
        if (!this.shape) return;
        const children: {
            shape: Shape,
            creator: BaseCreator,
        }[] = this.children.filter(child => child.shape).map(child => {
            return {
                shape: child.shape!,
                creator: child,
            }
        })

        if (children.length === 0) { // 空的group，移除自身
            this.remove()
            return
        }

        const reservedAttributes = ["fill", "stroke"] // 保留属性，有则不会被子级替代
        const isReserved = reservedAttributes.some(attr => attr in this.attributes && (this.attributes as any)[attr])
        if (!isReserved && children.length === 1) { // 用子元素替代自身
            mergeAttributes(this, children[0].creator)
            this.replaceWithChildren()
            return
        }

        const groupShape = this.shape as GroupShape
        groupShape.childs.push(...children.map(child => child.shape))

        const childShapeBoxes = children.map(child => {
            const childShape = child.shape
            const childCreator = child.creator
            return getRectBox(childShape.frame.x, childShape.frame.y, childShape.frame.width, childShape.frame.height, childCreator.transform)
        })
        const childesShapeBox = mergeRectBox(...childShapeBoxes) // 合并所有子元素的包围盒

        // 根据子元素包围盒更新groupShape的宽高
        this.attributes.width = childesShapeBox.w
        this.attributes.height = childesShapeBox.h
        // groupShape.size.width = childesShapeBox.w
        // groupShape.size.height = childesShapeBox.h

        // 将子元素包围盒偏移至groupShape的左上角
        for (const child of children) {
            child.creator.transform.translate(new ColVector3D([-childesShapeBox.lt.x, -childesShapeBox.lt.y, 0]))
            child.creator.updateShapeAttrByTransform()
        }
        // 将groupShape偏移至子元素包围盒原来的位置
        this.transform.preTranslate(new ColVector3D([childesShapeBox.lt.x, childesShapeBox.lt.y, 0]))
        this.updateShapeAttrByTransform()
        // dev code
        // if (this.localAttributes["id"] === "组_59") {
        //     console.log("组_59 groupShape", groupShape.frame.x, groupShape.frame.y, groupShape.frame.width, groupShape.frame.height)
        // }
    }
}
