import StreamZip from "node-stream-zip";
import { IJSON, LzData } from "@/data/lzdata";

export class LzDataLocal implements LzData {
	private m_zip: StreamZip;
	private m_dataReady: boolean = false;
	private m_waitList?: Function[];

	constructor(filePath: string) {
		this.m_zip = new StreamZip({ file: filePath });

		this.m_zip.on('error', this._error.bind(this));
		this.m_zip.on('ready', this._ready.bind(this));
	}

    loadRaw(url: string): Promise<Uint8Array> {
        // todo: url 需要转换
        url = 'images/' + url;
        return new Promise((resolve, reject) => {
			const exec = () => {
				const buffer = (this.m_zip.entryDataSync(url));
                // const data = JSON.parse(buffer.toString());
				resolve(buffer);
			};

			if (this.m_dataReady) {
				exec();
			}
			else {
				(this.m_waitList || (this.m_waitList = [])).push(exec);
			}
		})
    }
	
	load(url: string): Promise<IJSON> {
        // todo: url 需要转换
		return new Promise((resolve, reject) => {
			const exec = () => {
				const buffer = (this.m_zip.entryDataSync(url));
                const data = JSON.parse(buffer.toString());
				resolve(data);
			};

			if (this.m_dataReady) {
				exec();
			}
			else {
				(this.m_waitList || (this.m_waitList = [])).push(exec);
			}
		})
	}
	
	private _error() {
	}
	
	private _ready() {
		this.m_dataReady = true;
		if (this.m_waitList) {
			// 逐个加载
			for (let i = 0, len = this.m_waitList.length; i < len; i++) {
				const exec = this.m_waitList[i];
				setTimeout(exec, 0);
			}
			delete this.m_waitList;
		}
	}

	close() {
		this.m_zip.close();
	}
}
