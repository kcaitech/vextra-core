/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shape, ShapeType, SymbolShape } from "../data/shape";
import { SymbolRefShape } from "../data/classes";
import { EventEmitter } from "../basic/event";
import { objectId } from "../basic/objectid";
import { Notifiable } from "../data/basic";
import { ShapeSize } from "../data/baseclasses";

let Canvas: typeof import('skia-canvas').Canvas;
if (typeof window === 'undefined') {
    // Node.js environment
    Canvas = require('skia-canvas').Canvas;
}

export type GraphicsLibrary = 'SVG' | 'Canvas' | 'H5';


export type VarsContainer = (SymbolRefShape | SymbolShape)[];

export interface PropsType {
    data: Shape;
    scale?: { x: number, y: number };
    varsContainer?: VarsContainer;
    isVirtual?: boolean;
    layoutSize?: ShapeSize,
}

interface DataView extends Notifiable {
    layout(props?: PropsType): void;
    asyncRender(gl: GraphicsLibrary): number;
    parent?: DataView;
    emit(name: string, ...args: any[]): void;
    layoutProxy: { updateFrames: () => boolean; };
}

export interface ViewType {
    new(ctx: DViewCtx, props: PropsType, shapes?: Shape[]): DataView;
}

export function updateViewsFrame(updates: DataView[]) {
    if (updates.length === 0) return;
    type Node = { view: DataView, childs: Node[], needUpdate: boolean, parent: Node | undefined, visited: boolean }
    const updateTree: Map<number, Node> = new Map();
    updates.forEach((_s) => {
        const s = _s.parent;
        if (!s) return;
        let n: Node | undefined = updateTree.get(objectId(s));
        if (n) {
            n.needUpdate = true;
            return;
        }
        n = { view: s, childs: [], needUpdate: true, parent: undefined, visited: false }
        updateTree.set(objectId(s), n);

        let cn = n;
        let p = s.parent;
        while (p) {
            let pn: Node | undefined = updateTree.get(objectId(p));
            if (!pn) {
                pn = { view: p, childs: [], needUpdate: false, parent: undefined, visited: false }
                updateTree.set(objectId(p), pn);
            }

            pn.childs.push(cn);
            cn.parent = pn;

            cn = pn;
            p = p.parent;
        }
    });


    const afterTravel = (root: Node, traver: (n: Node) => void) => {
        const nodes = [root];
        let n = nodes[nodes.length - 1];
        while (n) {
            if (n.visited || n.childs.length === 0) {
                traver(n);
                nodes.pop();
            } else {
                n.visited = true;
                nodes.push(...n.childs);
            }
            n = nodes[nodes.length - 1];
        }
    }

    const roots: Node[] = [];
    for (let n of updateTree.values()) {
        if (!n.parent) roots.push(n);
    }

    for (let i = 0, len = roots.length; i < len; ++i) {
        const root = roots[i];
        // 从下往上更新
        afterTravel(root, (next: Node) => {
            const needUpdate = next.needUpdate;
            const changed = needUpdate && next.view.layoutProxy.updateFrames();
            if (changed && next.parent) next.parent.needUpdate = true;
        })
    }
}

export class DViewCtx extends EventEmitter {
    static FRAME_TIME = 20; // 实际会有延迟

    // gl: GraphicsLibrary;
    private m_canvas?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    comsMap: Map<ShapeType, ViewType> = new Map();

    private is_document: boolean = false;
    dpr: number;

    constructor() {
        super();
        // this.gl = gl ?? "SVG"; // 默认用SVG渲染
        // this.dpr = typeof window !== "undefined" ? Math.ceil(window.devicePixelRatio || 1) : 1;
        this.dpr = 1;
    }

    get canvas(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
        if (!this.m_canvas) {
            // 判断是否是node环境
            const canvas = new Canvas(1000, 1000);
            this.m_canvas = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        }
        return this.m_canvas;
    }

    setCanvas(canvas: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        this.m_canvas = canvas;
    }

    // 选区
    // 缩放监听
    // 先更新数据再绘制
    protected relayoutset: Map<number, DataView> = new Map();
    // 要由上往下更新
    protected dirtyset: Map<number, DataView> = new Map();

    tails: Set<DataView & { updateAtLast: () => void }> = new Set();

    private needNotify: Map<number, DataView> = new Map();

    private _sessionStorage: Map<string, string> = new Map();
    get sessionStorage(): Map<string, string> {
        return this._sessionStorage;
    }

    private _markRaw?: (v: any) => void
    setMarkRawFun(markRaw: (v: any) => void) {
        this._markRaw = markRaw; // vue markRaw
    }
    markRaw(v: any) {
        if (this._markRaw) this._markRaw(v)
    }

    setIsDoc(v: boolean) {
        this.is_document = v;
    }

    get isDocument() {
        return this.is_document;
    }

    setReLayout(v: DataView) {
        this.relayoutset.set(objectId(v), v);
        this.continueLoop();
    }
    setDirty(v: DataView) {
        this.dirtyset.set(objectId(v), v);
        this.continueLoop();
    }

    addNotifyLayout(v: DataView) {
        this.needNotify.set(objectId(v), v);
    }

    removeReLayout(v: DataView) {
        const vid = objectId(v);
        return this.relayoutset.delete(vid);
    }
    removeDirty(v: DataView) {
        const vid = objectId(v);
        return this.dirtyset.delete(vid);
    }

    protected focusshape: DataView | undefined;

    protected onIdle(): boolean {
        return false;
    }

    layoutAll() {
        // 先按层级排序，由高向下更新
        const update: { data: DataView, level: number }[] = [];
        const level = (v: DataView) => {
            let l = 0;
            let p = v.parent;
            while (p) {
                l++;
                p = p.parent;
            }
            return l;
        }

        this.relayoutset.forEach((v, k) => {
            update.push({ data: v, level: level(v) });
        });

        // 小的在前
        update.sort((a, b) => {
            return a.level - b.level;
        });

        const update2: DataView[] = []
        for (let i = 0; i < update.length; i++) {
            const d = update[i].data;
            if (this.relayoutset.has(objectId(d))) { // 再次判断，可能已经更新过了
                d.layout();
                update2.push(d);
            }
        }

        // update frames
        updateViewsFrame(update2);

        this.tails.forEach(v => v.updateAtLast());
    }

    private updateFocus(gl: GraphicsLibrary) {
        if (!this.focusshape) return false;

        const startTime = Date.now();
        const focusdepends: number[] = [];
        let p: DataView | undefined = this.focusshape;
        while (p) {
            focusdepends.push(objectId(p));
            p = p.parent;
        }

        const needupdate: DataView[] = [];
        this.relayoutset.forEach((v, k) => {
            needupdate.push(v);
        });
        // 由高向下更新
        const updated: DataView[] = [];
        for (let i = focusdepends.length - 1; i >= 0; i--) {
            const d = this.relayoutset.get(focusdepends[i]);
            if (d) {
                d.layout();
                updated.push(d)
            }
        }

        // update frames
        updateViewsFrame(updated);

        this.tails.forEach(v => v.updateAtLast());

        for (let i = 0, len = focusdepends.length; i < len; ++i) {
            const d = this.dirtyset.get(focusdepends[i]);
            if (d) d.asyncRender(gl);
        }

        this.notifyLayout();

        // check time
        const expendsTime = Date.now() - startTime;
        return (expendsTime > DViewCtx.FRAME_TIME);
    }

    private notifyLayout() {
        this.needNotify.forEach((v) => {
            v.notify('layout');
            v.emit('layout');
        });
        this.needNotify.clear();
    }

    // todo idle
    // todo selection
    // protected idlecallbacks: Array<() => boolean> = [];
    // onIdle(cb: () => boolean) {
    //     this.idlecallbacks.push(cb);
    // }
    /**
     * return: if continue
     */
    protected aloop(gl: GraphicsLibrary): boolean {

        const hasUpdate = this.relayoutset.size > 0 || this.dirtyset.size > 0;

        let startTime = Date.now();
        // 优先更新选中对象
        if (this.updateFocus(gl)) {
            return true;
        }

        // update
        // render
        this.layoutAll();

        const emitStartTime = Date.now();
        // 排版完成，emit nextTick
        this.emit("nextTick");
        if (Date.now() - emitStartTime > DViewCtx.FRAME_TIME) {
            console.error("!!! nextTick too long !!!");
        }

        // 渲染
        for (let [k, v] of this.dirtyset) {
            v.asyncRender(gl);
            const expendsTime = Date.now() - startTime;
            if (expendsTime > DViewCtx.FRAME_TIME) {
                return true;
            }
        }

        this.notifyLayout();

        if (this.relayoutset.size || this.dirtyset.size) {
            console.log("loop not empty ", this.relayoutset.size, this.dirtyset.size);
        }

        if (hasUpdate || this.relayoutset.size > 0 || this.dirtyset.size > 0) {
            return true;
        }

        return this.onIdle();
    }

    continueLoop(gl: GraphicsLibrary = 'SVG') {
        if (this.__looping && !this.__inframe && this.requestAnimationFrame) this._startLoop(this.requestAnimationFrame, gl);
    }

    private _startLoop(requestAnimationFrame: (run: () => void) => void, gl: GraphicsLibrary) {
        const run = () => {
            this.__inframe = false;
            if (!this.__looping) return;
            if (this.aloop(gl)) {
                requestAnimationFrame(run);
                this.__inframe = true;
            }
        }
        requestAnimationFrame(run);
        this.__inframe = true;
    }

    private __looping: boolean = false;
    private __inframe: boolean = false;
    private requestAnimationFrame?: (run: () => void) => void;

    loop(requestAnimationFrame: (run: () => void) => void, gl: GraphicsLibrary = 'SVG') {
        this.requestAnimationFrame = requestAnimationFrame;
        if (this.__looping) return;
        this.__looping = true;
        this._startLoop(requestAnimationFrame, gl);
    }

    stopLoop() {
        this.__looping = false;
    }
}