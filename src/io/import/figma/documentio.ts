import { Document } from "../../../data/document";
import { getFigJsonData } from "./tojson";

export async function importDocument(file: File, /*inflateRawSync: (data: Uint8Array)=> Uint8Array*/): Promise<Document> {

    const buffer = await file.arrayBuffer();

    const json = getFigJsonData(new Uint8Array(buffer));
    console.log(json)

    throw new Error();
}