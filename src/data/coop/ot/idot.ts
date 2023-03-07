export namespace IdOt {
    enum OpType {
        id_none,
        id_insert,
        id_remove,
    }

    interface Op {
        get type(): OpType;
        get opId(): string;
        transBy(op: Op): Op;
        clone(): Op;
    }

    export class OpIdNone implements Op {
        private _unit_order: number;
        private _op_id: string;

        constructor(unitOrder: number, opId: string) {
            this._unit_order = unitOrder;
            this._op_id = opId;
        }
        clone(): OpIdNone {
            return new OpIdNone(this._unit_order, this._op_id);
        }
        transBy(op: Op): Op {
            return op.clone();
        }
        get type(): OpType {
            return OpType.id_none;
        }
        get opId(): string {
            return this._op_id;
        }
        get unit_order() {
            // 返回对用户有唯一顺序的数据，如登陆时间、用户id等
            // 用于在插入位置一样时，判断将哪个插入在前
            return this._unit_order
        }
    }

    export class OpIdInsert extends OpIdNone {
        get type(): OpType {
            return OpType.id_insert;
        }
        clone(): OpIdInsert {
            return new OpIdInsert(this.unit_order, this.opId);
        }
        transBy(op: Op): Op {
            switch (op.type) {
                case OpType.id_none:
                    return this.clone();
                case OpType.id_insert:
                    return this._transByInsert(op as OpIdInsert);
                case OpType.id_remove:
                    return this._transByRemove(op as OpIdRemove);
            }
        }
        _transByInsert(op: OpIdInsert): Op {
            if (op.opId == this.opId && op.unit_order > this.unit_order) {
                return new OpIdNone(this.unit_order, this.opId);
            }
            return this.clone();
        }
        _transByRemove(op: OpIdRemove): Op {
            if (op.opId == this.opId && op.unit_order > this.unit_order) {
                return new OpIdNone(this.unit_order, this.opId);
            }
            return this.clone();
        }
    }

    export class OpIdRemove extends OpIdNone {
        get type(): OpType {
            return OpType.id_remove;
        }
        clone(): OpIdRemove {
            return new OpIdRemove(this.unit_order, this.opId);
        }
        transBy(op: Op): Op {
            switch (op.type) {
                case OpType.id_none:
                    return this.clone();
                case OpType.id_insert:
                    return this._transByInsert(op as OpIdInsert);
                case OpType.id_remove:
                    return this._transByRemove(op as OpIdRemove);
            }
        }
        _transByInsert(op: OpIdInsert): Op {
            if (op.opId == this.opId && op.unit_order > this.unit_order) {
                return new OpIdNone(this.unit_order, this.opId);
            }
            return this.clone();
        }
        _transByRemove(op: OpIdRemove): Op {
            if (op.opId == this.opId && op.unit_order > this.unit_order) {
                return new OpIdNone(this.unit_order, this.opId);
            }
            return this.clone();
        }
    }
}