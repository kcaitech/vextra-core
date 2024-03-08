import { CoopRepository } from "../coop/cooprepo";
import { AsyncApiCaller } from "./handler";
import { Document } from "../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../dataview";
import { SizeRecorder, afterModifyGroupShapeWH, expandTo } from "../frame";

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
    private recorder: SizeRecorder = new Map();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('sync-scale')
    }

    execute() { }

    execute4multi(scaleX: number, scaleY: number, transformUnits: ScaleUnit[]) {
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

                if (t.needFlipH) {
                    this.api.shapeModifyHFlip(this.page, shape, !shape.isFlippedHorizontal);
                }

                if (t.needFlipV) {
                    this.api.shapeModifyVFlip(this.page, shape, !shape.isFlippedVertical);
                }

                // todo 约束
            }
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }
}