/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as chai from 'chai'
import { Para, Span, Text } from './text';
import { BasicArray } from '../basic';
import { Color } from '../classes';

const assert = chai.assert;

const metrics = new class implements TextMetrics {
    alphabeticBaseline: number = 0;
    emHeightAscent: number = 0;
    emHeightDescent: number = 0;
    hangingBaseline: number = 0;
    ideographicBaseline: number = 0;
    actualBoundingBoxAscent: number = 0;
    actualBoundingBoxDescent: number = 0;
    actualBoundingBoxLeft: number = 0;
    actualBoundingBoxRight: number = 0;
    fontBoundingBoxAscent: number = 0;
    fontBoundingBoxDescent: number = 0;
    width: number = 10;
}

const newText = (content: string): Text => {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

test("format", () => {
    const text = newText("input text");
    // const attr = new SpanAttrSetter();
    // attr.color = new Color(1, 1, 1, 1);
    const ret = text.formatText(1, 1, "color", new Color(1, 1, 1, 1));
    assert.isTrue(ret && ret.length > 0)
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

test("edit1", () => {
    const text = newText("input text");
    // const attr = new SpanAttrSetter();
    // attr.color = new Color(1, 1, 1, 1);
    text.formatText(1, 1, "color", new Color(1, 1, 1, 1));
    // check
    text.insertText('1', 2);
    // check
    assert.equal(text.paras.length, 1);
    const para = text.paras[0];
    assert.equal(para.spans.length, 3);
    assert.equal(para.spans[0].length, 1);
    assert.equal(para.spans[1].length, 2);
    assert.equal(para.spans[2].length, para.length - 3);

    assert.notExists(para.spans[0].color);
    assert.exists(para.spans[1].color);
    assert.notExists(para.spans[2].color)
})

test("alignParaRange", () => {
    const text = newText("input text");
    const ret = text.alignParaRange(1, 0);
    assert.equal(ret.index, 0);
    assert.equal(ret.len, text.length);

    text.insertText('efg\n', 1);//"iefg\nnput text\n"
    assert.equal(text.paras.length, 2);
    assert.equal(text.paras[0].text, "iefg\n");
    assert.equal(text.paras[1].text, "nput text\n");
    const ret0 = text.alignParaRange(1, 0);
    assert.equal(ret0.index, 0);
    assert.equal(ret0.len, text.paras[0].length);

    const ret1 = text.alignParaRange(1, 5);
    assert.equal(ret1.index, 0);
    assert.equal(ret1.len, text.length);
})