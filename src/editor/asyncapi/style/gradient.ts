import { CoopRepository, Api } from "../../../coop";
import { Fill, importGradient } from "../../../data";
import { exportGradient } from "../../../data/baseexport";

export class GradientEditor {
    private __repo: CoopRepository;
    private exception: boolean = false;

    constructor(repo: CoopRepository) {
        this.__repo = repo;
    }

    start() {
        return this.__repo.start('async-gradient-editor');
    }

    private m_api: Api | undefined;

    get api(): Api {
        return this.m_api ?? (this.m_api = this.__repo.start('async-gradient-editor'));
    }

    modifyFrom(fills: Fill[], from: { x: number, y: number }) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.from.x = from.x;
                gradientCopy.from.y = from.y;
                this.api.setFillGradient(fill, gradientCopy);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyTo(fills: Fill[], to: { x: number, y: number }) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.to.x = to.x;
                gradientCopy.to.y = to.y;
                this.api.setFillGradient(fill, gradientCopy);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyEllipseLength(fills: Fill[], length: number) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.elipseLength = length;
                this.api.setFillGradient(fill, gradientCopy);
            }
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    modifyStopPosition(fills: Fill[], position: number, stopAt: number) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));

            }
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    updateView() {
        this.__repo.transactCtx.fireNotify();
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
        this.m_api = undefined;
    }
}