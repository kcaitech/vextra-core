/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArrayOpAttr, ArrayOpInsert, ArrayOpRemove } from "./arrayop";
import { ParaAttr, SpanAttr, Text } from "../../data/text/text";
import { importParaAttr, importSpanAttr, importText } from "../../data/baseimport";

export type TextInsertProps =
    {
        type: "simple",
        text: string,
        props?: { attr?: SpanAttr, paraAttr?: ParaAttr }
    } | {
        type: "complex",
        text: Text
    }

export class TextOpInsert extends ArrayOpInsert {
    // { type: "simple", text, attr, length: text.length }
    // { type: "complex", text: exportText(text), length: text.length }
    text: TextInsertProps

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        text: TextInsertProps
    ) {
        super(
            id, path, order, start, length,
        )
        this.text = text
    }

    clone(): TextOpInsert {
        return new TextOpInsert(
            this.id, this.path, this.order, this.start, this.length, this.text
        )
    }

    static parse(op: any): TextOpInsert {
        const text = op.text;
        let _text: TextInsertProps;
        if (text.type === 'simple') {
            let _props: { attr?: SpanAttr, paraAttr?: ParaAttr } | undefined;
            if (text.props && (text.props.attr || text.props.paraAttr)) {
                _props = {}
                if (text.props.attr) {
                    _props.attr = importSpanAttr(text.props.attr);
                }
                if (text.props.paraAttr) {
                    _props.paraAttr = importParaAttr(text.props.paraAttr);
                }
            }
            _text = {
                type: "simple",
                text: text.text,
                props: _props
            }
        }
        else {
            _text = {
                type: "complex",
                text: importText(text.text)
            }
        }
        return new TextOpInsert(op.id, op.path, op.order, op.start, op.length, _text);
    }
}

export class TextOpInsertRecord extends TextOpInsert {
    target?: Text;
    constructor(id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        text: TextInsertProps,
        target: Text | undefined) {
        super(id, path, order, start, length, text);
        this.target = target;
    }

    clone(): TextOpInsertRecord {
        return new TextOpInsertRecord(this.id, this.path, this.order, this.start, this.length, this.text, this.target);
    }
}

export class TextOpRemove extends ArrayOpRemove {
    clone(): ArrayOpRemove {
        return new TextOpRemove(
            this.id, this.path, this.order, this.start, this.length
        )
    }
    static parse(op: any): TextOpRemove {
        return new TextOpRemove(op.id, op.path, op.order, op.start, op.length);
    }
}

export class TextOpRemoveRecord extends TextOpRemove {
    text: Text; // 被删除的文本
    target?: Text;
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        text: Text,
        target: Text | undefined
    ) {
        super(
            id, path, order, start, length,
        )
        this.text = text
        this.target = target;
    }

    clone(): ArrayOpRemove {
        return new TextOpRemoveRecord(
            this.id, this.path, this.order, this.start, this.length, this.text, this.target
        )
    }
}

export class TextOpAttr extends ArrayOpAttr {
    props: { target: "span" | "para", key: string, value: any }
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        props: { target: "span" | "para", key: string, value: any }
    ) {
        super(
            id, path, order, start, length,
        )
        this.props = props
    }
    clone(): ArrayOpAttr {
        return new TextOpAttr(
            this.id, this.path, this.order, this.start, this.length, this.props
        )
    }
    static parse(op: any): TextOpAttr {
        return new TextOpAttr(op.id, op.path, op.order, op.start, op.length, op.props);
    }
}

export class TextOpAttrRecord extends TextOpAttr {
    origin: { index: number, len: number, value: any }[];
    target?: Text;
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        props: { target: "span" | "para", key: string, value: any },
        origin: { index: number, len: number, value: any }[],
        target: Text | undefined
    ) {
        super(
            id, path, order, start, length, props
        )
        this.target = target;
        // merge
        const index = origin.findIndex(o => o.value !== props.value);
        const merged = [];
        if (index >= 0) {
            merged.push(origin[index]);
            let last = origin[index];
            for (let i = index + 1; i < origin.length; ++i) {
                const o = origin[i];
                if (o.index === last.index + last.len && o.value === last.value) {
                    last.len += o.len;
                } else if (o.value !== props.value) {
                    merged.push(o);
                    last = o;
                }
            }
        }
        this.origin = merged
    }

    clone(): ArrayOpAttr {
        const origin = this.origin.map(o => {
            return { index: o.index, len: o.len, value: o.value }
        });
        return new TextOpAttrRecord(
            this.id, this.path, this.order, this.start, this.length, this.props, origin, this.target
        )
    }
}
