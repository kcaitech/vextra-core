import { CanvasRenderer } from "./renderer";
import { ShapeView } from "../../../dataview";


export const painter: { [key: string]: (view: any, renderer: CanvasRenderer) => number } = {};

painter['base'] = (view: ShapeView, renderer: CanvasRenderer) => {
    // if (!renderer.checkAndResetDirty()) return renderer.m_render_version;
    const shadowTail = renderer.renderShadows();

    renderer.renderFills();
    renderer.renderContents();
    renderer.renderBorders();
    // 阴影结尾
    shadowTail && shadowTail();

    return ++renderer.m_render_version;
}