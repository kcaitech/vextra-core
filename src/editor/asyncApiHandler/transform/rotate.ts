import { CoopRepository } from "../../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { Document } from "../../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../../dataview";
import { Transform as Transform2 } from "../../../basic/transform";
import { makeShapeTransform1By2 } from "../../../data";
import { getAutoLayoutShapes, modifyAutoLayout } from "../../../editor/utils/auto_layout";

export type RotateUnit = {
    shape: ShapeView;
    x: number;
    y: number;
    targetRotate: number;
}

export class Rotator extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('sync-rotate')
    }

    execute(params: {
        shape: ShapeView;
        transform2: Transform2,
    }[]) {
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < params.length; i++) {
                const item = params[i];
                shapes.push(item.shape);
                const shape = adapt2Shape(item.shape);
                this.api.shapeModifyTransform(this.page, shape, makeShapeTransform1By2(params[i].transform2));
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, this.api, parent);
            }
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }
}