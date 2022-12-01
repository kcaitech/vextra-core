// LzDataRemote

import { LzData } from "@/data/lzdata";

export class LzDataRemote implements LzData {
    load(url: string): Promise<Buffer> {
        throw new Error("Method not implemented.");
    }
}
