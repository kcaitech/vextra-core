import { ArrayOpAttr, ArrayOpInsert, ArrayOpRemove } from "../../coop/common/arrayop";
import { ParaAttr, ParaAttrSetter, SpanAttr, SpanAttrSetter, Text } from "../../data/text";

type TextInsertProps =
    {
        type: "simple",
        text: string,
        attr?: SpanAttr
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
}

export class TextOpInsertRecord extends TextOpInsert {

}

export class TextOpRemove extends ArrayOpRemove {
    clone(): ArrayOpRemove {
        return new TextOpRemove(
            this.id, this.path, this.order, this.start, this.length
        )
    }
}

export class TextOpRemoveRecord extends TextOpRemove {
    text: Text; // 被删除的文本
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        text: Text
    ) {
        super(
            id, path, order, start, length,
        )
        this.text = text
    }

    clone(): ArrayOpRemove {
        return new TextOpRemoveRecord(
            this.id, this.path, this.order, this.start, this.length, this.text
        )
    }
}

export class TextOpAttr extends ArrayOpAttr {
    attr: SpanAttrSetter | ParaAttrSetter
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        attr: SpanAttrSetter | ParaAttrSetter
    ) {
        super(
            id, path, order, start, length,
        )
        this.attr = attr
    }
    clone(): ArrayOpAttr {
        return new TextOpAttr(
            this.id, this.path, this.order, this.start, this.length, this.attr
        )
    }
}

export class TextOpAttrRecord extends TextOpAttr {
    origin: SpanAttr | ParaAttr
    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        attr: SpanAttrSetter | ParaAttrSetter,
        origin: SpanAttr | ParaAttr
    ) {
        super(
            id, path, order, start, length, attr
        )
        this.origin = origin
    }
    clone(): ArrayOpAttr {
        return new TextOpAttrRecord(
            this.id, this.path, this.order, this.start, this.length, this.attr, this.origin
        )
    }
}