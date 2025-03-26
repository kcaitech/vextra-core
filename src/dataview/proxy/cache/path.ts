import { Path } from "@kcdesign/path";
import { CurvePoint, parsePath, RadiusMask, RadiusType, ShapeFrame } from "../../../data";
import { PathShapeView } from "../../pathshape";
import { importCurvePoint } from "../../../data/baseimport";
import { stroke } from "../../../render/stroke";
import { ViewCache } from "./view";

export class PathShapeViewCache extends ViewCache {
    // cache
    private m_path: Path | undefined;
    private m_pathstr: string | undefined;
    private m_is_border_shape: boolean | undefined = undefined;
    private m_border_path: Path | undefined;
    private m_border_path_box: ShapeFrame | undefined = undefined;

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
            points[0].radius = radius[0];
            points[1].radius = radius[1] ?? radius[0];
            points[2].radius = radius[2] ?? radius[0];
            points[3].radius = radius[3] ?? radius[0];
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

    get pathStr() {
        if (this.m_pathstr) return this.m_pathstr;
        this.m_pathstr = this.path.toString();
        return this.m_pathstr;
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
