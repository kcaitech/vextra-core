/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from "../basic/objectid";
import { EL, elh } from "./el";
import { patternRender } from "../render/SVG/effects/pattern"
import { DViewCtx, PropsType } from "./viewctx";
import { CurvePoint, ImageShape, BasicArray } from "../data";
import { RectShapeView } from "./rect";
export class ImageShapeView extends RectShapeView {
    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType, imgPH: string) {
        super(ctx, props);
        this.m_imgPH = imgPH;
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