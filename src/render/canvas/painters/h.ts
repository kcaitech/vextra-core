import { CanvasRenderer } from "./renderer";
import { ArtboradView, PageView, ShapeView, SymbolRefView } from "../../../dataview";
import { ShapeType } from "../../../data";


export const painter: { [key: string]: (view: any, renderer: CanvasRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: CanvasRenderer) => {
    renderer.renderFills();
    renderer.renderContents();
    renderer.renderBorders();
    return ++renderer.m_render_version;
}

painter[ShapeType.BoolShape] = (view: ShapeView, renderer) => {
    renderer.renderFills();
    renderer.renderBorders();
    return ++renderer.m_render_version;
}

painter[ShapeType.Page] = (view: PageView, renderer: CanvasRenderer) => {
    const dpr = window.devicePixelRatio;
    renderer.ctx.save();
    renderer.ctx.scale(dpr, dpr);
    const ver = painter['base'](view, renderer);
    renderer.ctx.restore();
    return ver;
}

painter[ShapeType.Artboard] = (view: ArtboradView, renderer: CanvasRenderer) => {
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

    return ++renderer.m_render_version;
}

painter[ShapeType.Contact] = (view: ArtboradView, renderer: CanvasRenderer) => {
    renderer.renderBorders();
    return ++renderer.m_render_version;
}

painter[ShapeType.Symbol] = painter[ShapeType.Artboard];

painter[ShapeType.SymbolRef] = (view: SymbolRefView, renderer: CanvasRenderer) => {
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