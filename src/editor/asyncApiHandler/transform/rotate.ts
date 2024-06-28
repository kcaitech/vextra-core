import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import { Document } from "../../../data/document";
import { PageView, ShapeView, adapt2Shape } from "../../../dataview";
import {Transform as Transform2} from "../../../basic/transform";
import {makeShapeTransform1By2} from "../../../data";

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
            for (let i = 0; i < params.length; i++) {
                const item = params[i];
                const shape = adapt2Shape(item.shape);
                this.api.shapeModifyTransform(this.page, shape, makeShapeTransform1By2(params[i].transform2));
            }

            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }

    // execute4multi(rotateUnits: RotateUnit[]) {
    //     try {
    //         for (let i = 0; i < rotateUnits.length; i++) {
    //             const unit = rotateUnits[i];
    //             const shape = adapt2Shape(unit.shape);
    //
    //             this.api.shapeModifyRotate(this.page, shape, unit.targetRotate);
    //
    //             this.api.shapeModifyX(this.page, shape, unit.x);
    //             this.api.shapeModifyY(this.page, shape, unit.y);
    //         }
    //         this.updateView();
    //     } catch (error) {
    //         console.log('error:', error);
    //         this.exception = true;
    //     }
    // }
}