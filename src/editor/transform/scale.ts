import { CoopRepository } from "../../editor/coop/cooprepo";
import { AsyncApiCaller, FrameLike } from "./handler";
import { Document } from "../../data/document";
import { PageView, ShapeView } from "../../dataview";
import { SizeRecorder } from "../../editor/frame";
import { Matrix } from "../../basic/matrix";
import { CtrlElementType } from "editor/controller";


export class Scaler extends AsyncApiCaller {
    private shapes: ShapeView[];
    private recorder: SizeRecorder = new Map();
    private pMap: Map<string, Matrix> = new Map();

    constructor(repo: CoopRepository, document: Document, desc: string, page: PageView, shapes: ShapeView[]) {
        super(repo, document, page, desc);

        this.shapes = shapes;
    }

    excute() { }

    excute4multi(ctrlElementType: CtrlElementType, base: Map<string, FrameLike>, baseBox: FrameLike, scaleX: number, scaleY: number, flipH: boolean, filpV: boolean, round: boolean) {
        try {
            if (ctrlElementType === CtrlElementType.RectRight) {
                this._excute4multi4RectRight(ctrlElementType, base, baseBox, scaleX, scaleY, flipH, filpV, round);
            }
            this.updateView();
        } catch (error) {
            this.rollback();
        }
    }
    _excute4multi4RectRight(ctrlElementType: CtrlElementType, base: Map<string, FrameLike>, baseBox: FrameLike, scaleX: number, scaleY: number, flipH: boolean, filpV: boolean, round: boolean) {

    }
}