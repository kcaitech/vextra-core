import { CanvasRenderer } from "./renderer";
import { ShapeView } from "../../../dataview";


export const painter: { [key: string]: (view: any, renderer: CanvasRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: CanvasRenderer) => {
    // if (!renderer.checkAndResetDirty()) return renderer.m_render_version;
    renderer.renderFills();
    renderer.renderContents();
    renderer.renderBorders();

    return ++renderer.m_render_version;
}