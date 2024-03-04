import { CoopRepository } from "../../editor/coop/cooprepo";
import { AsyncApiCaller } from "./handler";
import { PageView } from "../../dataview/page";
import { Document } from "../../data/document";
import { ShapeView, adapt2Shape } from "../../dataview";

export type TranslateUnit = {
    shape: ShapeView;
    x: number;
    y: number;
}

export class Transporter extends AsyncApiCaller {
    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page, 'translate')
    }

    excute(translateUnits: TranslateUnit[]) {
        try {
            for (let i = 0; i < translateUnits.length; i++) {
                const unit = translateUnits[i];
                const shape = adapt2Shape(unit.shape);

                this.api.shapeModifyX(this.page, shape, unit.x);
                this.api.shapeModifyY(this.page, shape, unit.y);
            }
            this.updateView();
        } catch (error) {
            this.rollback();
        }
    }
}