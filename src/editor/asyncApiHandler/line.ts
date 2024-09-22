import { AsyncApiCaller } from "./AsyncApiCaller";
import { CoopRepository } from "../../coop/cooprepo";
import { Document } from "../../data/document";
import { adapt2Shape, PageView, PathShapeView } from "../../dataview";
import { PathShape } from "../../data/shape";
import { update_frame_by_points } from "../utils/path";

export class LineHandleApiCaller extends AsyncApiCaller {
    readonly line: PathShape;

    constructor(repo: CoopRepository, document: Document, page: PageView, lineView: PathShapeView) {
        super(repo, document, page)

        this.line = adapt2Shape(lineView) as PathShape;
    }

    start() {
        return this.__repo.start('path-modify');
    }

    execute(start: { x: number, y: number }, end: { x: number, y: number }) {
        try {
            const shape = this.line;

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
            update_frame_by_points(this.api, this.page, this.line, true);
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}