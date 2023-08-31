import { ShapeFrame, ShapeType } from "../data/typesdefine";
import { OverrideShape, Shape } from "../data/classes";
import { renderTextLayout } from "./text";

function renderOverrideText(h: Function, refShape: Shape, shape: OverrideShape) {

    const frame = refShape.frame;
    const childs = [];

    const layout = shape.getLayout(refShape);
    if (layout) childs.push(...renderTextLayout(h, layout))

    const props = { transform: `translate(${frame.x},${frame.y})` }

    return h('g', props, childs);
}

function renderOverrideImage(h: Function, refShape: Shape, shape: OverrideShape) {

    const frame = refShape.frame;
    const childs = [];
    const url = shape.peekImage();

    const img = h("image", {
        'xlink:href': url,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'xMidYMid meet'
    });
    childs.push(img);

    const props = { transform: `translate(${frame.x},${frame.y})` }

    return h('g', props, childs);
}

export function render(h: Function, refShape: Shape, shape: OverrideShape): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    switch (refShape.type) {
        case ShapeType.Text:
            return renderOverrideText(h, refShape, shape);
        case ShapeType.Image:
            return renderOverrideImage(h, refShape, shape);
    }

}