import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { CurveMode, CurvePoint, PathShape, PathShape2, Shape } from "../../data/shape";
import { BasicArray } from "../../data/basic";
import { uuid } from "../../basic/uuid";
import { after_insert_point, update_frame_by_points } from "../utils/path";
import { PathType } from "../../data/consts";

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

export class PathModifier extends AsyncApiCaller {
    readonly shape: Shape;

    constructor(repo: CoopRepository, document: Document, page: PageView, shape: ShapeView) {
        super(repo, document, page);

        this.shape = adapt2Shape(shape);
    }

    start() {
        return this.__repo.start('path-modify');
    }

    addPoint(segment: number, index: number) {
        try {
            let __segment = this.shape.pathType === PathType.Editable ? -1 : segment;

            this.api.addPointAt(
                this.page,
                this.shape,
                index,
                new CurvePoint(new BasicArray<number>(), uuid(), 0, 0, CurveMode.Straight),
                __segment
            );

            after_insert_point(this.page, this.api, this.shape, index, __segment);

            this.updateView();
            return true;
        } catch (e) {
            console.log('PathModifier.addPoint:', e);
            return false
        }
    }

    execute(units: ModifyUnits) {
        try {
            const api = this.api;
            const page = this.page;
            const shape = this.shape;

            if (shape.pathType === PathType.Editable) {
                const points = (this.shape as PathShape).points;
                const actions = units.get(0) || [];
                for (let i = 0; i < actions.length; i++) {
                    const unit = actions[i];
                    const point = points[unit.index];
                    if (!point) {
                        continue;
                    }

                    this.api.shapeModifyCurvPoint(page, shape, unit.index, { x: unit.x, y: unit.y });
                    if (point.hasFrom) {
                        api.shapeModifyCurvFromPoint(page, shape, unit.index, { x: unit.fromX, y: unit.fromY });
                    }
                    if (point.hasTo) {
                        api.shapeModifyCurvToPoint(page, shape, unit.index, { x: unit.toX, y: unit.toY });
                    }
                }
            } else if (shape.pathType === PathType.Multi) {
                units.forEach((actions, segment) => {
                    const points = (shape as PathShape2).pathsegs[segment].points;

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
            }

            // update_frame_by_points(api, page, shape as PathShape);
            this.updateView();
        } catch (e) {
            console.log('PathModifier.execute:', e);
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            update_frame_by_points(this.api, this.page, this.shape);

            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}