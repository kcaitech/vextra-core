/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Api, CoopRepository } from "../coop";
import { adapt2Shape, ContactLineView, get_nearest_border_point, PageView, ShapeView } from "../dataview";
import {
    BasicArray,
    ContactForm,
    ContactRole,
    ContactRoleType,
    ContactShape, CurveMode,
    CurvePoint,
    GroupShape,
    Page, PathShape,
} from "../data";
import { importCurvePoint } from "../data/baseimport";
import { v4 } from "uuid";
import { translateTo } from "./frame";

export class ContactLineModifier {
    private exception: boolean = false;
    private repo: CoopRepository;
    private view: ContactLineView;
    protected line: ContactShape;
    private pageView: PageView;
    private page: Page;

    constructor(repo: CoopRepository, pageView: PageView, view: ContactLineView) {
        this.repo = repo;
        this.view = view;
        this.line = adapt2Shape(view) as ContactShape;
        this.pageView = pageView;
        this.page = pageView.data;
    }

    private m_api: Api | undefined = undefined;

    private api(desc: string): Api {
        return this.m_api ?? (this.m_api = this.repo.start(desc));
    }

    private updateView() {
        this.repo.transactCtx.fireNotify();
    }

    /* ===public=== */

    /* 简化已有路径，让其只剩下起始两个端点 */
    simplify() {
        if (this.exception) return;
        try {
            const visiblePoints = this.view.points;
            const points: CurvePoint[] = [visiblePoints[0], visiblePoints[visiblePoints.length - 1]];
            for (let i = 0, len = points.length; i < len; i++) {
                const p = importCurvePoint((points[i]));
                p.crdtidx = [i] as BasicArray<number>;
                p.id = v4();
                points[i] = p;
            }
            const api = this.api('simplify');
            api.deletePoints(this.page, this.line, 0, this.line.points.length, 0);
            api.contactModifyEditState(this.page, this.line, false);
            api.addPoints(this.page, this.line, points, 0);
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 修改连接线的起点位置，期间涉及到改变端点 */
    modifyFrom(point: { x: number, y: number }, target?: { apex: ContactForm, point: { x: number, y: number } }) {
        if (this.exception) return;
        try {
            const api = this.api("modifyFrom");
            if (target) {
                if (!this.line.from) {
                    api.shapeModifyContactFrom(this.page, this.line, target.apex);
                    const apex = this.page.getShape(target.apex.shapeId)!;
                    const role = new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.From, this.line.id);
                    api.addContactAt(this.page, apex, role, apex.style.contacts?.length ?? 0);
                }
                modifyContactLineCurvePoint(api, this.page, this.line, target.point, 0);
            } else {
                if (this.line.from) {
                    const ex = this.page.getShape(this.line.from.shapeId)!;
                    const index = ex?.style?.contacts?.findIndex(i => i.shapeId === this.line.id);
                    if (index !== undefined && index > -1) api.removeContactRoleAt(this.page, ex, index);
                    api.shapeModifyContactFrom(this.page, this.line, undefined);
                }
                modifyContactLineCurvePoint(api, this.page, this.line, point, 0);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 修改连接线的终点位置，期间涉及到改变端点 */
    modifyTo(point: { x: number, y: number }, target?: { apex: ContactForm, point: { x: number, y: number } }) {
        if (this.exception) return;
        try {
            const api = this.api("modifyTo");
            if (target) {
                if (!this.line.to) {
                    api.shapeModifyContactTo(this.page, this.line, target.apex);
                    const apex = this.page.getShape(target.apex.shapeId)!;
                    const role = new ContactRole(new BasicArray<number>(), v4(), ContactRoleType.To, this.line.id);
                    api.addContactAt(this.page, apex, role, apex.style.contacts?.length ?? 0);
                }
                modifyContactLineCurvePoint(api, this.page, this.line, target.point, this.line.points.length - 1);
            } else {
                if (this.line.to) {
                    const ex = this.page.getShape(this.line.to.shapeId)!;
                    const index = ex?.style?.contacts?.findIndex(i => i.shapeId === this.line.id);
                    if (index !== undefined && index > -1) api.removeContactRoleAt(this.page, ex, index);
                    api.shapeModifyContactTo(this.page, this.line, undefined);
                }
                modifyContactLineCurvePoint(api, this.page, this.line, point, this.line.points.length - 1);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 调整连接线所在父级 */
    migrate(target: GroupShape) {
        if (this.exception) return;
        try {
            const api = this.api("migrate");
            const origin: GroupShape = this.line.parent as GroupShape;
            const { x, y } = this.line.matrix2Root().computeCoord2(this.line.frame.x, this.line.frame.y);
            api.shapeMove(this.page, origin, origin.indexOfChild(this.line), target, target.childs.length);
            translateTo(api, this.page, this.line, x, y);
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 将连接线的当前路径固定到data */
    solidify(index: number) {
        if (this.exception) return;
        try {
            const api = this.api("solidify");
            const solidPoints = getPointForSolid(this.pageView, this.view, index, this.view.getPoints());
            beforeModifySide(api, this.page, this.line, solidPoints);
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 修改连接线的边 */
    modifySide(index: number, dx: number, dy: number) {
        if (this.exception) return;
        try {
            const api = this.api("modifySide");
            modifyContactLineSide(api, this.page, this.line, index, index + 1, dx, dy);
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    commit() {
        if (!this.m_api) return;
        if (this.repo.isNeedCommit() && !this.exception) {
            this.repo.commit();
        } else {
            this.repo.rollback();
        }
        this.m_api = undefined;
    }
}

function modifyContactLineCurvePoint(api: Api, page: Page, line: ContactShape, target: {
    x: number,
    y: number
}, index: number) {
    const transform = line.matrix2Root().inverse; // ContactShape在data上的尺寸恒为1；
    const p = line.pathsegs[0].points[index];
    const save = { x: p.x, y: p.y };
    const tarVal = transform.computeCoord3(target);
    api.shapeModifyCurvPoint(page, line, index, tarVal, 0);
    const delta = { x: tarVal.x - save.x, y: tarVal.y - save.y };
    if (p.hasFrom) {
        const point = { x: (p.fromX ?? 0) + delta.x, y: (p.fromY ?? 0) + delta.y };
        api.shapeModifyCurvFromPoint(page, line, index, point, 0);
    }
    if (p.hasTo) {
        const point = { x: (p.toX ?? 0) + delta.x, y: (p.toY ?? 0) + delta.y };
        api.shapeModifyCurvToPoint(page, line, index, point, 0);
    }
}

function modifyContactLineSide(api: Api, page: Page, s: ContactShape, index1: number, index2: number, dx: number, dy: number) { // 以边为操作目标编辑路径
    const m = s.matrix2Root();

    const inverse = m.inverse;

    let p1: { x: number, y: number } = s.points[index1];
    let p2: { x: number, y: number } = s.points[index2];

    if (!p1 || !p2) {
        return false;
    }

    p1 = m.computeCoord2(p1.x, p1.y);
    p2 = m.computeCoord2(p2.x, p2.y);

    if (dx) {
        p1.x = p1.x + dx;
        p2.x = p2.x + dx;
    }
    if (dy) {
        p1.y = p1.y + dy;
        p2.y = p2.y + dy;
    }

    p1 = inverse.computeCoord3(p1);
    p2 = inverse.computeCoord3(p2);

    api.shapeModifyCurvPoint(page, s, index1, p1, 0);
    api.shapeModifyCurvPoint(page, s, index2, p2, 0);
}

function get_box_pagexy(shape: ShapeView) {
    const p = shape.parent!;
    const p2r = p.matrix2Root();
    const box = shape.boundingBox();
    const xy1 = p2r.computeCoord2(box.x, box.y);
    const xy2 = p2r.computeCoord2(box.x + box.width, box.y + box.height);
    return { xy1, xy2 }
}

function getPointForSolid(pageView: PageView, view: ContactLineView, index: number, points: CurvePoint[]) {
    let len = points.length;
    let result = [...points];

    if (index === 0) { // 如果编辑的线为第一根线；
        const from = pageView.getView(view.fromShape?.id ?? '');
        if (!from) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const xy_result = get_box_pagexy(from);
        if (!xy_result) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const { xy1, xy2 } = xy_result;
        let p = get_nearest_border_point(from, view.contactFrom!.contactType, from.matrix2Root(), xy1, xy2);
        if (!p) {
            const p = result[0];
            result.splice(1, 0, new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result
        }

        const m1 = view.matrix2Root().inverse;
        p = m1.computeCoord3(p);
        const cp = new CurvePoint([1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        const cp2 = new CurvePoint([2] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        result.splice(1, 0, cp, cp2);
    }
    if (index === len - 2) { // 编辑的线为最后一根线；
        len = result.length; // 更新一下长度，因为部分场景下，编辑的线会同时为第一根线和最后一根线，若是第一根线的话，原数据已经更改，需要在下次更改数据前并判定为最后一根线后去更新result长度。
        const to = pageView.getView(view.toShape?.id ?? '');
        if (!to) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const xy_result = get_box_pagexy(to);
        if (!xy_result) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const { xy1, xy2 } = xy_result;
        let p = get_nearest_border_point(to, view.contactTo!.contactType, to.matrix2Root(), xy1, xy2);
        if (!p) {
            const p = points[points.length - 1];
            result.splice(len - 1, 0, new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight));
            return result;
        }

        const inverse = view.matrix2Root().inverse;

        p = inverse.computeCoord3(p);
        const cp = new CurvePoint([len - 1] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        const cp2 = new CurvePoint([len] as BasicArray<number>, v4(), p.x, p.y, CurveMode.Straight);
        result.splice(len - 1, 0, cp, cp2)
    }
    return result;
}

function solidifyPoints(api: Api, page: Page, contactLine: ContactShape, points: CurvePoint[]) {
    api.deletePoints(page, contactLine, 0, contactLine.pathsegs[0].points.length, 0);
    for (let i = 0, len = points.length; i < len; i++) {
        const p = importCurvePoint((points[i]));
        p.id = v4();
        points[i] = p;
    }
    api.addPoints(page, contactLine as PathShape, points, 0);
}

function beforeModifySide(api: Api, page: Page, line: ContactShape, visiblePoints: CurvePoint[]) {
    solidifyPoints(api, page, line, visiblePoints);
    api.contactModifyEditState(page, line, true);
}
