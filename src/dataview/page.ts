/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data";
import { ArtboardView } from "./artboard";
import { CutoutShapeView } from "./cutout";
import { GroupShapeView } from "./groupshape";
import { ShapeView } from "./shape";
import { RootView } from "./view";
import { DViewCtx, PropsType } from "./viewctx";

function checkPath(v: ShapeView) {
    const lhs = v.getPathStr();
    const rhs = v.m_data.getPath().toString();
    if (lhs !== rhs) {
        console.error(`path not match: ${lhs} vs ${rhs}`, v.name)
    }
    v.m_children.forEach((c) => checkPath(c as ShapeView));
}

export class PageView extends GroupShapeView implements RootView {
    private m_views: Map<string, ShapeView> = new Map();
    private m_artboards: Map<string, ArtboardView> = new Map();
    private m_cutouts: Map<string, CutoutShapeView> = new Map();
    private m_delaydestorys: Map<string, ShapeView> = new Map();

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.onMounted();

        const destroyDelayDestroys = () => {
            this.m_delaydestorys.forEach((v) => {
                if (v.parent) return; // 已复用
                v.destroy();
            });
            this.m_delaydestorys.clear();
        }
        ctx.on("nextTick", destroyDelayDestroys);
    }

    onAddView(view: ShapeView | ShapeView[]): void {
        const add = (v: ShapeView) => {
            this.m_views.set(v.id, v);
            if (v instanceof ArtboardView) this.m_artboards.set(v.id, v);
            if (v instanceof CutoutShapeView) this.m_cutouts.set(v.id, v);
            v.m_children.forEach((c) => add(c as ShapeView));
        }
        if (Array.isArray(view)) view.forEach(add);
        else add(view);
    }

    onRemoveView(parent: ShapeView, view: ShapeView | ShapeView[]): void {
        const remove = (parent: ShapeView, v: ShapeView) => {
            const cur = this.m_views.get(v.id);
            if (cur && cur.parent?.id !== parent.id) return; // 已经不是同一个了(被复用)
            this.m_views.delete(v.id);
            if (v instanceof ArtboardView) this.m_artboards.delete(v.id);
            if (v instanceof CutoutShapeView) this.m_cutouts.delete(v.id);
            v.m_children.forEach((c) => remove(v, c as ShapeView));
        }
        if (Array.isArray(view)) view.forEach((v) => remove(parent, v));
        else remove(parent, view);
    }

    getView(id: string) {
        return this.m_views.get(id) || this.m_delaydestorys.get(id);
    }

    addDelayDestroy(view: ShapeView | ShapeView[]): void {
        const add = (v: ShapeView) => {
            if (v.parent) throw new Error("view has parent, not removed?");
            this.m_delaydestorys.set(v.id, v);
        }
        if (Array.isArray(view)) view.forEach(add);
        else add(view);
    }

    get isRootView() {
        return true;
    }

    get data(): Page {
        return this.m_data as Page;
    }

    get shapes() {
        return this.m_views;
    }

    get artboardList() {
        return Array.from(this.m_artboards.values());
    }

    get cutoutList() {
        return Array.from(this.m_cutouts.values());
    }

    getShape(id: string) {
        return this.m_views.get(id);
    }

    get guides() {
        return (this.m_data as Page).guides;
    }

    render(): number {
        return this.m_renderer.render();
    }

    updateMaskMap() {
        this.maskMap.clear();
    }

    dbgCheckPath() {
        checkPath(this);
    }

    get backgroundColor() {
        return this.data.backgroundColor;
    }
}