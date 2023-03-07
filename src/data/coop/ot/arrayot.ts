export namespace ArrayOt {
    enum OpType {
        array_none,
        array_insert,
        array_remove,
        array_attr,
    }

    interface Op {
        get type(): OpType;
        get range(): { start: number, length: number };
        transBy(op: Op): Op;
        clone(): Op;
    }

    export class OpArrayNone implements Op {
        private _unit_order: number;
        constructor(unitOrder: number) {
            this._unit_order = unitOrder;
        }
        transBy(op: Op): Op {
            return this.clone();
        }
        clone(): OpArrayNone {
            return new OpArrayNone(this.unit_order);
        }
        get type() {
            return OpType.array_none
        }
        get range() {
            return { start: -1, length: 0 }
        }
        get unit_order() {
            // 返回对用户有唯一顺序的数据，如登陆时间、用户id等
            // 用于在插入位置一样时，判断将哪个插入在前
            return this._unit_order
        }
        // get attr() {
        //     // attrs
        // }
    }

    export class OpArrayInsert extends OpArrayNone {
        private _start: number;
        private _length: number;

        constructor(unitOrder: number, start: number, len: number) {
            super(unitOrder);
            this._start = start;
            this._length = len;
        }

        get type() {
            return OpType.array_insert
        }
        get range() {
            return { start: this._start, length: this._length }
        }
        clone(): OpArrayInsert {
            const clone = new OpArrayInsert(this.unit_order, this._start, this._length)
            // clone._unit_order = this.unit_order
            // clone._start = this._start
            // clone._length = this._length
            return clone
        }

        _transByInsert(op: OpArrayInsert) {
            const lhs_start = op.range.start; // 已经应用的op
            let rhs_start = this._start;
            if (rhs_start < lhs_start) {
                // 不用转换
            } else if (lhs_start < rhs_start
                || op.unit_order < this.unit_order) {
                rhs_start += op.range.length
            }
            const t_op = this.clone()
            t_op._start = rhs_start
            return t_op
        }

        _transByRemove(op: OpArrayRemove) {
            // 在插入之后删除
            const lhs_range = op.range
            const lhs_start = lhs_range.start
            const lhs_len = lhs_range.length
            const rhs_start = this._start
            if (rhs_start <= lhs_start) {
                return this.clone()
            }
            // 在插入之前删除
            if (rhs_start >= lhs_start + lhs_len) {
                const t_op = this.clone()
                t_op._start -= lhs_len
                return t_op
            }
            // 删除区间包含插入区间
            const t_op = new OpArrayNone(this.unit_order)
            // t_op._unit_order = this._unit_order

            return t_op
        }

        _transByAttr(op: OpArrayAttr) {
            return this.clone()
        }

        transBy(op: Op): Op {
            switch (op.type) {
                case OpType.array_none:
                    return this.clone()
                case OpType.array_insert:
                    return this._transByInsert(op as OpArrayInsert)
                case OpType.array_remove:
                    return this._transByRemove(op as OpArrayRemove)
                case OpType.array_attr:
                    return this._transByAttr(op as OpArrayAttr)
            }
            // return undefined
        }
    }

    export class OpArrayRemove extends OpArrayNone {
        private _start: number;
        private _length: number;

        constructor(unitOrder: number, start: number, len: number) {
            super(unitOrder);
            this._start = start;
            this._length = len;
        }

        get type() {
            return OpType.array_remove
        }
        get range() {
            return { start: this._start, length: this._length }
        }
        clone(): OpArrayRemove {
            const clone = new OpArrayRemove(this.unit_order, this._start, this._length)
            // clone._unit_order = this.unit_order
            // clone._start = this._start
            // clone._length = this._length
            return clone
        }

        _transByInsert(op: OpArrayInsert) {
            const lhs_range = op.range
            const lhs_start = lhs_range.start
            const lhs_len = lhs_range.length
            const rhs_start = this._start

            if (lhs_start <= rhs_start) {
                const t_op = this.clone()
                t_op._start += lhs_len
                return t_op
            }
            if (lhs_start < rhs_start) {
                const t_op = this.clone()
                t_op._length += lhs_len
                return t_op
            }
            return this.clone()
        }

        _transByRemove(op: OpArrayRemove) {
            const lhs_range = op.range
            const lhs_start = lhs_range.start
            const lhs_len = lhs_range.length
            const rhs_start = this._start
            const rhs_len = this._length

            // 不相交
            if (lhs_start + lhs_len <= rhs_start) {
                const t_op = this.clone()
                t_op._start -= lhs_len
                return t_op
            }
            if (rhs_start + rhs_len <= lhs_start) {
                return this.clone()
            }

            // 重合或者已经被删除
            if (lhs_start <= rhs_start
                && lhs_start + lhs_len >= rhs_start + rhs_len) {

                const t_op = new OpArrayNone(this.unit_order)
                // t_op._unit_order = this._unit_order
                return t_op
            }
            if (rhs_start < lhs_start
                && rhs_start + rhs_len > lhs_start + lhs_len) {
                const t_op = this.clone()
                t_op._length -= lhs_len
                return t_op
            }
            // 相交
            if (lhs_start < rhs_start) {
                const t_op = this.clone()
                t_op._length = rhs_start + rhs_len - lhs_start
                return t_op
            }
            if (lhs_start > rhs_start) {
                const t_op = this.clone()
                t_op._start = lhs_start + lhs_len
                t_op._length = rhs_start + rhs_len - t_op._start
                return t_op
            }
            throw new Error("Cant be here")
        }

        _transByAttr(op: OpArrayAttr) {
            return this.clone()
        }

        transBy(op: Op): Op {
            switch (op.type) {
                case OpType.array_none:
                    return this.clone()
                case OpType.array_insert:
                    return this._transByInsert(op as OpArrayInsert)
                case OpType.array_remove:
                    return this._transByRemove(op as OpArrayRemove)
                case OpType.array_attr:
                    return this._transByAttr(op as OpArrayAttr)
            }
        }
    }


    export class OpArrayAttr extends OpArrayNone {
        private _start: number;
        private _length: number;

        constructor(unitOrder: number, start: number, len: number) {
            super(unitOrder);
            this._start = start;
            this._length = len;
        }
        get type() {
            return OpType.array_attr
        }
        get range() {
            return { start: this._start, length: this._length }
        }
        clone(): OpArrayAttr {
            const clone = new OpArrayAttr(this.unit_order, this._start, this._length)
            // clone._unit_order = this.unit_order
            // clone._start = this._start
            // clone._length = this.length
            return clone
        }

        _transByInsert(op: OpArrayInsert) {
            const lhs_range = op.range
            const lhs_start = lhs_range.start
            const lhs_len = lhs_range.length
            const rhs_start = this._start
            const rhs_len = this._length

            // 插入在Attr的区间内时要变换
            if (rhs_start < lhs_start
                && lhs_start < rhs_start + rhs_len) {
                const t_op = this.clone()
                t_op._length += lhs_len
                return t_op
            }
            // 在之前插入
            if (lhs_start <= rhs_start) {
                const t_op = this.clone()
                t_op._start += lhs_len
                return t_op
            }
            return this.clone()
        }

        _transByRemove(op: OpArrayRemove) {
            const lhs_range = op.range
            const lhs_start = lhs_range.start
            const lhs_len = lhs_range.length
            const rhs_start = this._start
            const rhs_len = this._length

            // 不相交
            if (lhs_start + lhs_len <= rhs_start) {
                const t_op = this.clone()
                t_op._start -= lhs_len
                return t_op
            }
            if (rhs_start + rhs_len <= lhs_start) {
                return this.clone()
            }

            // 重合或者已经被删除
            if (lhs_start <= rhs_start
                && lhs_start + lhs_len >= rhs_start + rhs_len) {

                const t_op = new OpArrayNone(this.unit_order)
                // t_op._unit_order = this._unit_order
                return t_op
            }
            if (rhs_start < lhs_start
                && rhs_start + rhs_len > lhs_start + lhs_len) {
                const t_op = this.clone()
                t_op._length -= lhs_len
                return t_op
            }
            // 相交
            if (lhs_start < rhs_start) {
                const t_op = this.clone()
                t_op._length = rhs_start + rhs_len - lhs_start
                return t_op
            }
            if (lhs_start > rhs_start) {
                const t_op = this.clone()
                t_op._start = lhs_start + lhs_len
                t_op._length = rhs_start + rhs_len - t_op._start
                return t_op
            }
            throw new Error("Cant be here")
        }

        _transByAttr(op: OpArrayAttr) {
            return this.clone()
        }

        transBy(op: Op): Op {
            switch (op.type) {
                case OpType.array_none:
                    return this.clone()
                case OpType.array_insert:
                    return this._transByInsert(op as OpArrayInsert)
                case OpType.array_remove:
                    return this._transByRemove(op as OpArrayRemove)
                case OpType.array_attr:
                    return this._transByAttr(op as OpArrayAttr)
            }
        }
    }
}