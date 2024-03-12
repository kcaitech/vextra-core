import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, ImageShapeView, PageView, PathShapeView } from "../../dataview";
import { CurveMode, CurvePoint, ImageShape, PathShape } from "../../data/shape";
import { Matrix } from "../../basic/matrix";
import { BasicArray } from "../../data/basic";
import { uuid } from "../../basic/uuid";
import { after_insert_point, pointsEdit, update_frame_by_points } from "../utils/path";

export type ModifyUnits = {
    index: number;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
}[];

export class PathModifier extends AsyncApiCaller {
    private shape: PathShape | ImageShape;
    private matrixParent2rootCache: Matrix | undefined;

    constructor(repo: CoopRepository, document: Document, page: PageView, shape: PathShapeView | ImageShapeView) {
        super(repo, document, page);

        this.shape = adapt2Shape(shape) as PathShape | ImageShape;
    }

    start() {
        return this.__repo.start('path-modify');
    }

    get matrixUnit2root() {
        const m = this.shape.matrix2Parent();
        m.multiAtLeft(this.matrixParent2rootCache || this.shape.parent!.matrix2Root());
        const frame = this.shape.frame;
        m.preScale(frame.width, frame.height);
        return m;
    }

    get matrixUnit2rootInverse() {
        return new Matrix(this.matrixUnit2root.inverse);
    }

    addPoint(index: number) {
        try {
            this.api.addPointAt(this.page, this.shape, index,
                new CurvePoint(new BasicArray<number>(), uuid(), 0, 0, CurveMode.Straight)
            );

            after_insert_point(this.page, this.api, this.shape, index);

            this.updateView();
            return true;
        } catch (e) {
            console.log('PathModifier.addPoint:', e);
            return false
        }
    }

    execute(units: ModifyUnits) {
        try {
            const points = this.shape.points;
            const api = this.api;
            const page = this.page;
            const shape = this.shape;

            for (let i = 0; i < units.length; i++) {
                const unit = units[i];
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

            update_frame_by_points(api, page, shape as PathShape);

            this.updateView();
        } catch (e) {
            console.log('PathModifier.execute:', e);
            this.exception = true;
        }
    }

}