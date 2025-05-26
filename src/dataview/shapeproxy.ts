/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


// 用于替换掉symbolproxy

import { GroupShape, OverrideType, PathShape, Shape, TextShape, Variable } from "../data/shape";
import { ShapeView } from "./shape";
import { Style } from "../data/style";
import { SymbolRefView } from "./symbolref";
import { SymbolRefShape } from "../data/classes";
import { TextShapeView } from "./textshape";
import { PathShapeView } from "./pathshape";

class HdlBase { // protect data

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        throw new Error(propertyKey.toString())
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        return Reflect.get(target, propertyKey, receiver);
    }

    has(target: object, propertyKey: PropertyKey): boolean {
        if (target instanceof Map || target instanceof Set) {
            return target.has(propertyKey);
        }
        return Reflect.has(target, propertyKey);
    }
}

class StyleHdl extends HdlBase {
    private m_view: ShapeView;
    private m_parent: Shape;
    constructor(view: ShapeView, parent: Shape/* proxyed */) {
        super();
        this.m_view = view;
        this.m_parent = parent;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const propStr = propertyKey.toString();
        if (propStr === 'parent' || propStr === '__parent') return this.m_parent;
        if (propStr === 'fills') {
            return this.m_view.getFills();
        }
        if (propStr === 'borders') {
            return this.m_view.getBorder();
        }
        if (propStr === 'shadows') {
            return this.m_view.getShadows();
        }
        if (propStr === 'contextSettings') {
            return this.m_view.contextSettings;
        }
        return super.get(target, propertyKey, receiver);
    }
}

const shandler: { [key: string]: (view: ShapeView) => any } = {};
shandler['isVirtualShape'] = (view: ShapeView) => view.isVirtualShape;
shandler['id'] = (view: ShapeView) => view.id;
shandler['parent'] = shandler['__parent'] = (view: ShapeView) => {
    const parent = view.parent;
    if (!parent) return undefined;
    return adapt2Shape(parent);
};
shandler['isVisible'] = (view: ShapeView) => view.isVisible;
shandler['isLocked'] = (view: ShapeView) => view.isLocked;
// shandler['frame'] = (view: ShapeView) => view.frame;
shandler['size'] = (view: ShapeView) => view.frame;
shandler['transform'] = (view: ShapeView) => view.transform;
// todo flip
// shandler['isFlippedVertical'] = (view: ShapeView) => view.isFlippedVertical;
// shandler['isFlippedHorizontal'] = (view: ShapeView) => view.isFlippedHorizontal;
shandler['rotation'] = (view: ShapeView) => view.rotation;
shandler['isNoTransform'] = (view: ShapeView) => { return () => view.isNoTransform(); }
shandler['getPath'] = (view: ShapeView) => { return () => view.getPath(); }
shandler['getPathStr'] = (view: ShapeView) => { return () => view.getPathStr(); }
shandler['__isAdapted'] = (view: ShapeView) => true; // 判断是否是proxy

class ShapeHdl extends HdlBase {
    m_view: ShapeView;
    m_style?: Style;

    constructor(view: ShapeView) {
        super();
        this.m_view = view;
        // watch unwatch
        this.watch = this.watch.bind(this);
        this.unwatch = this.unwatch.bind(this);
        this.notify = this.notify.bind(this);

        // this.bubblewatch = this.bubblewatch.bind(this);
        // this.bubbleunwatch = this.bubbleunwatch.bind(this);
        // this.bubblenotify = this.bubblenotify.bind(this);
    }

    public watch(watcher: ((...args: any[]) => void)): (() => void) {
        return this.m_view.watch(watcher);
    }

    public unwatch(watcher: ((...args: any[]) => void)): boolean {
        return this.m_view.unwatch(watcher);
    }

    public notify(...args: any[]) {
        return this.m_view.notify(...args);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const propStr = propertyKey.toString();
        const h = shandler[propStr];
        if (h) return h(this.m_view);

        if (propStr === 'style') {
            if (!this.m_style) {
                const hdl = new StyleHdl(this.m_view, receiver as Shape);
                this.m_style = new Proxy<Style>(this.m_view.data.style, hdl);
            }
            return this.m_style;
        }
        if (propStr === "watch") {
            return this.watch;
        }
        if (propStr === "unwatch") {
            return this.unwatch;
        }
        if (propStr === "notify") {
            return this.notify;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class PathShapeHdl extends ShapeHdl {
    get view(): PathShapeView {
        return this.m_view as PathShapeView;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        // const propStr = propertyKey.toString();
        // if (propStr === 'points') {
        //     const points = this.view.m_points;
        //     if (points) {
        //         return points;
        //     }
        //     return (this.view.data as PathShape).points;
        // }
        return super.get(target, propertyKey, receiver);
    }
}

class GroupShapeHdl extends ShapeHdl {
    m_childs?: ShapeView[];
    m_naviChilds?: ShapeView[];

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const propStr = propertyKey.toString();
        if (propStr === 'childs') {
            if (!this.m_childs) {
                const childs = this.m_view.childs;
                if (childs) {
                    const hdl = new ShapeArrayHdl();
                    this.m_childs = new Proxy<ShapeView[]>(childs, hdl);
                }
            }
            return this.m_childs;
        }
        if (propStr === 'naviChilds') {
            if (!this.m_naviChilds) {
                const childs = this.m_view.naviChilds;
                if (childs) {
                    const hdl = new ShapeArrayHdl();
                    this.m_naviChilds = new Proxy<ShapeView[]>(childs, hdl);
                }
            }
            return this.m_naviChilds;
        }
        return super.get(target, propertyKey, receiver);
    }
}

class ShapeArrayHdl extends HdlBase {

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const val = Reflect.get(target, propertyKey, receiver);
        if (val instanceof ShapeView) {
            return proxyView(val);
        }
        return val;
    }
}

class SymbolRefShapeHdl extends ShapeHdl {

    m_childs?: ShapeView[];

    constructor(view: SymbolRefView) {
        super(view);
        this.findOverride = this.findOverride.bind(this);
        this.findVar = this.findVar.bind(this);
    }

    get view(): SymbolRefView {
        return this.m_view as SymbolRefView;
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        return this.view.findOverride(refId, type);
    }

    findVar(varId: string, ret: Variable[]): void {
        return this.view.findVar(varId, ret);
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any): any {
        const propStr = propertyKey.toString();
        if (propStr === 'naviChilds' || propStr === 'childs') {
            if (!this.m_childs) {
                const childs = this.m_view.childs;
                if (childs) {
                    const hdl = new ShapeArrayHdl();
                    this.m_childs = new Proxy<ShapeView[]>(childs, hdl);
                }
            }
            return this.m_childs;
        }

        if (propStr === "symData") { // todo hack
            return this.view.symData;
        }
        if (propStr === "refId") {
            return this.view.refId;
        }
        // if (propStr === "findOverride") {
        //     return this.findOverride;
        // }
        // if (propStr === "findVar") {
        //     return this.findVar;
        // }
        if (this.m_view.isVirtualShape) return super.get(target, propertyKey, receiver);
        if (propStr === "__isAdapted") {
            return true;
        }
        if (propStr === 'style') {
            return super.get(target, propertyKey, receiver);
        }
        // return super.get(target, propertyKey, receiver);
        return Reflect.get(target, propertyKey, receiver);
    }

    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any): boolean {
        if (this.m_view.isVirtualShape) return super.set(target, propertyKey, value, receiver);
        return Reflect.set(target, propertyKey, value, receiver);
    }
}


class TextShapeHdl extends ShapeHdl {
    get view(): TextShapeView {
        return this.m_view as TextShapeView;
    }

    get(target: object, propertyKey: PropertyKey, receiver?: any) {

        if (propertyKey === 'text') {
            return this.view.getText();
        }

        return super.get(target, propertyKey, receiver);
    }
}

function proxyView(view: ShapeView) {

    const shape = view.data;

    let hdl;
    if (shape instanceof GroupShape) {
        hdl = new GroupShapeHdl(view);
    }
    else if (shape instanceof SymbolRefShape) {
        hdl = new SymbolRefShapeHdl(view as SymbolRefView);
    }
    else if (shape instanceof TextShape) {
        hdl = new TextShapeHdl(view);
    }
    else if (shape instanceof PathShape) {
        hdl = new PathShapeHdl(view);
    }
    else {
        hdl = new ShapeHdl(view);
    }

    return new Proxy<Shape>(shape, hdl);
}

export function adapt2Shape(view: ShapeView) {
    if (!(view instanceof ShapeView)) throw new Error("view is not a ShapeView");
    if (view.isVirtualShape || view instanceof SymbolRefView) return proxyView(view);
    return view.data;
}

export function isAdaptedShape(shape: Shape) {
    return (shape as any).__isAdapted;
}