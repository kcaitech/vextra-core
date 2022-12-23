import { IJSON, LzData } from "@/data/lzdata";
import { ArtboardMeta, ArtboardsMeta, PageMeta, PagesMeta } from "@/data/meta";

export async function importMeta(lzData: LzData, pageIds: string[]) {
    const metaJson: IJSON = await lzData.load('meta.json');
    // const metaJson: IJSON = JSON.parse(buffer.toString());
    const pagesAndArtboards: IJSON = metaJson['pagesAndArtboards'];

    const meta: [string, {p: PageMeta, a: ArtboardsMeta}][] = Object.keys(pagesAndArtboards).map((key: string) => {
        const item: IJSON = pagesAndArtboards[key];
        const name: string = item['name'];
        const artboards: IJSON = item['artboards'];
        const artMeta: [string, ArtboardMeta][] = Object.keys(artboards).map((key: string) => {
            const item: IJSON = artboards[key];
            const name: string = item['name'];
            return [key, new ArtboardMeta(key, name)];
        })
        return [key, {p: new PageMeta(key, name), a: new ArtboardsMeta(artMeta)}];
    });
    const metaMap: Map<string, {p: PageMeta, a: ArtboardsMeta}>  = new Map(meta);

    const pagesMeta = new PagesMeta(pageIds.map((val) => {
        const m = metaMap.get(val);
        return [val,  m && m.p || new PageMeta(val, "unknow")];
    }));
    const artboardsMeta: [string, ArtboardsMeta][] = pageIds.map((val) => {
        const m = metaMap.get(val);
        return [val,  m && m.a || new ArtboardsMeta()];
    });

    return { pagesMeta, artboardsMeta };
}