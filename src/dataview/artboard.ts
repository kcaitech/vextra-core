import { EL, elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderBorders, renderFills } from "../render";
import { objectId } from "../basic/objectid";
import { render as clippathR } from "../render/clippath"
import { Artboard } from "../data/artboard";
import { BlurType, BorderPosition, CornerRadius, Page, ShapeFrame, ShapeSize } from "../data/classes";
import { ShapeView, updateFrame } from "./shape";


export class ArtboradView extends GroupShapeView {

    get data() {
        return this.m_data as Artboard;
    }

    get cornerRadius(): CornerRadius | undefined {
        return (this.data).cornerRadius;
    }

    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.data);
    }

    protected renderProps(): { [key: string]: string } {
        const shape = this.m_data;
        const props: any = {
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "hidden",
        }
        const contextSettings = shape.style.contextSettings;

        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            props.opacity = contextSettings.opacity;
        }

        const frame = this.frame;
        props.width = frame.width;
        props.height = frame.height;
        props.x = 0;
        props.y = 0;
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
        const isDirty = this.checkAndResetDirty();
        if (!isDirty) {
            return this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        // fill
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const svgprops = this.renderProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        const props: any = {};
        props.opacity = svgprops.opacity;
        delete svgprops.opacity;

        if (!this.isNoTransform()) {
            props.style = { transform: this.transform.toString() };
        } else {
            const transform = this.transform;
            if (transform.translateX !== 0 || transform.translateY !== 0) props.transform = `translate(${transform.translateX},${transform.translateY})`
        }

        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            if (props.style) {
                props.style['mix-blend-mode'] = contextSettings.blenMode;
            } else {
                props.style = {
                    'mix-blend-mode': contextSettings.blenMode
                };
            }
        }

        const id = "clippath-artboard-" + objectId(this);
        if (blur.length && this.blur?.type === BlurType.Gaussian) {
            props.filter = `url(#${blurId})`;
        }

        const content_container = elh("g", { "clip-path": "url(#" + id + ")" }, [...fills, ...childs]);

        if (shadows.length > 0) { // 阴影
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (inner_url.length) svgprops.filter = inner_url.join(' ');
            const cp = clippathR(elh, id, this.getPathStr());
            const body = elh("svg", svgprops, [cp, content_container]);
            this.reset("g", props, [...shadows, ...blur, body, ...borders])
        } else {
            const cp = clippathR(elh, id, this.getPathStr());
            const body = elh("svg", svgprops, [cp, content_container]);
            this.reset("g", props, [...blur, body, ...borders])
        }

        return ++this.m_render_version;
    }

    // get points() {
    //     return (this.m_data as Artboard).points;
    // }
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
        let maxborder = 0;
        borders.forEach(b => {
            if (b.position === BorderPosition.Outer) {
                maxborder = Math.max(b.thickness, maxborder);
            }
            else if (b.position !== BorderPosition.Center) {
                maxborder = Math.max(b.thickness / 2, maxborder);
            }
        })

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - maxborder, this.frame.y - maxborder, this.frame.width + maxborder * 2, this.frame.height + maxborder * 2)) changed = true;

        const childouterbounds = this.m_children.map(c => (c as ShapeView)._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const frame = this.frame;
        const outerbounds = childouterbounds.reduce(reducer, { minx: frame.x, miny: frame.y, maxx: frame.x + frame.width, maxy: frame.y + frame.height });
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

}