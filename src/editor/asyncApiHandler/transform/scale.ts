import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { Document } from "../../../data/document";
import { adapt2Shape, PageView, ShapeView } from "../../../dataview";
import { afterModifyGroupShapeWH, SizeRecorder } from "../../frame";
import { GroupShape, Shape, ShapeFrame, SymbolShape, SymbolUnionShape } from "../../../data/shape";
import { Api } from "../../coop/recordapi";
import { Page } from "../../../data/page";
import { SymbolRefShape } from "../../../data/symbolref";

export type ScaleUnit = {
    shape: ShapeView;

    targetXY: { x: number, y: number };
    targetWidth: number;
    targetHeight: number;
    targetRotation: number;

    baseWidth: number;
    baseHeight: number;
    needFlipH: boolean;
    needFlipV: boolean;
}

export class Scaler extends AsyncApiCaller {
    private recorder: SizeRecorder = new Map();
    private needUpdateCustomSizeStatus: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('sync-scale')
    }

    private afterShapeSizeChange(shape: Shape) {
        if (!this.needUpdateCustomSizeStatus.size) {
            return;
        }
        const document = this.__document;
        const api = this.api;
        const page = this.page;
        this.needUpdateCustomSizeStatus.forEach(shape => {
            if (shape instanceof SymbolShape && !(shape instanceof SymbolUnionShape)) {
                const symId = shape.id;
                const refs = document.symbolsMgr.getRefs(symId);
                if (!refs) return;
                for (let [k, v] of refs) {
                    if (v.isCustomSize) continue;
                    const page = v.getPage();
                    if (!page) throw new Error();
                    api.shapeModifyWH(page as Page, v, shape.frame.width, shape.frame.height);
                }
            } else if (shape instanceof SymbolRefShape) {
                api.shapeModifyIsCustomSize(page, shape, true);
            }
        })
    }

    execute(transformUnits: ScaleUnit[]) {
        try {
            const api = this.api;
            const page = this.page;


            for (let i = 0; i < transformUnits.length; i++) {
                const t = transformUnits[i];
                const shape = adapt2Shape(t.shape);

                const x = t.targetXY.x;
                const y = t.targetXY.y;
                const width = t.targetWidth;
                const height = t.targetHeight;

                api.shapeModifyX(page, shape, x);
                api.shapeModifyY(page, shape, y);

                const saveWidth = shape.frame.width;
                const saveHeight = shape.frame.height;

                api.shapeModifyWH(page, shape, width, height);

                if (t.needFlipH) {
                    api.shapeModifyHFlip(page, shape, !shape.isFlippedHorizontal);
                }

                if (t.needFlipV) {
                    api.shapeModifyVFlip(page, shape, !shape.isFlippedVertical);
                }

                if (t.targetRotation !== shape.rotation) {
                    api.shapeModifyRotate(page, shape, t.targetRotation);
                }

                if (shape instanceof GroupShape) {
                    const scaleX = shape.frame.width / saveWidth;
                    const scaleY = shape.frame.height / saveHeight;
                    afterModifyGroupShapeWH(api, page, shape, scaleX, scaleY, new ShapeFrame(0, 0, saveWidth, saveHeight), this.recorder);
                }

            }
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }
}