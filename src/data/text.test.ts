import * as chai from 'chai'
import { MeasureFun } from "./textlayout";
import { Para, Span, SpanAttrSetter, Text } from './text';
import { BasicArray } from './basic';
import { Color } from './baseclasses';

const assert = chai.assert;

const metrics = new class implements TextMetrics {
    actualBoundingBoxAscent: number = 0;
    actualBoundingBoxDescent: number = 0;
    actualBoundingBoxLeft: number = 0;
    actualBoundingBoxRight: number = 0;
    fontBoundingBoxAscent: number = 0;
    fontBoundingBoxDescent: number = 0;
    width: number = 10;
}

const measureFun: MeasureFun = (code: number, font: string): TextMetrics => {
    return metrics;
}

const newText = (content: string): Text => {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    text.setMeasureFun(measureFun);
    return text;
}

test("format", () => {
    const text = newText("input text");
    const attr = new SpanAttrSetter();
    attr.color = new Color(1, 1, 1, 1);
    text.formatText(1, 1, { attr });
    // check
    assert.equal(text.paras.length, 1);
    const para = text.paras[0];
    assert.equal(para.spans.length, 3);
    assert.equal(para.spans[0].length, 1);
    assert.equal(para.spans[1].length, 1);
    assert.equal(para.spans[2].length, para.length - 2);

    assert.notExists(para.spans[0].color);
    assert.exists(para.spans[1].color);
    assert.notExists(para.spans[2].color)
})