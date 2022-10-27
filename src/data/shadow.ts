import { Watchable } from "./basic";
import { IPageEdit } from "./iedit";
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
class ShapeNaviIter {
    private __index: number;
    private __node: ShapeNaviNode;
    constructor(node: ShapeNaviNode, index: number) {
        this.__node = node;
        this.__index = index;
    }
    hasNext(): boolean {
        throw new Error("Method not implemented.");
    }
    next(): Shape {
        throw new Error("Method not implemented.");
    }
    hasPrev(): boolean {
        throw new Error("Method not implemented.");
    }
    prev(): Shape {
        throw new Error("Method not implemented.");
    }
}

/**
 * notify 如果index 为 -1 时，些节点是不可见的，不需要更新界面
 */
export class ShapeNaviShadow extends Watchable implements IPageEdit {

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
    at(index: number): Shape {
        // todo
        throw new Error("Method not implemented.");
    }
    iterAt(index: number): ShapeNaviIter {
        // todo
        throw new Error("Method not implemented.");
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
            for (let i = 0; i < count; i++) {
                const c = shape.getChildByIndex(i);
                const n = new ShapeNaviNode(c);
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
        // const node = this.__map.get(shape.id);
        // if (!node) {
        //     return undefined;
        // }
        // const saveIndex = this.__indexOf(node);
        // this.__map.delete(shape.id);

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
        // this.notify("delete", saveIndex, node.__totalCount);
        // return node;
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
        // throw new Error("Method not implemented.");
    }

    __insert(node: ShapeNaviNode, index: number, c: ShapeNaviNode) {
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
        // throw new Error("Method not implemented.");
    }
    modify(shape: Shape, attribute: string, value: any): boolean {
        // throw new Error("Method not implemented.");
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
        // else {
        //     // node = new ShapeNaviNode(shape);
        // }
        
        // insert
        const tar = this.__map.get(target.id);
        if (!tar) {
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
        // throw new Error("Method not implemented.");
    }
}