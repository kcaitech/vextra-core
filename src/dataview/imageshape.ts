import { objectId } from "../basic/objectid";
import { EL, elh } from "./el";
import {render as clippathR} from "../render/clippath"
import { DViewCtx, PropsType } from "./viewctx";
import { CurvePoint, ImageShape } from "../data/shape";
import { RectShapeView } from "./rect";
import { BasicArray } from "../data/basic";
export class ImageShapeView extends RectShapeView {

    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType, imgPH: string) {
        super(ctx, props, false);
        this.m_imgPH = imgPH;
        this.afterInit();
    }

    protected isNoSupportDiamondScale(): boolean {
        return this.m_data.isNoSupportDiamondScale;
    }

    renderContents(): EL[] {
        const shape = this.m_data as ImageShape;
        const path = this.getPathStr();
        const frame = this.frame;
        const id = "clippath-image-" + objectId(this);
        const cp = clippathR(elh, id, path);
        const url = shape.peekImage(true);
        const img = elh("image", {
            'xlink:href': url ?? this.m_imgPH,
            width: frame.width,
            height: frame.height,
            x: 0,
            y: 0,
            'preserveAspectRatio': 'none meet',
            "clip-path": "url(#" + id + ")"
        });
        return [cp, img];
    }

    get points() {
        const pathsegs = (this.m_data as ImageShape).pathsegs
        return pathsegs.length ? pathsegs[0].points : new BasicArray<CurvePoint>();
    }
}