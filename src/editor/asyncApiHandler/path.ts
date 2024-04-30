import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, GroupShapeView, PageView, ShapeView } from "../../dataview";
import {
    CurveMode,
    CurvePoint,
    GroupShape,
    PathSegment,
    PathShape,
    Shape,
    ShapeFrame,
    ShapeType
} from "../../data/shape";
import { BasicArray } from "../../data/basic";
import { uuid } from "../../basic/uuid";
import { __pre_curve, after_insert_point, update_frame_by_points } from "../utils/path";
import { PathType } from "../../data/consts";
import { addCommonAttr, newflatStyle } from "../creator";
import { Border, BorderStyle, CornerType, FillType, Style } from "../../data/style";
import { Color } from "../../data/color";
import * as types from "../../data/typesdefine";
import { ISave4Restore, LocalCmd, SelectionState } from "../coop/localcmd";
import { BorderSideSetting, SideType } from "../../data/classes";
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
        const borders = this.shape.getBorders() || [];
        for (let i = 0; i < borders.length; i++) {
            const border = borders[i];
            const { thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
            const thickness = Math.max(thicknessBottom, thicknessTop, thicknessLeft, thicknessRight);
            this.api.setBorderSide(this.page, this.shape, i, new BorderSideSetting(SideType.Normal, thickness, thickness, thickness, thickness));
        }
        this.api.shapeEditPoints(this.page, this.shape, true);
    }

    get haveEdit() {
        if (!this.shape) {
            return false;
        }

        return !([ShapeType.Artboard, ShapeType.Rectangle, ShapeType.Image].includes(this.shape.type) && !this.shape.haveEdit);
    }

    createVec(name: string, frame: ShapeFrame, parent: GroupShapeView, _style?: Style) {
        try {

            const style = _style ? importStyle(exportStyle(_style)) : newflatStyle();

            if (!_style) {
                const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
                const border = new Border([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0), types.BorderPosition.Center, 1, new BorderStyle(0, 0), CornerType.Miter, side);
                style.borders.push(border);
            }

            const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
            const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(p1), false);
            const vec = new PathShape(new BasicArray(), uuid(), name, ShapeType.Path, frame, style, new BasicArray<PathSegment>(segment));

            addCommonAttr(vec);

            const env = adapt2Shape(parent) as GroupShape;

            this.api.shapeInsert(this.__document, this.page, env, vec, env.childs.length);

            this.shape = env.childs[env.childs.length - 1];

            this.updateView();

            return this.shape;
        } catch (e) {
            console.error('PathModifier.createVec', e);
            this.exception = true;
            return false;
        }
    }

    addPoint(shape: ShapeView, segment: number, index: number) {
        try {
            const _shape = adapt2Shape(shape);
            this.shape = _shape;
            let __segment = _shape.pathType === PathType.Editable ? -1 : segment;
            this.modifyBorderSetting();

            this.api.addPointAt(
                this.page,
                _shape,
                index,
                new CurvePoint(new BasicArray<number>(), uuid(), 0, 0, CurveMode.Straight),
                __segment
            );

            after_insert_point(this.page, this.api, _shape, index, __segment);

            this.updateView();
            return true;
        } catch (e) {
            console.log('PathModifier.addPoint:', e);
            return false
        }
    }

    addPointForPen(shape: ShapeView, segment: number, index: number, xy: { x: number, y: number }) {
        try {
            if (segment < 0 || index < 0) {
                return false;
            }
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

    preCurve(order: 2 | 3, shape: ShapeView, index: number, segment = -1) {
        this.modifyBorderSetting();
        this.shape = adapt2Shape(shape);
        __pre_curve(order, this.page, this.api, this.shape, index, segment);
    }

    preCurve2(order: 2 | 3, shape: ShapeView, index: number, segment = -1) {
        try {
            this.shape = adapt2Shape(shape);

            if (segment < 0) {
                return;
            }

            let point: CurvePoint | undefined = undefined;

            if (segment > -1) {
                point = (this.shape as PathShape)?.pathsegs[segment].points[index];
            }

            if (!point) {
                return;
            }

            const api = this.api;
            const page = this.page;
            const __shape = this.shape;
            if (order === 2) { // 二次曲线
                if (point.mode !== CurveMode.Disconnected) {
                    api.modifyPointCurveMode(page, __shape, index, CurveMode.Disconnected, segment);
                }

                api.shapeModifyCurvFromPoint(page, __shape, index, { x: point.x, y: point.y }, segment);
                api.modifyPointHasFrom(page, __shape, index, true, segment);
            } else { // 三次曲线
                if (point.mode !== CurveMode.Mirrored) {
                    api.modifyPointCurveMode(page, __shape, index, CurveMode.Mirrored, segment);
                }

                api.shapeModifyCurvFromPoint(page, __shape, index, { x: point.x, y: point.y }, segment);
                api.shapeModifyCurvToPoint(page, __shape, index, { x: point.x, y: point.y }, segment);
                api.modifyPointHasFrom(page, __shape, index, true, segment);
                api.modifyPointHasTo(page, __shape, index, true, segment);
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
                   segment = -1) {
        try {
            const api = this.api;
            const page = this.page;
            this.shape = adapt2Shape(_shape);
            const shape = this.shape;
            let mode: CurveMode | undefined = undefined;
            this.modifyBorderSetting();
            if (shape.pathType === PathType.Editable) {
                mode = (shape as PathShape)?.pathsegs[segment]?.points[index]?.mode;
            }

            if (mode === CurveMode.Mirrored || mode === CurveMode.Asymmetric) {
                api.shapeModifyCurvFromPoint(page, shape, index, from, segment);
                api.shapeModifyCurvToPoint(page, shape, index, to, segment);
            } else if (mode === CurveMode.Disconnected) {
                if (side === 'from') {
                    api.shapeModifyCurvFromPoint(page, shape, index, from, segment);
                } else {
                    api.shapeModifyCurvToPoint(page, shape, index, to, segment);
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
            let activeIndex = 0;
            if (at === 'start') {
                __points = [...segment.points, ...toSegment.points];
                activeIndex = segment.points.length;
            } else {
                __points = [...toSegment.points];
                for (let i = segment.points.length - 1; i > -1; i--) {
                    __points.push(segment.points[i]);
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

            // 生成合并过后的线条
            const newSegment = new PathSegment([shape.pathsegs.length] as BasicArray<number>, uuid(), pointsContainer, false);
            api.addSegmentAt(page, shape, shape.pathsegs.length, newSegment);

            this.updateView();

            return { segment: shape.pathsegs.length - 1, activeIndex };
        } catch (e) {
            console.error('PathModifier.mergeSegmentFromStart:', e);
            this.exception = true;
            return false;
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

            for (let i = points.length - 1; i > -1; i--) {
                container.push(points[i]);
            }
            const api = this.api;
            const page = this.page;

            api.deleteSegmentAt(page, shape, segmentIndex);
            const l = shape.pathsegs.length;
            const newSegment = new PathSegment([l] as BasicArray<number>, uuid(), container, segment.isClosed);

            api.addSegmentAt(page, shape, l, newSegment);

            this.updateView();

            return true;
        } catch (e) {
            console.error('PathModifier.reversePointsAt:', e);
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