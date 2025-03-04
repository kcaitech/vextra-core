import {
    CurvePoint, FillType, GradientType,
    parsePath,
    PathShape2,
    RadiusMask,
    ShapeFrame,
} from "../data/classes";
import { ShapeView } from "./shape";
import { PathSegment } from "../data/typesdefine";
import { DViewCtx, PropsType } from "./viewctx";
import { EL, elh } from "./el";
import { renderBorders } from "../render";
import { Path } from "@kcdesign/path";
import { RadiusType } from "../data";
import { importCurvePoint, importFill } from "../data/baseimport";
import { GroupShapeView } from "./groupshape";
import { ArtboardView } from "./artboard";
import { border2path } from "../editor/utils/path";
import { exportFill } from "../data/baseexport";
import { render as renderLineBorders } from "../render/line_borders";

/**
 * @deprecated 使用PathShapeView
 */
export class PathShapeView2 extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
    }

    m_pathsegs?: PathSegment[];

    get segments() {
        return this.m_pathsegs || (this.m_data as PathShape2).pathsegs;
    }

    protected _layout(
        parentFrame: ShapeFrame | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        this.m_pathsegs = undefined;
        super._layout(parentFrame, scale);
    }

    protected renderBorders(): EL[] {
        let borders = this.getBorders();
        if (this.mask && borders) {
            borders.strokePaints.map(b => {
                const nb = importFill(exportFill(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            });
        }
        if ((this.segments.length === 1 && !this.segments[0].isClosed) || this.segments.length > 1) {
            return renderLineBorders(elh, this.data.style, borders, this.startMarkerType, this.endMarkerType, this.getPathStr(), this.m_data);
        }
        return renderBorders(elh, borders, this.frame, this.getPathStr(), this.m_data, this.radius);
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
        if (args.includes('mask') || args.includes('isVisible')) (this.parent as GroupShapeView).updateMaskMap();

        if (this.parent && (args.includes('transform') || args.includes('size') || args.includes('isVisible'))) {
            // 执行父级自动布局
            const autoLayout = (this.parent as ArtboardView)?.autoLayout;
            if (autoLayout) {
                this.parent.m_ctx.setReLayout(this.parent);
            }
        } else if (this.parent && args.includes('borders')) {
            const autoLayout = (this.parent as ArtboardView)?.autoLayout;
            if (autoLayout?.bordersTakeSpace) {
                this.parent.m_ctx.setReLayout(this.parent);
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
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        }

        if (args.includes('variables')) {
            this.m_fills = undefined;
            this.m_borders = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        } else if (args.includes('fills')) {
            this.m_fills = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        } else if (args.includes('borders')) {
            this.m_borders = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        } else if (args.includes('fillsMask')) {
            this.m_fills = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
        } else if (args.includes('bordersMask')) {
            this.m_borders = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.createBorderPath();
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

    createBorderPath() {
        const borders = this.getBorders();
        const fills = this.getFills();
        if (!fills.length && borders && borders.strokePaints.some(p => p.isEnabled)) {
            this.m_border_path = border2path(this, borders);
            const bbox = this.m_border_path.bbox();
            this.m_border_path_box = new ShapeFrame(bbox.x, bbox.y, bbox.w, bbox.h);
        }
    }
}