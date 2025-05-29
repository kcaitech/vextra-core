/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { IDataGuard, WatchableObject } from './basic';

class ProxyHandler {
    set(target: object, propertyKey: PropertyKey, value: any, receiver?: any) {
        if (typeof propertyKey === 'string' && propertyKey.startsWith('__')) {
            // ignore
        }
        else {
            if (typeof value === 'object') value.__parent = target;
            value = deepProxy(value, this);
        }
        return Reflect.set(target, propertyKey, value, receiver);
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const val = Reflect.get(target, propertyKey, receiver);
        if (val === undefined && propertyKey === "__isProxy") {
            return true;
        }
        if (target instanceof Map && typeof val === 'function') {
            return val.bind(target);
        }
        return val;
    }
    has(target: object, propertyKey: PropertyKey) {
        if (target instanceof Map) {
            return target.has(propertyKey);
        }
        const val = Reflect.has(target, propertyKey);
        // if (target instanceof Map && typeof val === 'function') {
        //     return val.bind(target);
        // }
        return val;
    }
}

export const isProxy = (obj: any): boolean => obj && obj["__isProxy"];

export class DataGuard extends WatchableObject implements IDataGuard {
    private __ph: ProxyHandler;
    constructor() {
        super();
        this.__ph = new ProxyHandler();
    }
    guard(data: any): any {
        return deepProxy(data, this.__ph);
    }
}

function deepProxy(data: any, h: ProxyHandler): any {
    if (typeof data !== 'object' || isProxy(data)) {
        return data;
    }

    const stack: any[] = [data];
    while (stack.length > 0) {
        const d = stack.pop();

        if (d instanceof Map) {
            d.forEach((v, k, m) => {
                if (k.startsWith("__")) {
                    // donothing
                }
                else if (typeof (v) === 'object') { // 还有array set map
                    v.__parent = d;
                    if (!isProxy(v)) {
                        m.set(k, new Proxy(v, h));
                        stack.push(v);
                    }
                }
            })
        }
        else {
            for (const k in d) {
                const v = Reflect.get(d, k);
                if (k.startsWith("__")) {
                    // donothing
                }
                else if (typeof (v) === 'object') { // 还有array set map
                    v.__parent = d;
                    if (!isProxy(v)) {
                        Reflect.set(d, k, new Proxy(v, h));
                        stack.push(v);
                    }
                }
            }
        }
    }
    return new Proxy(data, h);
}
