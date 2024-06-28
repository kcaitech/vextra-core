import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { Document } from "../../../data/document";
import { adapt2Shape, PageView, ShapeView } from "../../../dataview";
import { afterModifyGroupShapeWH, SizeRecorder } from "../../frame";
import {
    GroupShape,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolShape,
    SymbolUnionShape,
    TextShape
} from "../../../data/shape";
import { Page } from "../../../data/page";
import { SymbolRefShape } from "../../../data/symbolref";
import { fixTextShapeFrameByLayout } from "../../../editor/utils/other";
import { ShapeSize, TextBehaviour } from "../../../data/classes";
import { makeShapeTransform1By2, Transform as Transform2 } from "../../../index";

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

    private afterShapeSizeChange() {
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

    execute(params: {
        shape: ShapeView;
        size: { width: number, height: number },
        transform2: Transform2,
    }[]) {
        try {
            for (let i = 0; i < params.length; i++) {
                const item = params[i];
                const shape = adapt2Shape(item.shape);
                const size = item.size;

                const isgroup = shape instanceof GroupShape;

                const frame = isgroup ? new ShapeSize(shape.size.width, shape.size.height) : undefined;

                const scaleX = size.width / shape.size.width;
                const scaleY = size.height / shape.size.height;

                this.api.shapeModifyWH(this.page, shape, size.width, size.height);
                this.api.shapeModifyTransform(this.page, shape, makeShapeTransform1By2(item.transform2));

                if (isgroup) afterModifyGroupShapeWH(this.api, this.page, shape, scaleX, scaleY, frame!)
            }

            this.afterShapeSizeChange();
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }

    commit() {
        // this.afterShapeSizeChange();
        super.commit();
    }
}