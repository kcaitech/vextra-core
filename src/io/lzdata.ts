
export interface IJSON {
    [key: string]: any
}

export interface LzData {
    loadRaw(url: string): Promise<Uint8Array>
    loadJson(url: string): Promise<IJSON>
}
