import { ArtboardView } from "../../artboard";
import { AutoLayout, ShapeFrame, ShapeSize } from "../../../data";
import { updateAutoLayout } from "../../../editor";
import { GroupLayout } from "./group";

export class ArtboardLayout extends GroupLayout {
    constructor(protected view: ArtboardView) {
        super(view);
    }

    private _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
        const view = this.view;
        const childs = view.childs.filter(c => c.isVisible);
        const layout = updateAutoLayout(childs, autoLayout, layoutSize);
        let hidden = 0;
        for (let i = 0, len = view.childs.length; i < len; i++) {
            const cc = view.childs[i];
            const newTransform = cc.transform.clone();
            const index = Math.min(i - hidden, layout.length - 1);
            newTransform.translateX = layout[index].x;
            newTransform.translateY = layout[index].y;
            if (!cc.isVisible) {
                hidden += 1;
            }
            cc.m_ctx.setDirty(cc);
            cc.updateLayoutArgs(newTransform, cc.frame);
            cc.updateFrames();
        }
        const selfframe = new ShapeFrame(0, 0, layoutSize.width, layoutSize.height);
        this.updateLayoutArgs(view.transform, selfframe);
        this.updateFrames();
    }

    _layout(parentFrame: ShapeSize | undefined, scale: { x: number, y: number } | undefined,) {
        const view = this.view;
        if (view.autoLayout) {
            super._layout(parentFrame, scale);
            const childs = view.childs.filter(c => c.isVisible);
            const frame = new ShapeFrame(view.frame.x, view.frame.y, view.frame.width, view.frame.height);
            if (childs.length) this._autoLayout(view.autoLayout, frame);
        } else {
            super._layout(parentFrame, scale);
        }
    }
}