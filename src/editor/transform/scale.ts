import { CoopRepository } from "../../editor/coop/cooprepo";
import { AsyncApiCaller } from "./handler";
import { Document } from "../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../dataview";
import { SizeRecorder, afterModifyGroupShapeWH, expandTo } from "../../editor/frame";
import { Matrix } from "../../basic/matrix";
import { GroupShape, ShapeFrame } from "../../data/shape";

export type ScaleUnit = {
    shape: ShapeView;

    targetXY: { x: number, y: number };
    targetWidth: number;
    targetHeight: number;

    baseWidth: number;
    baseHeight: number;
    needFlipH: boolean;
    needFlipV: boolean;
}

export class Scaler extends AsyncApiCaller {
    private shapes: ShapeView[];
    private recorder: SizeRecorder = new Map();

    constructor(repo: CoopRepository, document: Document, desc: string, page: PageView, shapes: ShapeView[]) {
        super(repo, document, page, desc);

        this.shapes = shapes;
    }

    excute() { }

    excute4multi(scaleX: number, scaleY: number, transformUnits: ScaleUnit[]) {
        try {
            for (let i = 0; i < transformUnits.length; i++) {
                const t = transformUnits[i];
                const shape = adapt2Shape(t.shape);

                const x = t.targetXY.x;
                const y = t.targetXY.y;
                const width = t.targetWidth;
                const height = t.targetHeight;

                this.api.shapeModifyX(this.page, shape, x);
                this.api.shapeModifyY(this.page, shape, y);
                this.api.shapeModifyWH(this.page, shape, width, height);
                // expandTo(this.api, this.page, shape, width, height);

                // todo 约束
            }
            this.updateView();
        } catch (error) {
            this.rollback();
        }
    }
}