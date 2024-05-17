import { IJSON } from "./basic"

export interface LzData {
    loadRaw(url: string): Promise<Uint8Array>
    loadJson(url: string): Promise<IJSON>
}
