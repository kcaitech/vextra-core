import { CoopRepository } from "../../editor/coop/cooprepo";
import { AsyncApiCaller } from "./handler";
import { Document } from "../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../dataview";

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

    execute() { }

    execute4multi(rotateUnits: RotateUnit[]) {
        try {
            for (let i = 0; i < rotateUnits.length; i++) {
                const unit = rotateUnits[i];
                const shape = adapt2Shape(unit.shape);

                this.api.shapeModifyRotate(this.page, shape, unit.targetRotate);

                this.api.shapeModifyX(this.page, shape, unit.x);
                this.api.shapeModifyY(this.page, shape, unit.y);
            }
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }
}