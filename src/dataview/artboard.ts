import { EL, elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderBorders, renderFills } from "../render";
import { objectId } from "../basic/objectid";
import { render as clippathR } from "../render/clippath"
import { AutoLayout, BorderPosition, CornerRadius, Page, ScrollBehavior, ShadowPosition, ShapeFrame, Transform, Artboard, BlurType } from "../data";
import { ShapeView, updateFrame } from "./shape";
import { PageView } from "./page";


export class ArtboradView extends GroupShapeView {

    m_inner_transform: Transform | undefined;
    get innerTransform(): Transform | undefined {
        return this.m_inner_transform;
    }

    initInnerTransform(transform: Transform) {
        this.m_inner_transform = transform;
        this.m_ctx.setDirty(this);
    }
    innerScrollOffset(x: number, y: number) {
        if (!this.m_inner_transform) this.m_inner_transform = new Transform();
        this.m_inner_transform.trans(x, y);
        this.m_ctx.setDirty(this);
    }

    get data() {
        return this.m_data as Artboard;
    }

    get cornerRadius(): CornerRadius | undefined {
        return (this.data).cornerRadius;
    }

    get autoLayout(): AutoLayout | undefined {
        return this.data.autoLayout;
    }

    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data);
    }

    protected renderProps(): { [key: string]: string } & { style: any } {
        const props: any = {
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden",
        }

        const frame = this.frame;
        props.width = frame.width;
        props.height = frame.height;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
    }

    protected renderStaticProps(): { [key: string]: string } {
        const props: any = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden"
        }
        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            props.style = {
                'mix-blend-mode': contextSettings.blenMode
            };
        }
        const frame = this.frame;

        if (frame.width > frame.height) {
            props.transform = `translate(0, ${(frame.width - frame.height) / 2})`;
        } else {
            props.transform = `translate(${(frame.height - frame.width) / 2}, 0)`;
        }

        props.width = frame.width;
        props.height = frame.height;
        props.x = 0;
        props.y = 0;
        props.viewBox = `0 0 ${frame.width} ${frame.height}`;

        return props;
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

        const fills = this.renderFills();
        const childs = this.renderContents();
        if (this.autoLayout && this.autoLayout.stackReverseZIndex) childs.reverse();
        const borders = this.renderBorders();

        const svgprops = this.renderProps();
        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        const contextSettings = this.style.contextSettings;

        let props: any = { style: { transform: this.transform.toString() } };

        let children = [...fills, ...childs];

        if (this.innerTransform) {
            const innerEL = childs.map(c => {
                const s = c as ShapeView;
                const trans = new Transform();
                if (s.scrollBehavior === ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME && this.innerTransform) {
                    trans.trans(-this.innerTransform.translateX, -this.innerTransform.translateY);
                    return elh("g", { transform: trans.toString() }, [c]);
                } else if (s.scrollBehavior === ScrollBehavior.STICKYSCROLLS && this.innerTransform) {
                    if (s._p_frame.y + this.innerTransform.translateY < 0) {
                        trans.trans(0, -(s._p_frame.y + this.innerTransform.translateY));
                        return elh("g", { transform: trans.toString() }, [c]);
                    }
                }
                return c;
            })
            const child = elh("g", {
                id: this.id,
                transform: this.innerTransform.toString()
            }, innerEL);
            children = [...fills, child];
        }
        if (contextSettings) {
            props.opacity = contextSettings.opacity;
            props.style['mix-blend-mode'] = contextSettings.blenMode;
        }

        if (this.frameMaskDisabled) {
            svgprops['overflow'] = 'visible';
            children = [elh("svg", svgprops, [...fills, ...borders, ...childs])];
        } else {
            // 裁剪属性不能放在filter的外层
            const id = "clip-board-" + objectId(this);
            svgprops['clip-path'] = "url(#" + id + ")";
            const _svg_node = elh("svg", svgprops, [clippathR(elh, id, this.getPathStr()), ...children,...borders]);
            children = [_svg_node];
        }

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            props.filter = filter;
            children = [...shadows, ...children];
        }

        const blur = this.blur;
        if (blur) {
            const blurId = `blur_${objectId(this)}`;
            const blurEl = this.renderBlur(blurId);
            children = [...blurEl, ...children];
            if (blur.type === BlurType.Background) {
                if (props.opacity) {
                    svgprops.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.['mix-blend-mode']) {
                    if (svgprops.style) svgprops.style['mix-blend-mode'] = props.style['mix-blend-mode'];
                    else svgprops.style = { 'mix-blend-mode': props.style['mix-blend-mode'] };
                    delete props.style['mix-blend-mode'];
                }
                svgprops['filter'] = svgprops['filter'] ?? '' + `url(#${blurId})`;
            } else {
                props['filter'] = props['filter'] ?? '' + `url(#${blurId})`;
            }
        }

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

    get guides() {
        return (this.m_data as Page).guides;
    }

    updateFrames() {

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const borders = this.getBorders();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        borders.forEach(b => {
            if (b.isEnabled) {
                if (b.position === BorderPosition.Outer) {
                    maxtopborder = Math.max(b.sideSetting.thicknessTop, maxtopborder);
                    maxleftborder = Math.max(b.sideSetting.thicknessLeft, maxleftborder);
                    maxrightborder = Math.max(b.sideSetting.thicknessRight, maxrightborder);
                    maxbottomborder = Math.max(b.sideSetting.thicknessBottom, maxbottomborder);
                } else if (b.position === BorderPosition.Center) {
                    maxtopborder = Math.max(b.sideSetting.thicknessTop / 2, maxtopborder);
                    maxleftborder = Math.max(b.sideSetting.thicknessLeft / 2, maxleftborder);
                    maxrightborder = Math.max(b.sideSetting.thicknessRight / 2, maxrightborder);
                    maxbottomborder = Math.max(b.sideSetting.thicknessBottom / 2, maxbottomborder);
                }
            }
        })

        // 阴影
        const shadows = this.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

        const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const _f = this.m_visibleFrame;
        const outerbounds = childouterbounds.reduce(reducer, { minx: _f.x, miny: _f.y, maxx: _f.x + _f.width, maxy: _f.y + _f.height });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        if (changed) {
            this.m_ctx.addNotifyLayout(this);
        }

        return changed;
    }

    get frameMaskDisabled() {
        return (this.m_data as Artboard).frameMaskDisabled;
    }
}