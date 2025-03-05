import {
    CurvePoint,
    FillType, GradientType,
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
import { EL, elh } from "./el";
import { innerShadowId, renderBorders } from "../render";
import { objectId } from "../basic/objectid";
import { BlurType, PathSegment } from "../data/typesdefine";
import { render as renderLineBorders } from "../render/line_borders"
import { PageView } from "./page";
import { importCurvePoint, importFill } from "../data/baseimport";
import { exportFill } from "../data/baseexport";
import { GroupShapeView } from "./groupshape";
import { border2path } from "../editor/utils/path";
import { ArtboardView } from "./artboard";
import { Path } from "@kcdesign/path";

export class PathShapeView extends ShapeView {
    m_pathsegs?: PathSegment[];

    protected _layout(
        parentFrame: ShapeFrame | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        this.m_pathsegs = undefined;
        super._layout(parentFrame, scale);
        this.createBorderPath();
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

    get segments() {
        return this.m_pathsegs || (this.m_data as PathShape2).pathsegs;
    }

    get data(): PathShape {
        return this.m_data as PathShape;
    }

    get isClosed() {
        return this.data.isClosed;
    }

    get relyLayers() {
        if (!this.m_transform_from_mask) this.m_transform_from_mask = this.renderMask();
        if (!this.m_transform_from_mask) return;

        const group = this.m_mask_group || [];
        if (group.length < 2) return;
        const inverse = (this.m_transform_from_mask).inverse;
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            if (!__s.isVisible) continue;
            const dom = __s.dom;
            (dom.elattr as any)['style'] = { 'transform': (__s.transform.clone().multi(inverse)).toString() };
            els.push(dom);
        }

        return els;
    }

    get transformFromMask() {
        this.m_transform_from_mask = this.renderMask();
        if (!this.m_transform_from_mask) return;

        const space = (this.m_transform_from_mask).getInverse();

        return (this.transform.clone().multi(space)).toString()
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

    renderMask() {
        if (!this.mask) return;
        const parent = this.parent;
        if (!parent) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === this.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [this];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return new Transform(1, 0, x, 0, 1, y);
    }

    bleach(el: EL) {  // 漂白，mask元素内，白色的像素显示，黑色的像素隐藏
        if (el.elattr.fill && el.elattr.fill !== 'none' && !(el.elattr.fill as string).startsWith('url(#gradient')) {
            el.elattr.fill = '#FFF';
        }
        if (el.elattr.stroke && el.elattr.stroke !== 'none' && !(el.elattr.stroke as string).startsWith('url(#gradient')) {
            el.elattr.stroke = '#FFF';
        }
        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    renderStatic() {
        const fills = this.renderFills() || []; // cache
        const childs = this.renderContents(); // VDomArray
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderStaticProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (blur.length && inner_url.length) {
                    props.filter = `${inner_url.join(' ')}`
                    if (this.blur?.type === BlurType.Gaussian) props.filter += ` url(#${blurId})`
                } else {
                    if (inner_url.length) props.filter = inner_url.join(' ');
                    if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
                }
            } else {
                props.filter = `url(#pd_outer-${filterId}) `;
                if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter += `url(#${blurId}) `;
                if (inner_url.length) props.filter += inner_url.join(' ');
            }
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            return elh("g", ex_props, [...shadows, ...blur, body]);
        } else {
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
            return elh("g", props, [...blur, ...fills, ...childs, ...borders]);
        }
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

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView)?.getView(masked.id)?.render();
            this.reset("g");
            return ++this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills() || [];
        const borders = this.renderBorders() || [];

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        let props = this.renderProps();
        let children = [...fills, ...borders];

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (inner_url.length) filter = `${inner_url.join(' ')}`
            } else {
                filter = `url(#pd_outer-${filterId}) `;
                if (inner_url.length) filter += inner_url.join(' ');
            }
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (this.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', { filter: `url(#${blurId})` }, children)];
            } else {
                const __props: any = {};
                if (props.opacity) {
                    __props.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.["mix-blend-mode"]) {
                    __props["mix-blend-mode"] = props.style["mix-blend-mode"];
                    delete props.style["mix-blend-mode"];
                }
                children = [...blur, elh('g', __props, children)];
            }
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }
}