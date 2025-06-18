/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Path } from "@kcaitech/path";
import { CurvePoint, parsePath, RadiusMask, RadiusType, ShapeFrame } from "../../../data";
import { PathShapeView } from "../../pathshape";
import { importCurvePoint } from "../../../data/baseimport";
import { stroke } from "../../../render/stroke";
import { ViewCache } from "./view";

export class PathShapeViewCache extends ViewCache {
    // cache
    protected m_is_border_shape: boolean | undefined = undefined;
    protected m_border_path: Path | undefined;
    protected m_border_path_box: ShapeFrame | undefined = undefined;

    constructor(protected view: PathShapeView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[] = [];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask;
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            let points: CurvePoint[] = [];
            this.view.segments.forEach(i => points = points.slice(0).concat(i.points as CurvePoint[]));
            const firstR = points[0]?.radius ?? 0;
            for (const p of points) {
                const radius = p.radius ?? 0;
                if (radius !== firstR && this.view.radiusType !== RadiusType.Rect) return _radius = [-1];
                if (this.view.radiusType === RadiusType.Rect) {
                    _radius.push(radius);
                } else {
                    _radius = [firstR ?? (this.view.fixedRadius ?? 0)];
                }
            }
            this.unwatchRadiusMask();
        }
        return _radius
    }

    protected getPathOfSize() {
        const frame = this.view.frame;
        const width = frame.width;
        const height = frame.height;

        let path: Path;
        if (this.view.radiusType === RadiusType.Rect) {
            const radius = this.radius;
            const points = this.view.segments[0].points.map(point => importCurvePoint(point));
            points.forEach((point, index) => {
                point.radius = radius[index] ?? radius[0];
            });
            path = parsePath(points, true, width, height);
        } else {
            path = new Path();
            const fixed = this.view.radiusMask ? this.radius[0] : undefined;
            for (const segment of this.view.segments) {
                path.addPath(parsePath(segment.points as CurvePoint[], segment.isClosed, width, height, fixed));
            }
        }
        return path;
    }

    get fixedRadius() {
        return this.view.data.fixedRadius;
    }

    get path() {
        if (this.m_path) return this.m_path;
        this.m_path = this.getPathOfSize();
        const frame = this.view.frame;
        if (frame.x || frame.y) this.m_path.translate(frame.x, frame.y);
        this.m_path.freeze();
        return this.m_path;
    }

    get borderPath(): Path {
        return this.m_border_path ?? (this.m_border_path = (() => {
            if (this.isBorderShape) {
                return stroke(this.view);
            } else {
                return new Path();
            }
        })());
    }

    get borderPathBox() {
        return this.m_border_path_box ?? (this.m_border_path_box = (() => {
            const bbox = this.borderPath.bbox();
            return new ShapeFrame(bbox.x, bbox.y, bbox.w, bbox.h);
        })());
    }

    get isBorderShape() {
        return this.m_is_border_shape ?? (this.m_is_border_shape = (() => {
            const borders = this.border;
            return !this.fills.length && borders && borders.strokePaints.some(p => p.isEnabled);
        })());
    }
}
