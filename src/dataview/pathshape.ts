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
    OvalShape, parsePath,
    PathShape,
    PathShape2,
    RadiusMask,
    RadiusType,
    ShapeFrame,
    ShapeType,
    Transform
} from "../data";
import { ShapeView } from "./shape";
import { PathSegment } from "../data/typesdefine";
import { importCurvePoint } from "../data/baseimport";
import { GroupShapeView } from "./groupshape";
import { ArtboardView } from "./artboard";
import { Path } from "@kcdesign/path";
import { border2path } from "./border2path";

export class PathShapeView extends ShapeView {
    m_pathsegs?: PathSegment[];

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
                const borders = this.getBorder();
                return border2path(this, borders);
            } else {
                return new Path();
            }
        })());
    }

    get segments() {
        return this.m_pathsegs || (this.m_data as PathShape2).pathsegs;
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

    get radius(): number[] {
        let _radius: number[] = [];
        if (this.radiusMask) {
            const mgr = this.style.getStylesMgr()!;
            const mask = mgr.getSync(this.radiusMask) as RadiusMask;
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            let points: CurvePoint[] = [];
            this.segments.forEach(i => points = points.slice(0).concat(i.points as CurvePoint[]));
            const firstR = points[0]?.radius ?? 0;
            for (const p of points) {
                const radius = p.radius ?? 0;
                if (radius !== firstR && this.radiusType !== RadiusType.Rect) return _radius = [-1];

                if (this.radiusType === RadiusType.Rect) {
                    _radius.push(radius);
                } else {
                    _radius = [firstR ?? (this.fixedRadius ?? 0)];
                }
            }
            this.unwatchRadiusMask();
        }
        return _radius

    }

    onDataChange(...args: any[]): void {
        this.m_border_path = undefined;
        this.m_border_path_box = undefined;
        this.m_is_border_shape = undefined;
        if (args.includes('mask') || args.includes('isVisible')) (this.parent as GroupShapeView).updateMaskMap();

        if (this.parent && (args.includes('transform') || args.includes('size') || args.includes('isVisible') || args.includes('autoLayout'))) {
            // 执行父级自动布局
            let p = this.parent as ArtboardView;
            while (p && p.autoLayout) {
                p.m_ctx.setReLayout(p);
                p = p.parent as ArtboardView;
            }
        } else if (this.parent && args.includes('borders')) {
            let p = this.parent as ArtboardView;
            while (p && p.autoLayout) {
                if (p.autoLayout?.bordersTakeSpace) {
                    p.m_ctx.setReLayout(p);
                }
                p = p.parent as ArtboardView;
            }
        }
        if (args.includes('points')
            || args.includes('pathsegs')
            || args.includes('isClosed')
            || (this.m_fixedRadius || 0) !== ((this.m_data as any).fixedRadius || 0)
            || args.includes('cornerRadius')
            || args.includes('imageRef')
            || args.includes('radiusMask')
            || args.includes('variables')
        ) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }

        if (args.includes('variables')) {
            this.m_fills = undefined;
            this.m_border = undefined;
        } else if (args.includes('fills')) {
            this.m_fills = undefined;
        } else if (args.includes('borders')) {
            this.m_border = undefined;
        } else if (args.includes('fillsMask')) {
            this.m_fills = undefined;
        } else if (args.includes('bordersMask')) {
            this.m_border = undefined;
        }

        const masked = this.masked;
        if (masked) masked.notify('rerender-mask');
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