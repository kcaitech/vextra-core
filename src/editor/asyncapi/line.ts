import { AsyncApiCaller } from "./basic/asyncapi";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, PathShapeView } from "../../dataview";
import { PathShape } from "../../data/shape";
import { update_frame_by_points } from "../utils/path";
import { getAutoLayoutShapes, modifyAutoLayout } from "../utils/auto_layout";

export class LineHandleApiCaller extends AsyncApiCaller {
    readonly line: PathShapeView;

    constructor(repo: CoopRepository, document: Document, page: PageView, lineView: PathShapeView) {
        super(repo, document, page)

        this.line = lineView;
    }

    start() {
        return this.__repo.start('path-modify');
    }

    execute(start: { x: number, y: number }, end: { x: number, y: number }) {
        try {
            const shape = adapt2Shape(this.line) as PathShape;

            const points = shape?.pathsegs[0]?.points;

            const __start = points[0];
            const __end = points[1];

            const api = this.api;
            const page = this.page;

            if ((__start.x !== start.x) || (__start.y !== start.y)) {
                api.shapeModifyCurvPoint(page, shape, 0, start, 0);
            }
            if ((__end.x !== end.x) || (__end.y !== end.y)) {
                api.shapeModifyCurvPoint(page, shape, 1, end, 0);
            }

            this.updateView();
        } catch (e) {
            console.log('LineHandleApiCaller.execute:', e);
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            update_frame_by_points(this.api, this.page, adapt2Shape(this.line), true);
            const parents = getAutoLayoutShapes([this.line]);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, this.api, parent);
            }
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}