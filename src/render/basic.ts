import { BlurType, Color, SymbolShape } from "../data/classes";
import { EL, elh, PageView, ShapeView } from "../dataview";
import { objectId } from "../basic/objectid";
import { innerShadowId } from "./SVG/effects";
export { findOverrideAndVar } from "../data/utils";

// export function isColorEqual(lhs: Color, rhs: Color): boolean {
//     return lhs.equals(rhs);
// }

export const DefaultColor = Color.DefaultColor;

export function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}

export class IRenderer {

    constructor(protected view: ShapeView) {
    }

    getProps() {
    }

    renderFills() {
    }

    renderBorders() {
    }

    renderShadows(id?: string) {
    }

    renderBlur(id?: string) {
    }

    renderContent() {
    }

    checkAndResetDirty(): boolean {
        return this.view.m_ctx.removeDirty(this.view);
    }

    m_render_version: number = 0;

    render(type?: string) {
        return 0;
    }
}