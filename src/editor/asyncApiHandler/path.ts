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
import { Border, BorderStyle, CornerType, FillType } from "../../data/style";
import { Color } from "../../data/color";
import * as types from "../../data/typesdefine";
import { ISave4Restore, LocalCmd, SelectionState } from "../coop/localcmd";
import { BorderSideSetting, SideType } from "../../data/classes";

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
    shape: Shape | undefined;

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
    modifyBorderSetting() {
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
        if ([ShapeType.Artboard, ShapeType.Rectangle, ShapeType.Image].includes(this.shape.type) && !this.shape.haveEdit) {
            return false;
        } else {
            return true;
        }
    }

    createVec(name: string, frame: ShapeFrame, parent: GroupShapeView) {
        try {
            const style = newflatStyle();
            const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);

            const border = new Border([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0), types.BorderPosition.Center, 1, new BorderStyle(0, 0), CornerType.Miter, side);
            style.borders.push(border);

            const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
            const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(p1), true);
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

    preCurve(shape: ShapeView, index: number, segment = -1) {
        this.modifyBorderSetting();
        this.shape = adapt2Shape(shape);
        __pre_curve(this.page, this.api, this.shape, index, segment);
    }

    preCurve2(shape: ShapeView, index: number, segment = -1) {
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
            if (point.mode !== CurveMode.Mirrored) {
                api.modifyPointCurveMode(page, __shape, index, CurveMode.Mirrored, segment);
            }

            api.shapeModifyCurvFromPoint(page, __shape, index, { x: point.x, y: point.y }, segment);
            api.shapeModifyCurvToPoint(page, __shape, index, { x: point.x, y: point.y }, segment);
            api.modifyPointHasFrom(page, __shape, index, true, segment);
            api.modifyPointHasTo(page, __shape, index, true, segment);

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

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            update_frame_by_points(this.api, this.page, this.shape!);

            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}