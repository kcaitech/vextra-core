/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import JSZip from 'jszip';

export class Zip {
    private _file: File;
    private _zip: JSZip | undefined;
    private _hs: Map<string, Function> = new Map()
    constructor(file: File | string) {
        this._file = file instanceof File ? file : new File([], file); // 这个File用法不对的
        this._load();
    }
    on(event: 'ready', handler: () => void): void;
    on(event: 'error', handler: (error: any) => void): void;
    on(event: string, handler: (error?: any) => void): void {
        this._hs.set(event, handler);
    }
    private async _load() {
        if (this._zip) return;
        const buffer = await this._file.arrayBuffer();
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
