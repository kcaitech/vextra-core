import {
    ArtboardView,
    CutoutShapeView,
    EL,
    elh,
    PageView,
    PathShapeView,
    ShapeView,
    SymbolRefView,
    SymbolView,
    TableCellView
} from "../../../dataview";
import { SVGRenderer } from "./renderer";
import { objectId } from "../../../basic/objectid";
import { innerShadowId, renderBorder } from "../effects";
import { BlurType, ScrollBehavior, ShapeType, SymbolShape, Transform } from "../../../data";
import { render as clippathR } from "../effects/clippath";
import { render as renderLineBorders } from "../effects/line_borders";

export const painter: { [key: string]: (view: any, renderer: SVGRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const borders = renderer.renderBorder();
    let childs = renderer.renderContents();

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    let props = renderer.getProps();
    let children = [...fills, ...childs, ...borders];

    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);
    if (blur.length) {
        if (view.blur!.type === BlurType.Gaussian) {
            children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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

    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, {transform: _mask_space.toString()});
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", {style: {transform: __body_transform}}, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', {id}, children);
    //     const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.BoolShape] = (view: ShapeView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const borders = renderer.renderBorder();

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    let props = renderer.getProps();
    let children = [...fills, ...borders];

    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);
    if (blur.length) {
        if (view.blur!.type === BlurType.Gaussian) {
            children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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

    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, {transform: _mask_space.toString()});
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", {style: {transform: __body_transform}}, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', {id}, children);
    //     const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.Path] = (view: PathShapeView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    let borders = view.getBorder();
    let bordersEL: EL[];
    if ((view.segments.length === 1 && !view.segments[0].isClosed) || view.segments.length > 1) {
        bordersEL = renderLineBorders(elh, view.data.style, borders, view.startMarkerType, view.endMarkerType, view.getPathStr(), view.m_data);
    } else bordersEL = renderBorder(elh, borders, view.frame, view.getPathStr(), view.data, view.radius);

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    let props = renderer.getProps();
    let children = [...fills, ...bordersEL];

    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);
    if (blur.length) {
        if (view.blur!.type === BlurType.Gaussian) {
            children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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

    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, {transform: _mask_space.toString()});
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", {style: {transform: __body_transform}}, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', {id}, children);
    //     const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.Page] = (view: ShapeView, renderer: SVGRenderer) => {
    const r = painter['base'](view, renderer);
    if (r) {
        view.eltag = "svg";
    }
    return r;
}

painter[ShapeType.Artboard] = (view: ArtboardView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const childs = renderer.renderContents();
    if (view.autoLayout && view.autoLayout.stackReverseZIndex) childs.reverse();
    const borders = renderer.renderBorder();

    const svgprops = renderer.getProps();
    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    const contextSettings = view.style.contextSettings;

    let props: any = {style: {transform: view.transform.toString()}};

    let children = [...fills, ...childs];

    if (view.innerTransform) {
        const innerEL = childs.map(c => {
            const s = c as ShapeView;
            const trans = new Transform();
            if (s.scrollBehavior === ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME && view.innerTransform) {
                trans.trans(-view.innerTransform.translateX, -view.innerTransform.translateY);
                return elh("g", {transform: trans.toString()}, [c]);
            } else if (s.scrollBehavior === ScrollBehavior.STICKYSCROLLS && view.innerTransform) {
                if (s._p_frame.y + view.innerTransform.translateY < 0) {
                    trans.trans(0, -(s._p_frame.y + view.innerTransform.translateY));
                    return elh("g", {transform: trans.toString()}, [c]);
                }
            }
            return c;
        })
        const child = elh("g", {
            id: view.id,
            transform: view.innerTransform.toString()
        }, innerEL);
        children = [...fills, child];
    }
    if (contextSettings) {
        props.opacity = contextSettings.opacity;
        props.style['mix-blend-mode'] = contextSettings.blenMode;
    }

    if (view.frameMaskDisabled) {
        svgprops['overflow'] = 'visible';
        children = [elh("svg", svgprops, [...fills, ...borders, ...childs])];
    } else {
        // 裁剪属性不能放在filter的外层
        const id = "clip-board-" + objectId(view);
        svgprops['clip-path'] = "url(#" + id + ")";
        const _svg_node = elh("svg", svgprops, [clippathR(elh, id, view.getPathStr()), ...children]);
        children = [_svg_node, ...borders];
    }

    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        props.filter = filter;
        children = [...shadows, ...children];
    }

    const blur = view.blur;
    if (blur) {
        const blurId = `blur_${objectId(view)}`;
        const blurEl = renderer.renderBlur(blurId);
        children = [...blurEl, ...children];
        if (blur.type === BlurType.Background) {
            if (props.opacity) {
                svgprops.opacity = props.opacity;
                delete props.opacity;
            }
            if (props.style?.['mix-blend-mode']) {
                if (svgprops.style) svgprops.style['mix-blend-mode'] = props.style['mix-blend-mode'];
                else svgprops.style = {'mix-blend-mode': props.style['mix-blend-mode']};
                delete props.style['mix-blend-mode'];
            }
            svgprops['filter'] = (svgprops['filter'] ?? '') + `url(#${blurId})`;
        } else {
            props['filter'] = (props['filter'] ?? '') + `url(#${blurId})`;
        }
    }

    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, { transform: _mask_space.toString() });
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", { style: { transform: __body_transform } }, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', { id }, children);
    //     const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.Contact] = (view: CutoutShapeView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;
    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }
    const borders = renderer.renderBorder();
    let props = renderer.getProps();
    let children = [...borders];
    view.reset("g", props, children);
    return ++renderer.m_render_version;
}

painter[ShapeType.SymbolRef] = (view: SymbolRefView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const borders = renderer.renderBorder();
    let childs = renderer.renderContents();

    if (view.uniformScale) childs = [elh('g', {transform: `scale(${view.uniformScale})`}, childs)];

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    let props = renderer.getProps();

    let children;
    if (view.frameMaskDisabled) {
        children = [...fills, ...borders, ...childs];
    } else {
        const id = "clip-symbol-ref-" + objectId(view);
        const clip = clippathR(elh, id, view.getPathStr());
        children = [
            clip,
            elh("g", {"clip-path": "url(#" + id + ")"}, [...fills, ...childs]),
            ...borders
        ];
    }

    // 阴影
    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    // 模糊
    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);
    if (blur.length) {
        if (view.blur!.type === BlurType.Gaussian) {
            children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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
    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, {transform: _mask_space.toString()});
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", {style: {transform: __body_transform}}, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', {id}, children);
    //     const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.Symbol] = (view: SymbolView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    const masked = view.masked;
    if (masked) {
        (view.getPage() as PageView)?.getView(masked.id)?.render();
        view.reset("g");
        return ++renderer.m_render_version;
    }

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const borders = renderer.renderBorder();
    let childs = renderer.renderContents();
    const autoInfo = (view.m_data as SymbolShape).autoLayout;
    if (autoInfo && autoInfo.stackReverseZIndex) childs = childs.reverse();

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);

    let props = renderer.getProps();

    let children;
    if (view.frameMaskDisabled) {
        children = [...fills, ...borders, ...childs];
    } else {
        const id = "clip-symbol-" + objectId(view);
        const clip = clippathR(elh, id, view.getPathStr());
        children = [
            clip,
            elh("g", {"clip-path": "url(#" + id + ")"}, [...fills, ...childs]),
            ...borders
        ];
    }

    // 阴影
    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    // 模糊
    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);
    if (blur.length) {
        if (view.blur!.type === BlurType.Gaussian) {
            children = [...blur, elh('g', {filter: `url(#${blurId})`}, children)];
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

    // // 遮罩
    // const _mask_space = this.renderMask();
    // if (_mask_space) {
    //     Object.assign(props.style, {transform: _mask_space.toString()});
    //     const id = `mask-base-${objectId(this)}`;
    //     const __body_transform = this.transformFromMask;
    //     const __body = elh("g", {style: {transform: __body_transform}}, children);
    //     this.bleach(__body);
    //     children = [__body];
    //     const mask = elh('mask', {id}, children);
    //     const rely = elh('g', {mask: `url(#${id})`}, this.relyLayers);
    //     children = [mask, rely];
    // }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}

painter[ShapeType.TableCell] = (view: TableCellView, renderer: SVGRenderer) => {
    if (!renderer.checkAndResetDirty()) return renderer.m_render_version;

    if (!view.isVisible) {
        view.reset("g");
        return ++renderer.m_render_version;
    }

    const fills = renderer.renderFills();
    const borders = renderer.renderBorder();
    const childs = renderer.renderContents();

    const filterId = `${objectId(view)}`;
    const shadows = renderer.renderShadows(filterId);
    const blurId = `blur_${objectId(view)}`;
    const blur = renderer.renderBlur(blurId);

    let props = renderer.getProps();
    let children = [...fills, ...childs, ...borders];

    // 阴影
    if (shadows.length) {
        let filter: string = '';
        const inner_url = innerShadowId(filterId, view.getShadows());
        filter = `url(#pd_outer-${filterId}) `;
        if (inner_url.length) filter += inner_url.join(' ');
        children = [...shadows, elh("g", {filter}, children)];
    }

    // 模糊
    if (blur.length) {
        let filter: string = '';
        if (view.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
        children = [...blur, elh('g', {filter}, children)];
    }

    view.reset("g", props, children);

    return ++renderer.m_render_version;
}