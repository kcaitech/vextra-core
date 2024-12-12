import { CanvasRenderer } from "./renderer";
import { ArtboradView, ShapeView } from "../../../dataview";
import { ShapeType } from "../../../data";


export const painter: { [key: string]: (view: any, renderer: CanvasRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: CanvasRenderer) => {
    renderer.renderFills();
    renderer.renderContents();
    renderer.renderBorders();
    return ++renderer.m_render_version;
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