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

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const childs = this.renderContents();
        const borders = this.renderBorders();

        const svgprops = this.renderProps();
        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        const contextSettings = this.style.contextSettings;

        let props: any = { style: { transform: this.transform.toString() } };
        let children = [...fills, ...childs];

        if (contextSettings) {
            props.opacity = contextSettings.opacity;
            props.style['mix-blend-mode'] = contextSettings.blenMode;
        }

        const id = "clippath-artboard-" + objectId(this);
        const cp = clippathR(elh, id, this.getPathStr());

        children = [elh(
            "g",
            { "clip-path": "url(#" + id + ")" },
            [elh(
                "svg",
                svgprops,
                [cp, ...children, ...borders]
            )]
        )];

        if (shadows.length) {
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (inner_url.length) svgprops.filter = inner_url.join(' ');
            children = [...shadows, ...children];
        }

        if (blur.length && this.blur?.type === BlurType.Gaussian) {
            props.filter = `url(#${blurId})`;
            children = [...blur, ...children];
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

    get guides() {
        return (this.m_data as Page).guides;
    }
}