

import { DefaultColor, RenderTransform, findOverrideAndVar, fixFrameByConstrain, isColorEqual, isNoTransform, isVisible } from "./basic";
import { TextShape, Path, Color, SymbolShape, SymbolRefShape, ShapeFrame, OverrideType, VariableType, Para, ParaAttr, Text, Span, Variable } from '../data/classes';
import { GraphArray, TextLayout } from "../data/textlayout";
import { gPal } from "../basic/pal";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border";
import { BasicArray } from "../data/basic";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "../data/textutils";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";
import { innerShadowId, render as shadowR } from "./shadow";


function toRGBA(color: Color): string {
    return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
}

function isBlankChar(charCode: number) {
    switch (charCode) {
        case 0x09: // '\t'
        case 0x0a: // '\n'
        case 0x20: // ' '
            return true;
    }
    return false;
}

export function renderText2Path(shapetext: Text, offsetX: number, offsetY: number): Path {
    const getTextPath = gPal.text.getTextPath;
    const { yOffset, paras } = shapetext.getLayout();
    const pc = paras.length;

    const paths = new Path();
    for (let i = 0; i < pc; i++) {
        const lines = paras[i];

        for (let lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; lineIndex++) {
            const line = lines[lineIndex];

            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                const garr = line[garrIdx];
                const span = garr.attr;
                const font = span?.fontName || '';
                const fontSize = span?.fontSize || 0;
                const y = lines.yOffset + line.y + (line.lineHeight - fontSize) / 2 + yOffset; // top

                paths.push(...garr.map((g) => {
                    if (isBlankChar(g.char.charCodeAt(0))) return new Path();
                    const pathstr = getTextPath(font, fontSize, g.char.charCodeAt(0))
                    const path = new Path(pathstr)
                    path.translate(g.x + offsetX + line.x, y + offsetY);
                    return path;
                }))
            }
        }
    }
    return paths;
}

function collectDecorateRange(garr: GraphArray, decorateRange: { start: number, end: number, color: Color }[], preGarrIdx: number, garrIdx: number, color: Color) {
    if (preGarrIdx === garrIdx - 1) {
        const last = decorateRange[decorateRange.length - 1];
        if (isColorEqual(last.color, color)) {
            const endGraph = garr[garr.length - 1];
            const end = endGraph.x + endGraph.cw;
            last.end = end;
            return;
        }
    }
    const startGraph = garr[0];
    const endGraph = garr[garr.length - 1];
    const start = startGraph.x;
    const end = endGraph.x + endGraph.cw;
    decorateRange.push({ start, end, color })
}

function renderDecorateLines(h: Function, x: number, y: number, decorateRange: { start: number, end: number, color: Color }[], childs: any[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + " L" + (x + l.end) + ' ' + y;
        const props: any = {};
        props["fill-opacity"] = 1;
        props.d = d;
        props.fill = 'none';
        props.stroke = toRGBA(l.color);
        props["stroke-width"] = 1;
        childs.push(h('path', props));
    }
}

function renderDecorateRects(h: Function, x: number, y: number, hight: number, decorateRange: { start: number, end: number, color: Color }[], childs: any[]) {
    for (let i = 0, len = decorateRange.length; i < len; i++) {
        const l = decorateRange[i];
        const d = "M" + (x + l.start) + ' ' + y + // lt
            " L" + (x + l.end) + ' ' + y + // rt
            " L" + (x + l.end) + ' ' + (y + hight) + // rb
            " L" + ' ' + (x + l.start) + ' ' + (y + hight) + // lb
            'Z';
        const props: any = {};
        props["fill-opacity"] = 1;
        props.d = d;
        props.fill = toRGBA(l.color);
        props.stroke = 'none';
        props["stroke-width"] = 1;
        childs.push(h('path', props));
    }
}

export function renderTextLayout(h: Function, textlayout: TextLayout) {
    const childs = [];

    const { xOffset, yOffset, paras } = textlayout;
    const pc = paras.length;
    for (let i = 0; i < pc; i++) {
        const lines = paras[i];

        for (let lineIndex = 0, lineCount = lines.length; lineIndex < lineCount; lineIndex++) {
            const line = lines[lineIndex];
            const lineX = line.x + xOffset;
            const lineY = yOffset + lines.yOffset + line.y;
            // 收集下划线、删除线、高亮
            let preUnderlineGIdx = Number.NEGATIVE_INFINITY;
            let preStrikethrouthGIdx = Number.NEGATIVE_INFINITY;
            let preHightlightGIdx = Number.NEGATIVE_INFINITY;

            const underlines: { start: number, end: number, color: Color }[] = [];
            const strikethrouths: { start: number, end: number, color: Color }[] = [];
            const hightlights: { start: number, end: number, color: Color }[] = [];

            const linechilds = [];

            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                const gText = []
                const gX = []
                // const gY = []
                const garr = line[garrIdx];
                for (let gIdx = 0, gCount = garr.length; gIdx < gCount; gIdx++) {
                    const graph = garr[gIdx];
                    if (isBlankChar(graph.char.charCodeAt(0))) { // 两个连续的空格或者首个空格，svg显示有问题
                        continue;
                    }
                    gText.push(graph.char);
                    gX.push(graph.x + lineX);
                }

                const span = garr.attr;
                const fontSize = span?.fontSize || 0;
                const fontName = span?.fontName;
                const y = lineY + (line.lineHeight) / 2;

                const font = "normal " + fontSize + "px " + fontName;
                const style: any = {
                    font,
                    'alignment-baseline': 'central'
                }
                if (span) {
                    if (span.color) style['fill'] = toRGBA(span.color);
                    if (span.bold) style['font-weight'] = "bold";
                    if (span.italic) style['font-style'] = "italic";
                }

                if (gText.length > 0) linechilds.push(h('text', { x: gX.join(' '), y, style }, gText.join('')));

                // 下划线、删除线、高亮
                if (span) {
                    const color = span.color ?? DefaultColor;
                    if (span.underline) {
                        collectDecorateRange(garr, underlines, preUnderlineGIdx, garrIdx, color);
                        preUnderlineGIdx = garrIdx;
                    }
                    if (span.strikethrough) {
                        collectDecorateRange(garr, strikethrouths, preStrikethrouthGIdx, garrIdx, color);
                        preStrikethrouthGIdx = garrIdx;
                    }
                    if (span.highlight) {
                        collectDecorateRange(garr, hightlights, preHightlightGIdx, garrIdx, span.highlight);
                        preHightlightGIdx = garrIdx;
                    }
                }
            }
            // 高亮
            renderDecorateRects(h, lineX, lineY, line.lineHeight, hightlights, childs);

            childs.push(...linechilds);

            // 下划线、删除线
            const strikethroughY = lineY + (line.lineHeight) / 2;
            const underlineY = lineY + line.lineHeight;
            renderDecorateLines(h, lineX, strikethroughY, strikethrouths, childs);
            renderDecorateLines(h, lineX, underlineY, underlines, childs);
        }
    }
    return childs;
}


function createTextByString(stringValue: string, refShape: TextShape) {
    const text = new Text(new BasicArray());
    if (refShape.text.attr) {
        mergeTextAttr(text, refShape.text.attr);
    }
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    mergeParaAttr(para, refShape.text.paras[0]);
    mergeSpanAttr(span, refShape.text.paras[0].spans[0]);
    text.insertText(stringValue, 0);
    return text;
}

export function render(h: Function, shape: TextShape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    consumedVars: { slot: string, vars: Variable[] }[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer, consumedVars)) return;


    const _frame = shape.frame;
    let x = _frame.x;
    let y = _frame.y;
    let width = _frame.width;
    let height = _frame.height;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;
    let frame = _frame;

    const noUpperTrans = isNoTransform(transform);

    let notTrans = noUpperTrans;
    let path0: Path;
    if (!notTrans && transform) {
        x += transform.dx;
        y += transform.dy;
        rotate += transform.rotate;
        hflip = transform.hflip ? !hflip : hflip;
        vflip = transform.vflip ? !vflip : vflip;
        const scaleX = transform.scaleX;
        const scaleY = transform.scaleY;
        const resizingConstraint = shape.resizingConstraint;
        if (!rotate || resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {

            // const saveW = width;
            // const saveH = height;
            if (resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {
                const fixWidth = ResizingConstraints.hasWidth(resizingConstraint);
                const fixHeight = ResizingConstraints.hasHeight(resizingConstraint);

                if (fixWidth && fixHeight) {
                    // 不需要缩放，但要调整位置
                    x *= scaleX;
                    y *= scaleY;
                    // 居中
                    x += (width * (scaleX - 1)) / 2;
                    y += (height * (scaleY - 1)) / 2;
                }

                else if (rotate) {
                    const m = new Matrix();
                    m.rotate(rotate / 360 * 2 * Math.PI);
                    m.scale(scaleX, scaleY);
                    const _newscale = m.computeRef(1, 1);
                    m.scale(1 / scaleX, 1 / scaleY);
                    const newscale = m.inverseRef(_newscale.x, _newscale.y);
                    x *= scaleX;
                    y *= scaleY;

                    if (fixWidth) {
                        x += (width * (newscale.x - 1)) / 2;
                        newscale.x = 1;
                    }
                    else {
                        y += (height * (newscale.y - 1)) / 2;
                        newscale.y = 1;
                    }

                    width *= newscale.x;
                    height *= newscale.y;
                }
                else {
                    const newscaleX = fixWidth ? 1 : scaleX;
                    const newscaleY = fixHeight ? 1 : scaleY;
                    x *= scaleX;
                    y *= scaleY;
                    if (fixWidth) x += (width * (scaleX - 1)) / 2;
                    if (fixHeight) y += (height * (scaleY - 1)) / 2;
                    width *= newscaleX;
                    height *= newscaleY;
                }
            }
            else {
                x *= scaleX;
                y *= scaleY;
                width *= scaleX;
                height *= scaleY;
            }

            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            path0 = shape.getPathOfFrame(frame);

        }

        else {

            // todo
            const m = new Matrix();
            m.rotate(rotate / 360 * 2 * Math.PI);
            m.scale(scaleX, scaleY);
            const _newscale = m.computeRef(1, 1);
            m.scale(1 / scaleX, 1 / scaleY);
            const newscale = m.inverseRef(_newscale.x, _newscale.y);
            x *= scaleX;
            y *= scaleY;
            width *= newscale.x;
            height *= newscale.y;

            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            path0 = shape.getPathOfFrame(frame);

        }

    }
    else {
        path0 = shape.getPath();
        notTrans = shape.isNoTransform()
    }

    const childs = []
    // const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();

    // fill
    childs.push(...fillR(h, shape, frame, path, varsContainer, consumedVars));

    // text
    // todo

    let text = shape.text;
    // todo watch vars
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Text, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Text) {
                // return _var.value;
                if (typeof _var.value === 'string') {
                    text = createTextByString(_var.value, shape);
                }
                else {
                    text = _var.value;
                }
                if (noUpperTrans) text.updateSize(frame.width, frame.height);
                if (consumedVars) consumedVars.push({ slot: OverrideType.Text, vars: _vars })
            }
        }
    }

    const layout = noUpperTrans ? text.getLayout() : text.getLayout2(frame.width, frame.height);
    childs.push(...renderTextLayout(h, layout));
    // border
    childs.push(...borderR(h, shape, frame, path, varsContainer, consumedVars));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`;
    } else {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (hflip) style.transform += "rotateY(180deg) "
        if (vflip) style.transform += "rotateX(180deg) "
        if (rotate) style.transform += "rotate(" + rotate + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    const shadows = shape.style.shadows;
    const ex_props = Object.assign({}, props);
    const shape_id = shape.id.slice(0, 4);
    const shadow = shadowR(h, shape_id, path, shape);
    if (shadow.length) {
        delete props.style;
        delete props.transform;
        const inner_url = innerShadowId(shape_id, shadows);
        if(shadows.length) props.filter = `${inner_url}`;
        const body = h("g", props, childs);
        return h("g", ex_props, [...shadow, body]);
    } else {
        return h("g", props, childs);
    }
}

//
// for test text path
export function render_(h: Function, shape: TextShape, reflush?: number) {
    const path = renderText2Path(shape.text, 0, 0);

    const childs = [h('path', { d: path })]

    const frame = shape.frame;
    const props: any = {}
    if (reflush) props.reflush = reflush;

    if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    else {
        props.transform = `translate(${frame.x},${frame.y})`
    }

    return h('g', props, childs);
}