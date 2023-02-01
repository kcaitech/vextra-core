import { Zip } from "palzip";
import { IJSON, LzData } from "@/data/lzdata";

export class LzDataLocal implements LzData {
	private m_zip: Zip;
	private m_dataReady: boolean = false;
	private m_waitList?: Function[];

	constructor(file: File) {
		this.m_zip = new Zip(file);

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
        url = 'images/' + url;
        await this._loadready();
        const buffer = await (this.m_zip.entryData(url));
        return buffer;
    }
	
	async load(url: string): Promise<IJSON> {
        // todo: url 需要转换
        await this._loadready();
        const json = await this.m_zip.entryDataJson(url);
        return json;
	}

	close() {
		this.m_zip.close();
	}
}
