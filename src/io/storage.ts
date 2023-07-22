export interface IStorage {
    get(uri: string, versionId?: string): Promise<Uint8Array>
    put(uri: string, data: Uint8Array, contentType?: string): Promise<void>
}
