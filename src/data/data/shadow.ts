import { Watchable } from "./basic";
import { IPageShadow } from "./ishadow";
import { Page } from "./page";
import { Shape, GroupShape } from "./shape";

class ShapeNaviNode {
    __parent: ShapeNaviNode | undefined;
    __shape: Shape;
    __childs: ShapeNaviNode[] | undefined;
    __totalCount: number = 1;
    __expand: boolean = false;
    constructor(shape: Shape) {
        this.__shape = shape;
    }
}

/**
 * 用于更高效的顺序获取元素
 */
export class ShapeNaviIter {
    // private __index: number;
    private __node: ShapeNaviNode | undefined;
    constructor(node: ShapeNaviNode | undefined) {
        this.__node = node;
        // this.__index = index;
    }
    hasNext(): boolean {
        return this.__node !== undefined;
    }
    next(): { shape: Shape, expand: boolean} {
        // 前序遍历
        // 0 index 是node 自己
        const node = this.__node as ShapeNaviNode;

        // todo 去除折叠了的
        if (node.__childs && node.__childs.length > 0 && node.__expand) {
            this.__node = node.__childs[0];
        }
        else {
            let p = node.__parent;
            let n = node;
            let r: ShapeNaviNode | undefined = undefined;
            while (p) {
                const childs = p.__childs as ShapeNaviNode[];
                const i = childs.indexOf(n);
                if (i < childs.length - 1) {
                    r = childs[i + 1];
                    break;
                }
                n = p;
                p = n.__parent;
            }
            this.__node = r;
        }
        return {
            shape: node.__shape,
            expand: node.__expand
        }
    }
}

/**
 * notify 如果index 为 -1 时，些节点是不可见的，不需要更新界面
 */
export class ShapeNaviShadow extends Watchable implements IPageShadow {

    // private __page: Page;
    private __root: ShapeNaviNode;
    private __map: Map<string, ShapeNaviNode> = new Map();

    constructor(page: Page) {
        super();
        // this.__page = page;
        this.__root = new ShapeNaviNode(page);
        this.__map.set(page.id, this.__root);
        // init
        this.expand(page);
    }

    get length(): number {
        return this.__root.__totalCount - 1; // 不算root
    }
    iterAt(index: number): ShapeNaviIter {
        if (index < 0 || index >= this.length) {
            return new ShapeNaviIter(undefined);
        }
        const childs = this.__root.__childs as ShapeNaviNode[];
        let i = 0;
        while (i < childs.length) {
            const count = childs[i].__expand ? childs[i].__totalCount : 1;
            if (index >= count) {
                index -= count;
                i++;
            }
            else {
                break;
            }
        }
        let n = childs[i];
        while(n) {
            if (index === 0) {
                return new ShapeNaviIter(n);
            }
            index--;
            const childs = n.__childs as ShapeNaviNode[];
            let ii = 0;
            while (ii < childs.length) {
                const count = childs[ii].__expand ? childs[ii].__totalCount : 1;
                if (index >= count) {
                    index -= count;
                    ii++;
                }
                else {
                    break;
                }
            }
            n = childs[ii];
        }
        // return new ShapeNaviIter(undefined);
        throw new Error("iter at");
    }

    expand(shape: Shape) {
        const node = this.__map.get(shape.id);
        if (!node) {
            throw new Error("expand not find shape");
        }
        if (node.__expand) {
            return;
        }
        node.__expand = true;
        // todo增加子节点
        if (!node.__childs && shape instanceof GroupShape) {
            node.__childs = [];
            const count = shape.childsCount;
            for (let i = count - 1; i >= 0; i--) {
                const c = shape.getChildByIndex(i);
                const n = new ShapeNaviNode(c);
                n.__parent = node;
                this.__map.set(c.id, n);
                node.__childs.push(n);
            }
            node.__totalCount = count + 1;
        }

        const c = node;
        let p = c.__parent;
        const count = c.__totalCount - 1;
        if (count > 0) while (p) {
            p.__totalCount += count;
            if (!p.__expand) {
                // wrong ?
                break;
            }
            p = p.__parent;
        }
        this.notify("expand", this.__indexOf(node), node.__totalCount);
    }
    shrink(shape: Shape) {
        const node = this.__map.get(shape.id);
        if (!node) {
            throw new Error("shrink not find shape");
        }
        if (!node.__expand) {
            return;
        }
        node.__expand = false;
        const c = node;
        let p = c.__parent;
        const count = c.__totalCount - 1;
        if (count > 0) while (p) {
            p.__totalCount -= count;
            if (!p.__expand) {
                // wrong ?
                break;
            }
            p = p.__parent;
        }
        this.notify("shrink", this.__indexOf(node), node.__totalCount);
    }

    toggleExpand(shape: Shape) {
        const node = this.__map.get(shape.id);
        if (!node) {
            throw new Error("toggle expand not find shape");
        }
        if (node.__expand) {
            this.shrink(shape);
        }
        else {
            this.expand(shape);
        }
    }

    __indexOf(node: ShapeNaviNode) {
        let c = node;
        let p = c.__parent;
        let index = -1; // 不算root
        while(p) {
            if (!p.__expand) {
                return -1;
            }
            const childs = p.__childs as ShapeNaviNode[];
            for (let i = 0, len = childs.length; i < len; i++) {
                const c0 = childs[i];
                if (c0 === c) {
                    break;
                }
                if (!c0.__expand) {
                    index++;
                }
                else {
                    index += c0.__totalCount;
                }
            }
            index++; // 当前parent
            c = p;
            p = c.__parent;
        }
        return index;
    }

    __del(node: ShapeNaviNode) {
        const c = node;
        let p = c.__parent;

        if (p) {
            const childs = p.__childs as ShapeNaviNode[];
            childs.splice(childs.indexOf(c), 1);
        }
        const count = c.__expand ? c.__totalCount : 1;
        while(p) {
            p.__totalCount -= count;
            p = p.__parent;
        }
    }

    delete(shape: Shape): boolean {
        const node = this.__map.get(shape.id);
        if (!node) {
            return true;
        }
        const saveIndex = this.__indexOf(node);
        this.__map.delete(shape.id);

        this.__del(node);
        this.notify("delete", saveIndex, node.__expand ? node.__totalCount : 1);
        return true;
    }

    __insert(node: ShapeNaviNode, index: number, c: ShapeNaviNode) {
        // 反转index
        index = (node.__childs as ShapeNaviNode[]).length - index;
        c.__parent = node;
        (node.__childs as ShapeNaviNode[]).splice(index, 0, c);
        let p: ShapeNaviNode | undefined = c.__parent;
        const count = c.__expand ? c.__totalCount : 1;
        while(p) {
            p.__totalCount += count;
            if (!p.__expand) {
                break;
            }
            p = p.__parent;
        }
    }

    insert(parent: GroupShape, index: number, shape: Shape): boolean {
        const node = this.__map.get(parent.id);
        if (!node) {
            return true;
        }
        if (!node.__childs) {
            return true;
        }
        
        const c = new ShapeNaviNode(shape); // todo
        this.__insert(node, index, c);
        this.__map.set(shape.id, c);

        this.notify("insert", this.__indexOf(c), 1);
        return true;
    }
    modify(shape: Shape, attribute: string, value: any): boolean {
        return true;
    }
    move(shape: Shape, target: GroupShape, index: number): boolean {
        // del
        const node = this.__map.get(shape.id);
        if (node) {
            const saveIndex = this.__indexOf(node);
            this.__del(node);
            this.notify("delete", saveIndex, node.__expand ? node.__totalCount : 1);
        }

        // insert
        const tar = this.__map.get(target.id);
        if (!tar || !tar.__childs) {
            if (node) {
                this.__map.delete(shape.id);
            }
            return true;
        }
        const c = node ? node : new ShapeNaviNode(shape);
        this.__insert(tar, index, c);
        if (c !== node) this.__map.set(shape.id, c);

        this.notify("insert", this.__indexOf(c), c.__expand ? c.__totalCount : 1);

        return true;
    }
}