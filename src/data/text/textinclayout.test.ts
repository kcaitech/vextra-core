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
import { gPal } from '../../basic/pal'
import { Para, Span, Text } from './text';
import { BasicArray } from '../basic';

const m: TextMetrics = {
    actualBoundingBoxAscent: 1,
    actualBoundingBoxDescent: 1,
    actualBoundingBoxLeft: 1,
    actualBoundingBoxRight: 1,
    fontBoundingBoxAscent: 1,
    fontBoundingBoxDescent: 1,
    width: 1,
    alphabeticBaseline: 0,
    emHeightAscent: 0,
    emHeightDescent: 0,
    hangingBaseline: 0,
    ideographicBaseline: 0
} as TextMetrics;

const textMeasure = (code: string, font: string): TextMetrics => {
    return m;
}

const newText = (content: string): Text => {
    const text = new Text(new BasicArray());
    const para = new Para(content + '\n', new BasicArray());
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    return text;
}

test("inc layout insert", () => {
    // init pal
    gPal.text.textMeasure = textMeasure;
    const text: Text = newText("abc");
    // let layout = text.getLayout(100, 100, "owner", undefined);

    text.insertText("\n", 1);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a\nbc\n");

    text.insertText("12345", 2);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a\n12345bc\n");
    text.insertText("\n", 4);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a\n12\n345bc\n");

    text.deleteText(6, 2);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a\n12\n3bc\n");

    text.insertText("\n", 6);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a\n12\n3\nbc\n");

    text.deleteText(1, 1);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a12\n3\nbc\n");

    text.insertText("\n", 4);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "a12\n\n3\nbc\n");

    text.deleteText(1, 6);
    chai.assert.equal(text.getText(0, Number.MAX_VALUE), "abc\n");

})