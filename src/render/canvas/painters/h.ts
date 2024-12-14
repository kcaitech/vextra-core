import { CanvasRenderer } from "./renderer";
import { ArtboradView, PageView, ShapeView, SymbolRefView } from "../../../dataview";
import { ShapeType } from "../../../data";

export const painter: { [key: string]: (view: any, renderer: CanvasRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: CanvasRenderer) => {
    const blurEnd = renderer.renderBlur();
    const shadowEnd = renderer.renderShadows();
    renderer.renderFills();
    renderer.renderContents();
    renderer.renderBorders();
    shadowEnd && shadowEnd();
    blurEnd && blurEnd();
    return ++renderer.m_render_version;
}

painter[ShapeType.BoolShape] = (view: ShapeView, renderer) => {
    const blurEnd = renderer.renderBlur();
    const shadowEnd = renderer.renderShadows();
    renderer.renderFills();
    renderer.renderBorders();
    shadowEnd && shadowEnd();
    blurEnd && blurEnd();
    return ++renderer.m_render_version;
}

painter[ShapeType.Page] = (view: PageView, renderer: CanvasRenderer) => {
    const s = Date.now();
    const dpr = view.m_ctx.dpr;
    renderer.ctx.save();
    renderer.ctx.scale(dpr, dpr);
    const ver = painter['base'](view, renderer);
    renderer.ctx.restore();
    const t = Date.now() - s;
    const fps = Math.floor(1000 / t);
    console.log(`单帧绘制用时${t}, fps: ${fps}`);
    return ver;
}

painter[ShapeType.Artboard] = (view: ArtboradView, renderer: CanvasRenderer) => {
    const blurEnd = renderer.renderBlur();
    const shadowEnd = renderer.renderShadows();
    renderer.renderFills();
    const clipEnd = renderer.clip();
    if (clipEnd) { // 裁剪容器中的边框需要在内容的上层
        renderer.renderContents();
        clipEnd();
        renderer.renderBorders();
    } else {
        renderer.renderBorders();
        renderer.renderContents();
    }
    shadowEnd && shadowEnd();
    blurEnd && blurEnd();
    return ++renderer.m_render_version;
}

painter[ShapeType.Contact] = (view: ArtboradView, renderer: CanvasRenderer) => {
    renderer.renderBorders();
    return ++renderer.m_render_version;
}

painter[ShapeType.Symbol] = painter[ShapeType.Artboard];

painter[ShapeType.SymbolRef] = (view: SymbolRefView, renderer: CanvasRenderer) => {
    const blurEnd = renderer.renderBlur();
    const shadowEnd = renderer.renderShadows();
    renderer.renderFills();
    const clipEnd = renderer.clip();
    if (clipEnd) { // 裁剪容器中的边框需要在内容的上层
        renderContents();
        clipEnd();
        renderer.renderBorders();
    } else {
        renderer.renderBorders();
        renderContents();
    }
    shadowEnd && shadowEnd();
    blurEnd && blurEnd();
    return ++renderer.m_render_version;

    function renderContents() {
        const childs = view.m_children;
        if (!childs.length) return;
        renderer.ctx.save();
        renderer.ctx.transform(...renderer.props.transform);
        if (view.uniformScale) renderer.ctx.scale(view.uniformScale, view.uniformScale);
        childs.forEach((c) => c.render());
        renderer.ctx.restore();
    }
}