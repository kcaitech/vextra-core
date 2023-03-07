// LzData
export interface IJSON {
	[key: string]: any
}
export interface LzData {
	load(url: string): Promise<IJSON>;
    loadRaw(url: string): Promise<Uint8Array>;
}
