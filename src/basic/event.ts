// EventEmitter

interface IKeyAny {
    [key: string]: any
}

export class EventEmitter {
    private _events: IKeyAny = {};
    private _onceEvents: IKeyAny = {};
    private _emitLevel: number = 0;
    private _removes: Function[] = [];

    constructor() {
    }

    on(name: string, cb: Function) {
        (this._events[name] || (this._events[name] = [])).push(cb);
        const rm = () => this._events[name] && this._events[name].splice(this._events[name].indexOf(cb) >>> 0, 1);
        return {
            remove: () => {
                if (this._emitLevel === 0) rm();
                else this._removes.push(rm);
            }
        };
    }

    once(name: string, cb: Function) {
        (this._onceEvents[name] || (this._onceEvents[name] = [])).push(cb);
        const rm = () => this._onceEvents[name] && this._onceEvents[name].splice(this._onceEvents[name].indexOf(cb) >>> 0, 1);
        return {
            remove: () => {
                if (this._emitLevel === 0) rm();
                else this._removes.push(rm);
            } 
        };
    }

    emit(name: string, ...args: any[]) {
        this._emitLevel++;
        try {
            (this._events[name] || []).forEach((fn: Function) => fn(...args));
            (this._onceEvents[name] || []).forEach((fn: Function) => fn(...args));
            delete this._onceEvents[name];
        } finally {
            this._emitLevel--;
        }
        if (this._emitLevel === 0) {
            this._removes.forEach((fn: Function) => fn());
            this._removes.length = 0;
        }
    }
}
