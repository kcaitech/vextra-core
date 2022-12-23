// LzDataRemote

import { IJSON, LzData } from "@/data/lzdata";
import { Link } from "../../../basic/link";

// function toArrayBuffer(buf: Buffer) {
//     var ab = new ArrayBuffer(buf.length);
//     var view = new Uint8Array(ab);
//     for (var i = 0; i < buf.length; ++i) {
//         view[i] = buf[i];
//     }
//     return ab;
// }

// function toBuffer(ab: ArrayBuffer) {
//     var buf = new Buffer(ab.byteLength);
//     var view = new Uint8Array(ab);
//     for (var i = 0; i < buf.length; ++i) {
//         buf[i] = view[i];
//     }
//     return buf;
// }

export class LzDataRemote implements LzData {
    private __link: Link;
    constructor(l: Link) {
        this.__link = l;
    }
    loadRaw(url: string): Promise<Uint8Array> {
        // throw new Error("Method not implemented.");
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', 'http://localhost:8000/media?ref=' + url);
            xhr.onload = (ev: ProgressEvent) => {
                const blob = xhr.response;
                const reader = new FileReader();
                reader.readAsArrayBuffer(blob);
                reader.onload = (ev: ProgressEvent) => {
                    const arr = reader.result as ArrayBuffer;
                    resolve(new Uint8Array(arr, 1, 4))
                }
            }
            xhr.responseType = 'blob';
            xhr.send();
        });
    }
    load(url: string): Promise<IJSON> {
        return new Promise((resolve, reject) => {
            const token = this.__link.on('load', (data: IJSON) => {
                if (data['url'] == url) {
                    token.remove();
                    resolve(JSON.parse(data['data']));
                }
            })
            this.__link.send({ msg: 'load', data: url });
        })
    }
}
