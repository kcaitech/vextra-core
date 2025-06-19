/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import JSZip from 'jszip';
import { isBrowser, isNode } from "../../../basic/consts";

export class Zip {
    private _buffer: Promise<ArrayBuffer>;
    private _zip: JSZip | undefined;
    private _hs: Map<string, Function> = new Map()
    constructor(file: File | string) {
        if (isBrowser) {
            if (!(file instanceof File)) {
                throw new Error('browser 不支持通过文件路径导入');
            }
            //
            // 浏览器环境处理 File 对象
            this._buffer = file.arrayBuffer();
        } else if (isNode) {
            if (typeof file !== 'string') {
                throw new Error('node 不支持通过文件对象导入');
            }

            this._buffer = new Promise(async (resolve, reject) => {
                const fs = await import('fs');
                fs.readFile(file, (err, data) => {
                    if (err) reject(err);
                    resolve(data.buffer);
                });
            });
        } else {
            throw new Error('不支持的环境或文件类型');
        }
        this._load();
    }
    on(event: 'ready', handler: () => void): void;
    on(event: 'error', handler: (error: any) => void): void;
    on(event: string, handler: (error?: any) => void): void {
        this._hs.set(event, handler);
    }
    private async _load() {
        if (this._zip) return;
        const buffer = await this._buffer;
        let e;
        try {
            this._zip = await JSZip.loadAsync(buffer);
        } catch (err) {
            alert('Sorry!\nThis is not a zip file. It may be created by an old version sketch app.');
            // throw err;
            e = err;
        }
        if (e) {
            const h = this._hs.get('error');
            if (h) h(e);
        }
        else {
            const h = this._hs.get('ready');
            if (h) h();
        }
    }

    async entryDataJson(entry: string): Promise<{[key: string]: any}> {
        if (!this._zip) {
            return {}
        }
        const docStr = await this._zip.file(entry)?.async('string');
        if (!docStr) {
            return {};
        }
        return JSON.parse(docStr);
    }

    async entryData(entry: string): Promise<Uint8Array> {
        // if (!this._zip) return undefined;
        if (!this._zip) {
            return new Uint8Array();
        }
        const file = this._zip.file(entry);
        if (!file) {
            console.error(`image not exist: >>>${entry}<<<`);
            return new Uint8Array();
        }

        const blob = await file.async('blob');

        const buffer = await blob.arrayBuffer();
        return new Uint8Array(buffer);
    }

    close() {
    }
}
