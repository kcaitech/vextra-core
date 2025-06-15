/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArrayOp, ArrayOpAttr, ArrayOpInsert, ArrayOpRemove, ArrayOpType } from "./arrayop";
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

    _cloneOrigin() {
        return this.origin.map(o => {
            return { index: o.index, len: o.len, value: o.value }
        });
    }
    _clone(origin: { index: number, len: number, value: any }[]) {
        return new TextOpAttrRecord(
            this.id, this.path, this.order, this.start, this.length, this.props, origin, this.target
        )
    }

    clone(): ArrayOpAttr {
        return this._clone(this._cloneOrigin());
    }

    _transByInsert(op: ArrayOpInsert): ArrayOp {
        const trans = super._transByInsert(op) as TextOpAttrRecord;

        const lhs_start = op.start
        const lhs_len = op.length
        let origin = trans.origin;
        for (let i = 0; i < origin.length; ++i) {
            const rhs = origin[i];
            const rhs_start = rhs.index;
            const rhs_len = rhs.len;
            if (lhs_start > rhs_start && lhs_start < rhs_start + rhs_len) { // op在中间
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                t_op.len += lhs_len
                continue;
            }
            if (lhs_start <= rhs_start) { // op在左边
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                t_op.index += lhs_len
                continue;
            }
        }
        if (trans !== this) return trans; // 已经clone
        if (origin === this.origin) return this; // 无需clone
        return this._clone(origin);
    }

    _transByRemove(op: ArrayOpRemove): ArrayOp {
        const trans = super._transByRemove(op) as TextOpAttrRecord;
        if (trans.type1 !== ArrayOpType.Attr) return trans; // none

        const lhs_start = op.start
        const lhs_len = op.length
        let origin = trans.origin;
        for (let i = 0; i < origin.length; ++i) {
            const rhs = origin[i];
            const rhs_start = rhs.index;
            const rhs_len = rhs.len;
            if (lhs_start + lhs_len <= rhs_start) { // 不相交，op在左边
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                t_op.index -= lhs_len
                continue;
            }
            if (lhs_start >= rhs_start + rhs_len) { // 不相交，op在右边
                continue;
            }
            if (lhs_start <= rhs_start && lhs_start + lhs_len >= rhs_start + rhs_len) { // 被op包含
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                t_op.index = -1;
                t_op.len = -1;
                continue;
            }
            if (lhs_start >= rhs_start && lhs_start + lhs_len <= rhs_start + rhs_len) { // 包含op
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                t_op.len -= lhs_len
                continue;
            }
            if (lhs_start < rhs_start) { // 相交，op在左边
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
                t_op.index -= op.length - inter_len
                t_op.len -= inter_len
                continue;
            }
            if (lhs_start > rhs_start) { // 相交，op在右边
                if (origin === this.origin) origin = this._cloneOrigin();
                const t_op = origin[i];
                const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
                t_op.len -= inter_len
                continue;
            }
            throw new Error("Cant be here")
        }
        if (trans !== this) return trans; // 已经clone
        if (origin === this.origin) return this; // 无需clone
        return this._clone(origin);
    }
}
