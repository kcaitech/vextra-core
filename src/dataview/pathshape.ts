/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */
import { OvalShape, PathShape } from "../data";
import { ShapeView } from "./shape";
import { PathSegment } from "../data/typesdefine";
import { DViewCtx, PropsType } from "./viewctx";
import { PathShapeViewModifyEffect } from "./proxy/effects/path";
import { PathShapeViewCache } from "./proxy/cache/path";
import { PathLayout } from "./proxy/layout/path";

export class PathShapeView extends ShapeView {
    m_pathsegs?: PathSegment[];

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.cache = new PathShapeViewCache(this);
        this.effect = new PathShapeViewModifyEffect(this);
        this.layoutProxy = new PathLayout(this);
    }

    render(): number {
        return this.m_renderer.render();
    }

    get segments() {
        return this.m_pathsegs ?? this.data.pathsegs;
    }

    get data(): PathShape {
        return this.m_data as PathShape;
    }

    get isClosed() {
        return this.data.isClosed;
    }

    get startingAngle() {
        return (this.data as OvalShape).startingAngle;
    }

    get endingAngle() {
        return (this.data as OvalShape).endingAngle;
    }

    get innerRadius() {
        return (this.data as OvalShape).innerRadius;
    }

    get haveEdit() {
        return this.data.haveEdit;
    }
}