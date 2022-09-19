// Transact
import {objectId} from '../basic/objectid';

// 事务方案
// 当对象有修改时，整体浅拷贝备份，由对象提供方法（save, restore)
// 在一个事务过程中，一个对象仅备份一次

export interface IRecordable {
	save(): object;
	restore(saved: object): void;
}

//export class RecordableArray implements IRecordable {
//	
//}

export class AtomRec {
	private m_target: IRecordable;
	private m_save: object;
	
	constructor(target: IRecordable) {
		this.m_target = target;
		this.m_save = target.save();
	}
	restore() {
		const save = this.m_target.save();
		this.m_target.restore(this.m_save);
		this.m_save = save;
	}
}

export class Record {
    private m_name: string;
	private m_recorded: Set<number> = new Set();
	private m_atoms: AtomRec[] = [];

    constructor(name: string) {
        this.m_name = name;
    }
	
	add(target: IRecordable) {
		const id = objectId(target);
		if (this.m_recorded.has(id)) {
			return;
		}
		this.m_atoms.push(new AtomRec(target));
		this.m_recorded.add(id);
	}
	restore() {
		this.m_atoms.forEach((atom: AtomRec) => {
			atom.restore();
		});
	}
    get name(): string {
        return this.m_name;
    }
}

export class Tape {
    private m_records: Record[] = [];
    private m_curRecord: Record | undefined;
    private m_curIndex: number = 0;

    constructor() {
    }

    beginRec(name: string) {
        if (this.m_curRecord) {
            throw new Error("Nested Rec arg Not supported yet.");
        }
        this.m_curRecord = new Record(name);
    }

    endRec(rollback?:boolean) {
        if (!this.m_curRecord) {
            throw new Error("Not Started Rec yet.");
        }
        if (rollback) {
            this.m_curRecord?.restore();
        }
        else {
            if (this.m_curIndex < this.m_records.length) {
                this.m_records.splice(this.m_curIndex);
            }
            this.m_records.push(this.m_curRecord);
            this.m_curIndex = this.m_records.length;
        }
        this.m_curRecord = undefined;
    }

    canUndo() {
        return !this.m_curRecord && this.m_curIndex > 0;
    }

    canRedo() {
        return !this.m_curRecord && this.m_curIndex < this.m_records.length;
    }

    undo() {
        if (!this.m_curRecord) {
            throw new Error("Cant UNDO when Insided Rec.");
        }
        if (!this.canUndo()) {
            return;
        }
        let record = this.m_records[this.m_curIndex];
        record.restore();
        this.m_curIndex--;
    }

    redo() {
        if (!this.m_curRecord) {
            throw new Error("Cant REDO when Insided Rec.");
        }
        if (!this.canRedo()) {
            return;
        }
        let record = this.m_records[this.m_curIndex + 1];
        record.restore();
        this.m_curIndex++;
    }
}
