import { Document } from "@/data/document";
import { LzData } from '@/data/lzdata';
import { importPage } from "./pageio";
import { IJSON } from "./styleio";

export async function importDocument(lzData: LzData) {
    const buffer = await lzData.load('document.json');
    const data: IJSON = JSON.parse(buffer.toString());
    const pagesRef = (data["pages"] || []).map((d: IJSON) => {
        return d['_ref'] + '.json';
    });

    return new Document(lzData, pagesRef, importPage);
}