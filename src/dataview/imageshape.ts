import { objectId } from "../basic/objectid";
import { EL, elh } from "./el";
import { patternRender } from "../render/SVG/effects/pattern"
import { DViewCtx, PropsType } from "./viewctx";
import { CurvePoint, ImageShape } from "../data/shape";
import { RectShapeView } from "./rect";
import { BasicArray } from "../data/basic";
export class ImageShapeView extends RectShapeView {

    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType, imgPH: string) {
        super(ctx, props);
        this.m_imgPH = imgPH;
        // this.afterInit();
    }

    renderContents(): EL[] {
        const shape = this.m_data as ImageShape;
        const path = this.getPathStr();
        const id = "pattern-clip-" + objectId(this);
        const url = shape.style.fills[0].peekImage(true) ?? this.m_imgPH;
        const pattern = patternRender(elh, shape.size, id, path, url as any);
      
        const _path = elh('path', {
            d: path,
            fill: 'url(#' + id + ')',
            "fill-opacity": "1"
        })
        return [pattern, _path];
    }

    asyncRender() {
        return this.render();
    }

    get points() {
        const pathsegs = (this.m_data as ImageShape).pathsegs
        return pathsegs.length ? pathsegs[0].points : new BasicArray<CurvePoint>();
    }

    get isImageFill() {
        return true;
    }
}