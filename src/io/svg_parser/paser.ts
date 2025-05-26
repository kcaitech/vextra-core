/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import {v4 as uuid} from "uuid"
import {BaseCreator, ContextType, SvgCreator} from "./creator/base"
import {NoneCreator} from "./creator/none"
import {GroupCreator} from "./creator/group"
import {PathCreator} from "./creator/path"
import {RectCreator} from "./creator/rect"
import {EllipseCreator} from "./creator/ellipse"
import {LineCreator} from "./creator/line"
import {TextCreator} from "./creator/text"
import {ImageCreator} from "./creator/image"
import {Polyline} from "./creator/polyline"
import {UseCreator} from "./creator/use"
import { ResourceMgr, Shape, StyleMangerMember } from "../../data"

export class Parser {
    svgRoot: Element
    context: ContextType

    constructor(root: Element) {
        this.svgRoot = root
        this.context = {
            styleMgr: new ResourceMgr<StyleMangerMember>([uuid(), "styles"]),
            mediaResourceMgr: new ResourceMgr<{ buff: Uint8Array, base64: string }>([uuid(), "medias"]),
            styleMap: this.styleMap,
        }
    }

    create(node: Element) { // 处理svg元素内的一个节点，并返回其子节点
        const children = Array.from(node.children)
        let creatorConstruction: typeof BaseCreator
        if (node.tagName === "g") {
            creatorConstruction = GroupCreator
        } else if (node.tagName === "svg") {
            creatorConstruction = SvgCreator
        } else if (node.tagName === "path") {
            creatorConstruction = PathCreator
        } else if (node.tagName === "rect") {
            creatorConstruction = RectCreator
        } else if (node.tagName === "circle" || node.tagName === "ellipse") {
            creatorConstruction = EllipseCreator
        } else if (node.tagName === "line") {
            creatorConstruction = LineCreator
        } else if (node.tagName === "text") {
            creatorConstruction = TextCreator
        } else if (node.tagName === "image") {
            creatorConstruction = ImageCreator
        } else if (node.tagName === "polyline" || node.tagName === "polygon") {
            creatorConstruction = Polyline
        } else if (node.tagName === "use") {
            creatorConstruction = UseCreator
        } else {
            creatorConstruction = NoneCreator
        }
        (node as any).creator = new creatorConstruction(
            this.context, // context
            (this.svgRoot as any).creator, // root
            (node.parentElement as any)?.creator, // parent
            {
                root: this.svgRoot, // svgRoot
                node: node, // svgNode
            },
        )
        return children
    }

    styleMap: {
        [key: string]   // class、id
            : string    // css content
    } = {}

    // 解析css
    parseCSS() {
        for (const style of this.svgRoot.querySelectorAll('style')) {
            const styleInner = style.innerHTML
            const regex = /(.*?)\{(.*?)}/g;
            let match
            while ((match = regex.exec(styleInner)) !== null) {
                const selectorText = match[1].trim()
                const selectorList: string[] = []
                for (let selector of selectorText.split(',')) {
                    selector = selector.trim()
                    if (selector) selectorList.push(selector.trim());
                }
                if (selectorList.length === 0) continue;

                const cssContent = match[2].trim()
                if (!cssContent) continue;

                for (const selector of selectorList) {
                    let content = this.styleMap[selector] || ''
                    if (content && !content.endsWith(';')) content += ';';
                    this.styleMap[selector] = content + cssContent
                }
            }
        }
    }

    parse(): Shape | undefined {
        this.parseCSS()

        // 创建creator树
        const stack0 = [this.svgRoot]
        while (stack0.length) {
            const node = stack0.pop()!
            const children = this.create(node)

            const creator = (node as any).creator as BaseCreator

            const parentNode = node.parentElement
            if (parentNode) {
                const parentCreator = (parentNode as any).creator as BaseCreator
                parentCreator.children.push(creator)
            }

            stack0.push(...children.slice(0).reverse())
        }
        const rootCreator = (this.svgRoot as any).creator as BaseCreator

        // 解析属性
        rootCreator.traverse({
            do: BaseCreator.method("parseAttributes"),
        })

        // 调整节点
        rootCreator.traverse({
            do: BaseCreator.method("adjust"),
            afterChildrenDo: BaseCreator.method("afterChildrenAdjust"),
            afterSiblingDo: BaseCreator.method("afterSiblingAdjust"),
            afterAllDo: BaseCreator.method("afterAllAdjust"),
        })

        // 创建shape
        rootCreator.traverse({
            do: BaseCreator.method("_createShape"),
            afterChildrenDo: BaseCreator.method("afterChildrenCreateShape"),
            afterSiblingDo: BaseCreator.method("afterSiblingCreateShape"),
            afterAllDo: BaseCreator.method("afterAllCreateShape"),
        })

        return rootCreator.shape
    }
}
