/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicArray, CurveMode, CurvePoint, Document, OvalShape, Page, PathSegment, Shape } from "../../data";
import { adapt2Shape, PageView, PathShapeView, ShapeView } from "../../dataview";
import { v4 } from "uuid";
import { Matrix } from "../../basic/matrix";
import { uuid } from "../../basic/uuid";
import { AsyncApiCaller } from "./basic/asyncapi";
import { Api, CoopRepository } from "../../repo";

export function modifySweep(api: Api, page: Page, shapes: ShapeView[], value: number) {
    const end = Math.PI * 2 * (value / 100);
    for (const view of shapes) {
        const shape = adapt2Shape(view) as OvalShape;
        let startingAngle: number = shape.startingAngle!;

        if (shape.startingAngle === undefined) {
            api.ovalModifyStartingAngle(page, shape, 0);
            startingAngle = 0;
        }

        const target = startingAngle + end;
        api.ovalModifyEndingAngle(page, shape, target);
        modifyPathByArc(api, page, shape);
    }
}

export function modifyStartingAngle(api: Api, page: Page, shapes: ShapeView[], value: number) {
    const round = Math.PI * 2;
    for (const view of shapes) {
        const shape = adapt2Shape(view);
        if (!(shape instanceof OvalShape)) continue;
        const end = shape.endingAngle ?? round;
        const start = shape.startingAngle ?? 0;
        const delta = end - start;
        api.ovalModifyStartingAngle(page, shape, value);
        api.ovalModifyEndingAngle(page, shape, value + delta);

        modifyPathByArc(api, page, shape);
    }
}

export function modifyRadius(api: Api, page: Page, shapes: ShapeView[], value: number) {
    for (const view of shapes) {
        const shape = adapt2Shape(view);
        if (!(shape instanceof OvalShape)) continue;
        api.ovalModifyInnerRadius(page, shape, value);
        modifyPathByArc(api, page, shape);
    }
}

export function modifyPathByArc(api: Api, page: Page, shape: Shape) {
    if (!(shape instanceof OvalShape)) return;

    const round = Math.PI * 2;

    const radius = shape.innerRadius ?? 0;
    const start = shape.startingAngle ?? 0;
    const end = shape.endingAngle ?? round;

    const parser = new OvalPathParser({ start, end, radius });
    const segments = parser.getPath();
    if (segments.length) {
        let cornerRadius = 0;
        if (shape.pathsegs.length) {
            const points = shape.pathsegs[0].points;
            for (const point of points) {
                if (point?.radius) {
                    cornerRadius = point.radius;
                    break;
                }
            }
        }
        while (shape.pathsegs.length) api.deleteSegmentAt(page, shape, shape.pathsegs.length - 1);
        while (segments.length) {
            const { points, isClosed } = segments.pop()!;
            if (cornerRadius) points.forEach(i => i.radius = cornerRadius);
            points.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
            api.addSegmentAt(page, shape, 0, new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), isClosed));
        }
    }
}

export class OvalPathParser {
    private readonly starting: number;
    private readonly ending: number;
    private readonly radius: number;

    constructor(arc: { start: number; end: number, radius: number; }) {
        this.starting = arc.start;
        this.ending = arc.end;
        this.radius = arc.radius;
    }

    getPath() {
        const start = this.starting;
        const end = this.ending;
        const radius = this.radius;

        const round = Math.PI * 2;

        const segments: { points: CurvePoint[], isClosed: boolean }[] = [];

        const sweep = Number(((end - start) / round).toFixed(4));

        if (!sweep) {
            const points = [this.__p(start, 1), this.__p(start, (1 + (1 - radius)) / 2), this.__p(start, 1 - radius)];
            if (radius === 1) points.pop();
            segments.push({ points, isClosed: false });

        } else if (Math.abs(sweep) === 1) {
            if (radius) {
                const points = this.getQuarters(1);
                const points2 = this.getQuarters(radius);
                segments.push({ points, isClosed: true }, { points: points2, isClosed: true });
            } else {
                const points = this.getQuarters(1);
                segments.push({ points, isClosed: true });
            }
        } else {
            const matrix = new Matrix();
            matrix.rotate(start, 0.5, 0.5);
            const points = []
            const arc = this.getArcPoints(start, end, 1);//获取外层圆弧

            if (arc.length) {
                const alpha = arc[0];
                alpha.mode = CurveMode.Disconnected;
                alpha.toX = undefined;
                alpha.toY = undefined;
                alpha.hasTo = undefined;
                this.transform(arc, matrix);
                points.push(...arc);
            }

            const arc2 = this.getArcPoints(start, end, radius); //获取内层圆弧
            if (arc2.length > 1) {
                const alpha = arc2[0];
                alpha.mode = CurveMode.Disconnected;
                alpha.toX = undefined;
                alpha.toY = undefined;
                alpha.hasTo = undefined;
                this.transform(arc2, matrix);
                points.push(...this.reverse(arc2));
            } else points.push(arc2[0]);

            segments.push({ points, isClosed: true });

        }

        return segments;
    }

    private __p(arc: number, length: number) {
        if (!length) {
            return new CurvePoint([0] as BasicArray<number>, v4(), 0.5, 0.5, CurveMode.Straight);
        } else {
            const matrix = new Matrix();
            matrix.rotate(arc, 0.5, 0.5);
            const xy = matrix.computeCoord2(length, 0.5);
            return new CurvePoint([0] as BasicArray<number>, v4(), xy.x, xy.y, CurveMode.Straight);
        }
    }

    private getQuarters(radius: number = 1) {
        const kappa = 4 * (Math.sqrt(2) - 1) / 3 * (radius / 2);
        const padding = (1 - radius) / 2;
        const top = new CurvePoint([0] as BasicArray<number>, v4(), 0.5, padding, CurveMode.Mirrored);
        top.toX = 0.5 - kappa;
        top.toY = padding;
        top.fromX = 0.5 + kappa;
        top.fromY = padding
        top.hasTo = true;
        top.hasFrom = true;

        const right = new CurvePoint([0] as BasicArray<number>, v4(), 1 - padding, 0.5, CurveMode.Mirrored);
        right.toX = 1 - padding;
        right.toY = 0.5 - kappa;
        right.fromX = 1 - padding;
        right.fromY = 0.5 + kappa;
        right.hasTo = true;
        right.hasFrom = true;

        const bottom = new CurvePoint([0] as BasicArray<number>, v4(), 0.5, 1 - padding, CurveMode.Mirrored);
        bottom.toX = 0.5 + kappa;
        bottom.toY = 1 - padding;
        bottom.fromX = 0.5 - kappa;
        bottom.fromY = 1 - padding;
        bottom.hasTo = true;
        bottom.hasFrom = true;

        const left = new CurvePoint([0] as BasicArray<number>, v4(), padding, 0.5, CurveMode.Mirrored);
        left.toX = padding;
        left.toY = 0.5 + kappa;
        left.fromX = padding;
        left.fromY = 0.5 - kappa;
        left.hasTo = true;
        left.hasFrom = true;

        return [right, bottom, left, top];
    }
    
    private getArcPoints(start: number, end: number, radius: number) {
        if (!radius) return [new CurvePoint([0] as BasicArray<number>, v4(), 0.5, 0.5, CurveMode.Straight)];
        const points = this.getQuarters(radius);
        

        const arcPoints: CurvePoint[] = [];

        const __sweep = (end - start) / (Math.PI * 2) * 100;
        const sweep = Math.abs(__sweep);
        const fragmentsList: CurvePoint[] = [];

        if (sweep > 0 && sweep < 25) {

            const t = sweep / 25;
            const [right, bottom] = points;
            const fragment = this.cubicBezierFragment(right, bottom, t);
       
            arcPoints.push(fragment.start, fragment.end);

        } else if (sweep === 25) {

            const [right, bottom] = points;
            bottom.fromX = undefined;
            bottom.fromY = undefined;
            bottom.mode = CurveMode.Disconnected;
            bottom.hasFrom = undefined;
            arcPoints.push(right, bottom);
        } else if (sweep > 25 && sweep < 50) {

            const t = (sweep - 25) / 25;
            const [right, bottom, left] = points;
            const fragment = this.cubicBezierFragment(bottom, left, t);
            arcPoints.push(right, fragment.start, fragment.end);
        } else if (sweep === 50) {

            const [right, bottom, left] = points;
            left.fromX = undefined;
            left.fromY = undefined;
            left.mode = CurveMode.Disconnected;
            left.hasFrom = undefined;
            arcPoints.push(right, bottom, left);
        } else if (sweep > 50 && sweep < 75) {

            const t = (sweep - 50) / 25;
            const [right, bottom, left, top] = points;
            const fragment = this.cubicBezierFragment(left, top, t);
            arcPoints.push(right, bottom, fragment.start, fragment.end);
        } else if (sweep === 75) {

            const [right, bottom, left, top] = points;
            top.fromX = undefined;
            top.fromY = undefined;
            top.mode = CurveMode.Disconnected;
            top.hasFrom = undefined;
            arcPoints.push(right, bottom, left, top);
        } else if (sweep > 75 && sweep < 100) {

            const t = (sweep - 75) / 25;
            const [right, bottom, left, top] = points;
            const fragment = this.cubicBezierFragment(top, right, t);
            arcPoints.push(right, bottom, left, fragment.start, fragment.end);
        }

        // 往上翻一下
        if (__sweep < 0) {
            const matrix = new Matrix();
            matrix.flipVert(0.5);
            this.transform(arcPoints, matrix);
        }

        return arcPoints;
    }

    private transform(points: CurvePoint[], matrix: Matrix) {
        points.forEach(p => {
            const xy = matrix.computeCoord2(p.x, p.y);
            p.x = xy.x;
            p.y = xy.y;
            if (p.hasFrom) {
                const from = matrix.computeCoord2(p.fromX!, p.fromY!);
                p.fromX = from.x;
                p.fromY = from.y;
            }
            if (p.hasTo) {
                const to = matrix.computeCoord2(p.toX!, p.toY!);
                p.toX = to.x;
                p.toY = to.y;
            }
        });
        return points;
    }

    /**
     * 逆向一条曲线
     */
    private reverse(points: CurvePoint[]) {
        let __points: CurvePoint[] = [];
        for (const point of points) {
            let to = point.hasTo;
            point.hasTo = point.hasFrom;
            point.hasFrom = to;

            let toX = point.toX;
            point.toX = point.fromX;
            point.fromX = toX;
            let toY = point.toY;
            point.toY = point.fromY;
            point.fromY = toY;

            __points.unshift(point);
        }
        return __points;
    }

    /**
     * @description 分割三阶贝塞尔曲线
     */
    private cubicBezierFragment(start: CurvePoint, end: CurvePoint, t: number) {
        const c1 = { x: start.fromX!, y: start.fromY! };
        const c2 = { x: end.toX!, y: end.toY! };

        const d = 1 - t;

        const x1 = d * start.x + t * c1.x;
        const y1 = d * start.y + t * c1.y;

        const x2 = d * c1.x + t * c2.x;
        const y2 = d * c1.y + t * c2.y;

        const x3 = d * c2.x + t * end.x;
        const y3 = d * c2.y + t * end.y;

        const x4 = d * x1 + t * x2;
        const y4 = d * y1 + t * y2;

        const x5 = d * x2 + t * x3;
        const y5 = d * y2 + t * y3;

        const x6 = d * x4 + t * x5;
        const y6 = d * y4 + t * y5;


        start.fromX = x1;
        start.fromY = y1;
        start.mode = CurveMode.Disconnected;

        const __end = new CurvePoint([0] as BasicArray<number>, v4(), x6, y6, CurveMode.Disconnected);
        __end.toX = x4;
        __end.toY = y4;
        __end.hasTo = true;
        __end.hasFrom = false;

        return { start, end: __end };
    }
}

export class OvalModifier extends AsyncApiCaller {
    private __delta: Map<ShapeView, number> = new Map();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('oval-modify');
    }

    private getDelta(view: ShapeView) {
        let d = this.__delta.get(view);
        if (d === undefined) {
            d = ((view as PathShapeView).endingAngle ?? Math.PI * 2) - ((view as PathShapeView).startingAngle ?? 0);
            this.__delta.set(view, d);
        }
        return d;
    }

    modifyStart(value: number, shapes: ShapeView[]) {
        const api = this.api;
        const page = this.page;
        for (const view of shapes) {
            const oval = adapt2Shape(view);
            if (!(oval instanceof OvalShape)) continue;
            const delta = this.getDelta(view);

            api.ovalModifyStartingAngle(page, oval, value);
            api.ovalModifyEndingAngle(page, oval, value + delta);

            modifyPathByArc(api, page, oval);
        }
        this.updateView();
    }

    modifyEnd(value: number, shapes: ShapeView[]) {
        const api = this.api;
        const page = this.page;
        for (const view of shapes) {
            const oval = adapt2Shape(view);
            if (!(oval instanceof OvalShape)) continue;
            api.ovalModifyEndingAngle(page, oval, value);
            modifyPathByArc(api, page, oval);
        }
        this.updateView();
    }

    modifyRadius(value: number, shapes: ShapeView[]) {
        const api = this.api;
        const page = this.page;
        for (const view of shapes) {
            const oval = adapt2Shape(view);
            if (!(oval instanceof OvalShape)) continue;
            api.ovalModifyInnerRadius(page, oval, value);
            modifyPathByArc(api, page, oval);
        }
        this.updateView();
    }

    swapGap(view: ShapeView) {
        const api = this.api;
        const page = this.page;

        const shape = adapt2Shape(view);
        if (!(shape instanceof OvalShape)) return;

        const round = Math.PI * 2;
        const start = shape.startingAngle ?? 0;
        const end = shape.endingAngle ?? round;
        const sweep = (end - start) / round;

        if (sweep === 1) return;
        if (sweep === 0) return api.ovalModifyEndingAngle(page, shape, start + round);

        const targetSweep = sweep < 0 ? sweep + 1 : sweep - 1;
        const targetEnd = start + targetSweep * round;

        api.ovalModifyEndingAngle(page, shape, targetEnd);
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}