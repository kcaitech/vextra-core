import { EL, elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { innerShadowId, renderBorders, renderFills } from "../render";
import { objectId } from "../basic/objectid";
import { render as clippathR } from "../render/clippath"
import { Artboard } from "../data";
import { BlurType, CornerRadius, Page } from "../data";


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

    protected renderProps(): { [key: string]: string } & { style: any } {
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
        if (this.m_data.name === '容器 2') console.log('_childs_', childs);
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
            const frame = this.frame;
            props.transform = `translate(${frame.x},${frame.y})`;
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

    get guides() {
        return (this.m_data as Page).guides;
    }
}