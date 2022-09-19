import { LzData } from "@/data/lzdata";
import { ArtboardMeta, PageMeta, PagesMeta } from "@/data/meta";
import { IJSON } from "./styleio";

export async function importMeta(lzData: LzData) {
    const buffer = await lzData.load('meta.json');
    const metaJson: IJSON = JSON.parse(buffer.toString());
    const pagesAndArtboards: IJSON = metaJson['pagesAndArtboards'];

    const meta:[string, PageMeta][] = Object.keys(pagesAndArtboards).map((key: string) => {
        const item: IJSON = pagesAndArtboards[key];
        const name: string = item['name'];
        const artboards: IJSON = item['artboards'];
        const artMeta: [string, ArtboardMeta][] = Object.keys(artboards).map((key: string) => {
            const item: IJSON = artboards[key];
            const name: string = item['name'];
            return [key, new ArtboardMeta(key, name)];
        })
        return [key, new PageMeta(key, name, artMeta)];
    });

    return new PagesMeta(meta);
}