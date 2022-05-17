// EventEmitter

interface IKeyAny {
    [key: string]: any
}

export class EventEmitter {
    private _events: IKeyAny = {};
    private _onceEvents: IKeyAny = {};

    constructor() {
    }

    on(name: string, cb: Function) {
        (this._events[name] || (this._events[name] = [])).push(cb);

        return {
            remove: () =>
                this._events[name] && this._events[name].splice(this._events[name].indexOf(cb) >>> 0, 1)
        };
    }

    once(name: string, cb: Function) {
        (this._onceEvents[name] || (this._onceEvents[name] = [])).push(cb);

        return {
            remove: () =>
                this._onceEvents[name] && this._onceEvents[name].splice(this._onceEvents[name].indexOf(cb) >>> 0, 1)
        };
    }

    emit(name: string, ...args: any[]) {
        (this._events[name] || []).forEach((fn: Function) => fn(...args));
        (this._onceEvents[name] || []).forEach((fn: Function) => fn(...args));
        delete this._onceEvents[name];
    }
}
