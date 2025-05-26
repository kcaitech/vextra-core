/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { LzData } from "./lzdata";
import { Zip } from "./zip";

interface IJSON {
    [key: string]: any
}

export class LzDataLocal implements LzData {
    private m_zip: Zip;
    private m_dataReady: boolean = false;
    private m_waitList?: Function[];

    constructor(file: Zip) {
        this.m_zip = file;

        this.m_zip.on('error', () => {

        });
        this.m_zip.on('ready', () => {
            this.m_dataReady = true;
            if (this.m_waitList) {
                this.m_waitList.forEach((resolve) => {
                    resolve();
                })
                delete this.m_waitList;
            }
        });
    }

    private async _loadready() {
        if (this.m_dataReady) return;
        return new Promise((resolve, reject) => {
            (this.m_waitList || (this.m_waitList = [])).push(resolve);
        })
    }

    async loadRaw(url: string): Promise<Uint8Array> {
        // todo: url 需要转换
        // url = 'images/' + url;
        await this._loadready();
        const buffer = await (this.m_zip.entryData(url));
        return buffer;
    }

    async loadJson(url: string): Promise<IJSON> {
        // todo: url 需要转换
        await this._loadready();
        const json = await this.m_zip.entryDataJson(url);
        return json;
    }

    close() {
        this.m_zip.close();
    }
}

