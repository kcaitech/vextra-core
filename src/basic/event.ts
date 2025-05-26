/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// EventEmitter

interface KeyFns {
    [key: string]: Function[]
}

export interface IEventEmitter {
    on(name: string, cb: Function): { remove: () => void }
    once(name: string, cb: Function): { remove: () => void }
    emit(name: string, ...args: any[]): void;
    remove(name: string, fn: Function, channel?: 'on' | 'once' | 'all'): void;
}

function _remove(events: KeyFns, name: string, fn: Function) {
    const arr = events[name];
    if (arr && arr.length > 0) {
        const idx = arr.indexOf(fn);
        if (idx >= 0) {
            arr.splice(idx, 1);
        }
    }
}

export class EventEmitter implements IEventEmitter {
    private _events: KeyFns = {};
    private _onceEvents: KeyFns = {};

    on(name: string, fn: Function) {
        (this._events[name] || (this._events[name] = [])).push(fn);
        return {
            remove: () => _remove(this._events, name, fn)
        };
    }

    once(name: string, fn: Function) {
        (this._onceEvents[name] || (this._onceEvents[name] = [])).push(fn);
        return {
            remove: () => _remove(this._onceEvents, name, fn)
        }
    }

    emit(name: string, ...args: any[]) {
        const events = this._events[name];
        if (events && events.length > 0) {
            Array.from(events).forEach((fn: Function) => fn(...args));
        }
        const once = this._onceEvents[name];
        if (once && once.length > 0) {
            Array.from(once).forEach((fn: Function) => fn(...args));
            delete this._onceEvents[name];
        }
    }

    remove(name: string, fn: Function, channel: 'on' | 'once' | 'all' = 'all') {
        if (channel !== 'once') _remove(this._events, name, fn);
        if (channel !== 'on') _remove(this._onceEvents, name, fn);
    }
}
