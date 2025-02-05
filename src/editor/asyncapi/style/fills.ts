import { AsyncApiCaller } from "../basic/asyncapi";
import { BasicArray, Color, Fill, FillMask, importGradient, Shape, Variable } from "../../../data";
import { ShapeView } from "../../../dataview";
import { shape4fill } from "../../symbol";
import { exportGradient } from "../../../data/baseexport";

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

    /*非连续性指令*/
    modifyStopColorOnce(shapes: ShapeView[], index: number, color: Color, stopAt: number) {
        const targets = this.getTargets(shapes);
        for (const target of targets) {
            const fills = getFills(target);
            const fill = fills[index];
            const gradient = fill.gradient!;
            const gradientCopy = importGradient(exportGradient(gradient));
            gradientCopy.stops[stopAt].color = color;
            gradientCopy.stops.sort((a, b) => a.position > b.position ? 1 : -1);
            gradientCopy.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            this.api.setFillGradient(this.page, target as any, index, gradientCopy);
        }

        function getFills(target: Shape | FillMask | Variable): Fill[] {
            return target instanceof Shape ? target.getFills() : target instanceof FillMask ? target.fills : target.value;
        }
    }
}