/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export type TreeNodeTraverseHandler = (node: BaseTreeNode) => void

export class BaseTreeNode {
    root: BaseTreeNode | undefined
    parent: BaseTreeNode | undefined
    children: BaseTreeNode[] = []

    index() { // 获取本节点在父节点中的位置
        if (!this.parent) return -1;
        return this.parent.children.indexOf(this)
    }

    prevSibling() { // 获取前一个兄弟节点
        const index = this.index()
        if (index <= 0) return;
        return this.parent!.children[index - 1]
    }

    nextSibling() { // 获取后一个兄弟节点
        const index = this.index()
        if (index === -1 || index === this.parent!.children.length - 1) return;
        return this.parent!.children[index + 1]
    }

    siblings() { // 获取所有兄弟节点（排除自身）
        const index = this.index()
        if (index === -1) return [];
        return this.parent!.children.filter((_, i) => i !== index)
    }

    isAncestorOf(node: BaseTreeNode) { // 判断本节点是否为指定节点的祖先
        let parent = node.parent
        while (parent) {
            if (parent === this) return true;
            parent = parent.parent
        }
        return false
    }

    isDescendantOf(node: BaseTreeNode) { // 判断本节点是否为指定节点的后代
        return node.isAncestorOf(this)
    }

    isOnTree() { // 判断本节点是否在树上
        if (!this.root) return false;
        return this.root.isAncestorOf(this)
    }

    isSiblingOf(node: BaseTreeNode) { // 判断本节点是否为指定节点的兄弟节点
        return this.parent === node.parent
    }

    getPath() { // 获取（从根节点到）本节点的路径
        const path: BaseTreeNode[] = []
        let node: BaseTreeNode | undefined = this
        while (node) {
            path.push(node)
            node = node.parent
        }
        return path.reverse()
    }

    remove() { // 移除自身
        const index = this.index()
        if (index === -1) return;
        this.parent!.children.splice(index, 1)
    }

    replaceWithChildren() { // 用子节点代替本节点（移除本节点但保留子节点）
        if (!this.parent) return;
        this.parent.insertChildesAfter(this, ...this.children)
        this.remove()
    }

    removeChildes(...childes: BaseTreeNode[]) { // 移除多个子节点
        for (const child of childes) child.remove();
    }

    appendChildes(...childes: BaseTreeNode[]) { // 添加多个子节点
        for (const child of childes) {
            child.remove()
            child.parent = this
            child.root = this.root
            this.children.push(child)
        }
    }

    insertChildes(index: number, ...childes: BaseTreeNode[]) { // 在指定位置插入多个子节点
        if (index < 0 || index > this.children.length) return;
        for (const child of childes) {
            child.remove()
            child.parent = this
            child.root = this.root
        }
        this.children.splice(index, 0, ...childes)
    }

    insertChildesBefore(reference: BaseTreeNode, ...childes: BaseTreeNode[]) { // 在reference节点前插入多个子节点
        const index = reference.index()
        if (index === -1) return;
        this.insertChildes(index, ...childes)
    }

    insertChildesAfter(reference: BaseTreeNode, ...childes: BaseTreeNode[]) { // 在reference节点后插入子节点
        const index = reference.index()
        if (index === -1) return;
        this.insertChildes(index + 1, ...childes)
    }

    // 遍历以本节点为根的树
    // 遍历顺序：do(根)-do(左)-afterChildrenDo(左)-do(右)-afterChildrenDo(右)-afterSiblingDo(左-右)-afterChildrenDo(根)-afterAllDo(根-左-右)
    traverse(handler: {
        do?: TreeNodeTraverseHandler,
        afterChildrenDo?: TreeNodeTraverseHandler,
        afterSiblingDo?: TreeNodeTraverseHandler,
        afterAllDo?: TreeNodeTraverseHandler,
    }) {
        const stack0: BaseTreeNode[] = [this]
        const stack1: [ // 保存遍历树时的路径信息
            BaseTreeNode, // 已do的元素
            number, // 其子节点的数量
        ][] = []
        while (stack0.length) {
            const creator = stack0.pop()!
            handler.do?.(creator)

            const children = creator.children
            if (children.length) {
                stack0.push(...children.slice(0).reverse())
                stack1.push([creator, children.length])
            } else {
                handler.afterChildrenDo?.(creator)

                if (stack1.length === 0 && creator !== this) throw new Error("rootTreeNode元素不匹配");

                let currentCreator = creator
                while (stack1.length > 0) {
                    const parentStack = stack1[stack1.length - 1]
                    const parentCreator = parentStack[0]
                    if (parentCreator !== currentCreator.parent) throw new Error("treeNode父级元素不匹配");

                    if (--parentStack[1] > 0) break;
                    stack1.pop()

                    for (const child of parentCreator.children) handler.afterSiblingDo?.(child);

                    handler.afterChildrenDo?.(parentCreator)

                    currentCreator = parentCreator
                }
            }
        }

        // 再遍历一次，处理afterAllDo
        const stack2: BaseTreeNode[] = [this]
        if (handler.afterAllDo) while (stack2.length) {
            const creator = stack2.pop()!
            handler.afterAllDo?.(creator)
            stack2.push(...creator.children.slice(0).reverse())
        }
    }
}
