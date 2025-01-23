import { AsyncApiCaller } from "../basic/asyncapi";
import { Color, FillMask, Shape, Variable } from "../../../data";
import { ShapeView } from "../../../dataview";
import { shape4fill } from "../../symbol";

export class FillsAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-fills-color');
    }

    private m_targets: any;

    private getTargets(shapes: ShapeView[]): (Shape | FillMask | Variable)[] {
        return this.m_targets ?? (this.m_targets = ((shapes: ShapeView[]) => {
            return shapes.map(i => shape4fill(this.api, this.pageView, i));
        })(shapes))
    }

    modifySolidColor(shapes: ShapeView[], index: number, color: Color) {
        try {
            const targets = this.getTargets(shapes);
            for (const t of targets) this.api.setFillColor(this.page, t, index, color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
        this.m_targets = undefined;
    }
}