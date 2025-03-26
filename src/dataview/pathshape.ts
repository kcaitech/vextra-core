/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */
import {
    CurvePoint,
    OvalShape,
    PathShape,
    RadiusType,
    ShapeFrame,
    ShapeType,
    parsePath
} from "../data";
import { ShapeView } from "./shape";
import { PathSegment } from "../data/typesdefine";
import { importCurvePoint } from "../data/baseimport";
import { Path } from "@kcdesign/path";
import { stroke } from "../render/stroke";
import { DViewCtx, PropsType } from "./viewctx";
import { PathShapeViewCache } from "./cache/cacheProxy";
import { PathShapeViewModifyEffect } from "./cache/effects/path";

export class PathShapeView extends ShapeView {
    m_pathsegs?: PathSegment[];

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.cache = new PathShapeViewCache(this);
        this.effect = new PathShapeViewModifyEffect(this);
    }
    protected _layout(
        parentFrame: ShapeFrame | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        this.m_pathsegs = undefined;
        super._layout(parentFrame, scale);
    }

    render(): number {
        return this.m_renderer.render(ShapeType.Path);
    }

    get borderPath(): Path {
        return this.m_border_path ?? (this.m_border_path = (() => {
            if (this.isBorderShape) {
                return stroke(this);
            } else {
                return new Path();
            }
        })());
    }

    get segments() {
        return this.m_pathsegs || this.data.pathsegs;
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

    getPathOfSize() {
        const frame = this.frame;
        const width = frame.width;
        const height = frame.height;

        let path: Path;
        if (this.radiusType === RadiusType.Rect) {
            const radius = this.radius;
            const points = this.segments[0].points.map(point => importCurvePoint(point));
            points[0].radius = radius[0];
            points[1].radius = radius[1] ?? radius[0];
            points[2].radius = radius[2] ?? radius[0];
            points[3].radius = radius[3] ?? radius[0];
            path = parsePath(points, true, width, height);
        } else {
            path = new Path();
            const fixed = this.radiusMask ? this.radius[0] : undefined;
            for (const segment of this.segments) {
                path.addPath(parsePath(segment.points as CurvePoint[], segment.isClosed, width, height, fixed));
            }
        }
        return path;
    }
}