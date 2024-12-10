import { CutoutShape } from "../data";
import { PathShapeView } from "./pathshape";

export class CutoutShapeView extends PathShapeView {
    get data(): CutoutShape {
        return this.m_data as CutoutShape;
    }

    render(): number {
        // if (!this.checkAndResetDirty()) return this.m_render_version;
        //
        // if (!this.isVisible) {
        //     this.reset("g");
        //     return ++this.m_render_version;
        // }
        //
        // const borders = this.renderBorders();
        //
        // let props = this.renderProps();
        // let children = [...borders];
        //
        //
        // this.reset("g", props, children);
        //
        // return ++this.m_render_version;\
         return this.m_renderer.render(this.type);
    }

}