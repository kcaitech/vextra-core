// LzData

export interface LzData {
	load(url: string): Promise<Buffer>;
}
