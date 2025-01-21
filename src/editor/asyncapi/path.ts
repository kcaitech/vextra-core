import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document, Point2D } from "../../data";
import { adapt2Shape, GroupShapeView, PageView, ShapeView } from "../../dataview";
import { CurveMode, CurvePoint, GroupShape, PathSegment, PathShape, Shape, ShapeFrame, ShapeType } from "../../data";
import { BasicArray } from "../../data";
import { uuid } from "../../basic/uuid";
import { __pre_curve, after_insert_point, update_frame_by_points } from "../utils/path";
import { PathType } from "../../data";
import { addCommonAttr, newflatStyle } from "../creator";
import { Border, BorderStyle, CornerType, Fill, FillType, Shadow, Style } from "../../data";
import { Color } from "../../data";
import * as types from "../../data/typesdefine";
import { ISave4Restore, LocalCmd, SelectionState } from "../../coop/localcmd";
import { BorderSideSetting, ShapeSize, SideType, Transform } from "../../data";
import { importStyle } from "../../data/baseimport";
import { exportStyle } from "../../data/baseexport";

export type ModifyUnits = Map<number,
    {
        index: number;
        x: number;
        y: number;
        fromX: number;
        fromY: number;
        toX: number;
        toY: number;
    }[]
>;

/**
 * @description 路径处理器
 */
export class PathModifier extends AsyncApiCaller {
    private shape: Shape | undefined;

    constructor(repo: CoopRepository, document: Document, page: PageView, needStoreSelection = false) {
        super(repo, document, page);

        if (needStoreSelection) {
            this.__repo.rollback();
            this.api = this.__repo.start('path-modify', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = this.shape ? [this.shape.id] : [];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
        }
    }

    start() {
        return this.__repo.start('path-modify');
    }

    private modifyBorderSetting() {
        if (this.haveEdit || !this.shape) return;
        const border = this.shape.getBorders();
        const { thicknessBottom, thicknessTop, thicknessLeft, thicknessRight, sideType } = border.sideSetting;
        if (sideType === SideType.Normal) return;
        const thickness = Math.max(thicknessBottom, thicknessTop, thicknessLeft, thicknessRight);
        this.api.setBorderSide(this.page, this.shape, new BorderSideSetting(SideType.Normal, thickness, thickness, thickness, thickness));
        this.api.shapeEditPoints(this.page, this.shape, true);
    }

    get haveEdit() {
        return !!this.shape?.haveEdit;
    }

    createVec(name: string, frame: ShapeFrame, parent: GroupShapeView, _style?: Style) {
        try {

            const style = _style ? importStyle(exportStyle(_style)) : newflatStyle();

            if (!_style) {
                const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
                const strokePaints = new BasicArray<Fill>();
                const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0));
                strokePaints.push(strokePaint);
                const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
                style.borders = border;
            } else {
                style.fills = new BasicArray<Fill>();
                style.shadows = new BasicArray<Shadow>();
            }

            const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
            const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(p1), false);

            const size = new ShapeSize(frame.width, frame.height);
            const trans = new Transform();
            trans.m02 = frame.x;
            trans.m12 = frame.y;
            const vec = new PathShape(new BasicArray(), uuid(), name, ShapeType.Path, trans, style, size, new BasicArray<PathSegment>(segment));

            addCommonAttr(vec);

            const env = adapt2Shape(parent) as GroupShape;
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            let targetIndex = env.childs.length;
            if (_types.includes(env.type)) {
                const Fixed = types.ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const fixed_index = env.childs.findIndex(s => s.scrollBehavior === Fixed);
                targetIndex = fixed_index === -1 ? env.childs.length : fixed_index;
            }
            this.api.shapeInsert(this.__document, this.page, env, vec, targetIndex);

            this.shape = env.childs[targetIndex];

            this.updateView();

            return this.shape;
        } catch (e) {
            console.error('PathModifier.createVec', e);
            this.exception = true;
            return false;
        }
    }

    addPoint(shape: ShapeView, segment: number, index: number, apex?: { xy: Point2D, t?: number }) {
        try {
            const _shape = adapt2Shape(shape);
            this.shape = _shape;
            this.modifyBorderSetting();
            this.api.addPointAt(
                this.page,
                _shape,
                index,
                new CurvePoint(new BasicArray<number>(), uuid(), 0, 0, CurveMode.Straight),
                segment
            );
            after_insert_point(this.page, this.api, _shape, index, segment, apex);
            this.updateView();
            return true;
        } catch (e) {
            this.exception = true;
            throw e;
        }
    }

    addPointForPen(shape: ShapeView, segment: number, index: number, xy: { x: number, y: number }) {
        try {
            if (segment < 0 || index < 0) return false;
            const _shape = adapt2Shape(shape);
            this.shape = _shape;
            this.api.addPointAt(
                this.page,
                _shape,
                index,
                new CurvePoint(new BasicArray<number>(), uuid(), xy.x, xy.y, CurveMode.Straight),
                segment
            );

            this.updateView();
            return true;
        } catch (e) {
            console.log('PathModifier.addPointForPen:', e);
            return false
        }
    }

    addSegmentForPen(shape: ShapeView, xy: { x: number, y: number }) {
        try {
            const _shape = adapt2Shape(shape);
            this.shape = _shape;
            const index = (this.shape as PathShape).pathsegs.length;
            const point = new CurvePoint([0] as BasicArray<number>, uuid(), xy.x, xy.y, CurveMode.Straight);
            const segment = new PathSegment([index] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(point), false);
            this.api.addSegmentAt(this.page, _shape, index, segment);
            this.api.shapeEditPoints(this.page, _shape, true);

            this.updateView();

            return true;
        } catch (e) {
            console.log('PathModifier.addSegmentForPen:', e);
            return false;
        }
    }

    execute(_shape: ShapeView, units: ModifyUnits) {
        try {
            const api = this.api;
            const page = this.page;
            const shape = adapt2Shape(_shape);
            this.shape = shape;

            if (shape.pathType !== PathType.Editable) {
                return;
            }
            this.modifyBorderSetting();
            units.forEach((actions, segment) => {
                const points = (shape as PathShape).pathsegs[segment].points;

                for (let i = 0; i < actions.length; i++) {
                    const unit = actions[i];
                    const point = points[unit.index];
                    if (!point) {
                        continue;
                    }

                    this.api.shapeModifyCurvPoint(page, shape, unit.index, { x: unit.x, y: unit.y }, segment);

                    if (point.hasFrom) {
                        api.shapeModifyCurvFromPoint(page, shape, unit.index, {
                            x: unit.fromX,
                            y: unit.fromY
                        }, segment);
                    }

                    if (point.hasTo) {
                        api.shapeModifyCurvToPoint(page, shape, unit.index, { x: unit.toX, y: unit.toY }, segment);
                    }
                }
            })


            // update_frame_by_points(api, page, shape as PathShape);
            this.updateView();
        } catch (e) {
            console.log('PathModifier.execute:', e);
            this.exception = true;
        }
    }

    preCurve(order: 2 | 3, shape: ShapeView, index: number, segmentIndex: number) {
        this.modifyBorderSetting();
        this.shape = adapt2Shape(shape);
        __pre_curve(order, this.page, this.api, this.shape, index, segmentIndex);
    }

    preCurve2(order: 2 | 3, shape: ShapeView, index: number, segmentIndex: number) {
        try {
            this.shape = adapt2Shape(shape);

            if (segmentIndex < 0) {
                return;
            }

            let point: CurvePoint | undefined = undefined;

            point = (this.shape as PathShape)?.pathsegs[segmentIndex]?.points[index];

            if (!point) {
                return;
            }

            const api = this.api;
            const page = this.page;
            const __shape = this.shape;
            if (order === 2) { // 二次曲线
                if (point.mode !== CurveMode.Disconnected) {
                    api.modifyPointCurveMode(page, __shape, index, CurveMode.Disconnected, segmentIndex);
                }

                api.shapeModifyCurvFromPoint(page, __shape, index, { x: point.x, y: point.y }, segmentIndex);
                api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
            } else { // 三次曲线
                if (point.mode !== CurveMode.Mirrored) {
                    api.modifyPointCurveMode(page, __shape, index, CurveMode.Mirrored, segmentIndex);
                }

                api.shapeModifyCurvFromPoint(page, __shape, index, { x: point.x, y: point.y }, segmentIndex);
                api.shapeModifyCurvToPoint(page, __shape, index, { x: point.x, y: point.y }, segmentIndex);
                api.modifyPointHasFrom(page, __shape, index, true, segmentIndex);
                api.modifyPointHasTo(page, __shape, index, true, segmentIndex);
            }


            this.updateView();
        } catch (e) {
            console.error('PathModifier.preCurve2', e);
            this.exception = true;
        }
    }

    execute4handle(_shape: ShapeView, index: number, side: 'from' | 'to',
        from: { x: number, y: number },
        to: { x: number, y: number },
        segmentIndex: number) {
        try {
            const api = this.api;
            const page = this.page;
            this.shape = adapt2Shape(_shape);
            const shape = this.shape;
            let mode: CurveMode | undefined = undefined;
            this.modifyBorderSetting();
            if (shape.pathType === PathType.Editable) {
                mode = (shape as PathShape)?.pathsegs[segmentIndex]?.points[index]?.mode;
            }

            if (mode === CurveMode.Mirrored || mode === CurveMode.Asymmetric) {
                api.shapeModifyCurvFromPoint(page, shape, index, from, segmentIndex);
                api.shapeModifyCurvToPoint(page, shape, index, to, segmentIndex);
            } else if (mode === CurveMode.Disconnected) {
                if (side === 'from') {
                    api.shapeModifyCurvFromPoint(page, shape, index, from, segmentIndex);
                } else {
                    api.shapeModifyCurvToPoint(page, shape, index, to, segmentIndex);
                }
            }

            this.updateView();
        } catch (e) {
            console.log('PathModifier.execute4handle:', e);
            this.exception = true;
        }
    }

    closeSegmentAt(_shape: ShapeView, segmentIndex: number) {
        const shape = adapt2Shape(_shape) as PathShape;

        this.shape = shape;

        const segment = shape.pathsegs[segmentIndex];

        if (!segment) {
            return false;
        }

        this.api.setCloseStatus(this.page, shape, true, segmentIndex);

        return true;
    }

    mergeSegment(_shape: ShapeView, segmentIndex: number, toSegmentIndex: number, at: 'start' | 'end') {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const segment = shape.pathsegs[segmentIndex];
            const toSegment = shape.pathsegs[toSegmentIndex];

            // 两条线段都需要是未闭合的线段才可以进行合并
            if (!segment || !toSegment || segment.isClosed || toSegment.isClosed) {
                return false;
            }

            const pointsContainer = new BasicArray<CurvePoint>();

            let __points: CurvePoint[] = [];
            let activeIndex;
            if (at === 'start') {
                __points = [...segment.points, ...toSegment.points];
                activeIndex = segment.points.length;
            } else {
                __points = [...toSegment.points];
                // 在目标线段的末尾处进行拼接，需要把当前线段的点位反置顺序
                for (let i = segment.points.length - 1; i > -1; i--) {

                    const op = segment.points[i];
                    const np = new CurvePoint(op.crdtidx, op.id, op.x, op.y, op.mode);
                    np.radius = op.radius;
                    np.hasTo = op.hasFrom;
                    np.hasFrom = op.hasTo;

                    np.fromX = op.toX;
                    np.fromY = op.toY;

                    np.toX = op.fromX;
                    np.toY = op.fromY;

                    __points.push(np);
                }

                activeIndex = toSegment.points.length - 1;
            }


            for (let i = 0; i < __points.length; i++) {
                const p = __points[i];
                const point = new CurvePoint([i] as BasicArray<number>, uuid(), p.x, p.y, p.mode);
                point.radius = p.radius;
                point.hasFrom = p.hasFrom;
                point.hasTo = p.hasTo;
                point.fromX = p.fromX;
                point.fromY = p.fromY;
                point.toX = p.toX;
                point.toY = p.toY;

                pointsContainer.push(point);
            }
            const api = this.api;
            const page = this.page;

            // 删除原有的线条
            api.deleteSegmentAt(page, shape, segmentIndex);
            api.deleteSegmentAt(page, shape, toSegmentIndex);

            // crdtidx重排
            pointsContainer.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);

            // 生成合并过后的线条
            const newSegment = new PathSegment([shape.pathsegs.length] as BasicArray<number>, uuid(), pointsContainer, false);
            api.addSegmentAt(page, shape, shape.pathsegs.length, newSegment);

            this.updateView();

            return { segment: shape.pathsegs.length - 1, activeIndex };
        } catch (e) {
            this.exception = true;
            throw e;
        }
    }

    /**
     * @description 折断handle
     */
    breakOffHandle(_shape: ShapeView, segmentIndex: number, index: number) {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const point = (shape as PathShape).pathsegs[segmentIndex].points[index];

            if (point.mode === CurveMode.Disconnected) {
                return true;
            }

            this.api.modifyPointCurveMode(this.page, shape, index, CurveMode.Disconnected, segmentIndex);

            this.updateView();

            return true;
        } catch (e) {
            console.error('PathModifier.breakOffHandle:', e);
            this.exception = true;
            return false;
        }
    }

    /**
     * @description 恢复handle
     */
    recoveryHandle(_shape: ShapeView, segmentIndex: number, index: number, recoverTo: CurveMode, activeSide: 'from' | 'to') {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const point = (shape as PathShape).pathsegs[segmentIndex].points[index];

            if (point.mode !== CurveMode.Disconnected) {
                return true;
            }

            const api = this.api;
            const page = this.page;

            api.modifyPointCurveMode(page, shape, index, recoverTo, segmentIndex);


            if (activeSide === 'from') {
                if (recoverTo === CurveMode.Mirrored) {
                    const deltaX = (point.fromX || 0) - point.x;
                    const deltaY = (point.fromY || 0) - point.y;

                    const _tx = point.x - deltaX;
                    const _ty = point.y - deltaY;

                    if (point.toX !== _tx || point.toY !== _ty) {
                        api.shapeModifyCurvToPoint(page, shape, index, { x: _tx, y: _ty }, segmentIndex);
                    }
                } else if (recoverTo === CurveMode.Asymmetric) {
                    const l = Math.hypot(point.x - (point.toX || 0), point.y - (point.toY || 0));
                    const angle = Math.atan2((point.fromX || 0) - point.x, (point.fromY || 0) - point.y);
                    const _l_x = Math.abs(Math.sin(angle) * l);
                    const _l_y = Math.abs(Math.cos(angle) * l);

                    const dx = (point.fromX || 0) - point.x;
                    const dy = (point.fromY || 0) - point.y;

                    const x = point.x - (dx / Math.abs(dx)) * _l_x;
                    const y = point.y - (dy / Math.abs(dy)) * _l_y;

                    if (point.toX !== x || point.toY !== x) {
                        api.shapeModifyCurvToPoint(page, shape, index, { x, y }, segmentIndex);
                    }
                }
            } else {
                if (recoverTo === CurveMode.Mirrored) {
                    const deltaX = (point.toX || 0) - point.x;
                    const deltaY = (point.toY || 0) - point.y;

                    const _tx = point.x - deltaX;
                    const _ty = point.y - deltaY;

                    if (point.fromX !== _tx || point.fromY !== _ty) {
                        api.shapeModifyCurvFromPoint(page, shape, index, { x: _tx, y: _ty }, segmentIndex);
                    }
                } else if (recoverTo === CurveMode.Asymmetric) {
                    const l = Math.hypot(point.x - (point.fromX || 0), point.y - (point.fromY || 0));
                    const angle = Math.atan2((point.toX || 0) - point.x, (point.toY || 0) - point.y);
                    const _l_x = Math.abs(Math.sin(angle) * l);
                    const _l_y = Math.abs(Math.cos(angle) * l);

                    const dx = (point.toX || 0) - point.x;
                    const dy = (point.toY || 0) - point.y;

                    const x = point.x - (dx / Math.abs(dx)) * _l_x;
                    const y = point.y - (dy / Math.abs(dy)) * _l_y;

                    if (point.fromX !== x || point.fromY !== x) {
                        api.shapeModifyCurvFromPoint(page, shape, index, { x, y }, segmentIndex);
                    }
                }
            }

            this.updateView();

            return true;
        } catch (e) {
            console.error('PathModifier.recoveryHandle:', e);
            this.exception = true;
            return false;
        }
    }

    reversePointsAt(_shape: ShapeView, segmentIndex: number) {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const segment = (shape as PathShape).pathsegs[segmentIndex];

            if (!segment) {
                return false;
            }
            const points = segment.points;

            const container: BasicArray<CurvePoint> = new BasicArray<CurvePoint>();

            // 反置点的顺序时，需要把from和to的相关值也一并反置
            for (let i = points.length - 1; i > -1; i--) {
                const op = points[i];
                const np = new CurvePoint([i] as BasicArray<number>, uuid(), op.x, op.y, op.mode);
                np.radius = op.radius;
                np.hasTo = op.hasFrom;
                np.hasFrom = op.hasTo;

                np.fromX = op.toX;
                np.fromY = op.toY;

                np.toX = op.fromX;
                np.toY = op.fromY;

                container.push(np);
            }
            const api = this.api;
            const page = this.page;

            api.deleteSegmentAt(page, shape, segmentIndex);
            const l = shape.pathsegs.length;
            container.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
            const newSegment = new PathSegment([l] as BasicArray<number>, uuid(), container, segment.isClosed);

            api.addSegmentAt(page, shape, l, newSegment);

            this.updateView();

            return { segment: l, activeIndex: newSegment.points.length - 1 };
        } catch (e) {
            console.error('PathModifier.reversePointsAt:', e);
            this.exception = true;
            return false;
        }
    }

    /**
     * @description 剪刀
     */
    clip(_shape: ShapeView, segmentIndex: number, index: number) {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const segment = shape?.pathsegs[segmentIndex];
            if (!segment) {
                throw new Error('wrong segment');
            }

            const { points, isClosed } = segment;

            if (!points[index]) {
                throw new Error('wrong index');
            }

            const len = points.length;

            if (len < 2) {
                throw new Error('wrong length');
            }

            const page = this.page;
            const api = this.api;

            if (!isClosed) {
                if (len === 2) {
                    //  直接删除线段
                    api.deleteSegmentAt(page, shape, segmentIndex);
                } else {
                    if (index === 0) {
                        //  删除第0个点
                        api.deletePoint(page, shape, 0, segmentIndex);
                    } else if (index === len - 2) {
                        // 删除最后一个点
                        api.deletePoint(page, shape, len - 1, segmentIndex);
                    } else {
                        //  以index为中间节点，将segment分为A，B两条，index处的点分给A线段
                        const pointsA = new BasicArray<CurvePoint>();
                        const pointsB = new BasicArray<CurvePoint>();

                        for (let i = 0; i <= index; i++) {
                            pointsA.push(points[i]);
                        }
                        for (let i = index + 1; i < len; i++) {
                            pointsB.push(points[i]);
                        }

                        api.deleteSegmentAt(page, shape, segmentIndex);
                        pointsA.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
                        pointsB.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
                        const segmentA = new PathSegment([shape.pathsegs.length] as BasicArray<number>, uuid(), pointsA, false);
                        api.addSegmentAt(page, shape, shape.pathsegs.length, segmentA);
                        const segmentB = new PathSegment([shape.pathsegs.length] as BasicArray<number>, uuid(), pointsB, false);
                        api.addSegmentAt(page, shape, shape.pathsegs.length, segmentB);
                    }
                }
            } else {
                //  打开线段，并将index处的点变成最后一个点
                const newPoints = new BasicArray<CurvePoint>();
                for (let i = index + 1; i < len; i++) {
                    newPoints.push(points[i]);
                }
                for (let i = 0; i <= index; i++) {
                    newPoints.push(points[i]);
                }

                api.deleteSegmentAt(page, shape, segmentIndex);
                newPoints.forEach((i, index) => i.crdtidx = [index] as BasicArray<number>);
                const newSegment = new PathSegment([shape.pathsegs.length] as BasicArray<number>, uuid(), newPoints, false);
                api.addSegmentAt(page, shape, shape.pathsegs.length, newSegment);
            }

            this.api.shapeEditPoints(this.page, shape, true);

            return true;
        } catch (e) {
            console.error('PathModifier.clip:', e);
            this.exception = true;
            return false;
        }
    }

    sortSegment(_shape: ShapeView) {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const api = this.api;
            const page = this.page;

            const segments = shape.pathsegs;
            if (!segments.length) {
                const parent = shape.parent as GroupShape;
                const index = parent.indexOfChild(shape);
                api.shapeDelete(this.__document, page, parent, index);
                return;
            }

            for (let i = segments.length - 1; i > -1; i--) {
                const segment = segments[i];
                if (segment.points.length < 2) {
                    api.deleteSegmentAt(page, shape, i);
                }
            }

        } catch (e) {
            console.error('PathModifier.sortSegment:', e);
            this.exception = true;
            return false;
        }
    }

    modifyClosedStatus(_shape: ShapeView, val: boolean) {
        try {
            const shape = adapt2Shape(_shape) as PathShape;

            this.shape = shape;

            const segments = shape?.pathsegs;

            if (!segments?.length) {
                return false;
            }

            const page = this.page;
            const api = this.api;

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                const points = segment.points;
                if (points.length < 3) continue;
                api.setCloseStatus(page, shape, val, i);
            }

            return true;
        } catch (e) {
            console.error('PathModifier.modifyClosedStatus:', e);
            this.exception = true;
            return false;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            update_frame_by_points(this.api, this.page, this.shape!);
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}