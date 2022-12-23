import { AtomGroup } from "./transact";

@AtomGroup
export class ArtboardMeta {
    private m_name: string;
    private m_id: string;
    // private m_pageId: string;
    constructor(id: string, name: string) {
        this.m_id = id;
        this.m_name = name;
        // this.m_pageId = pageId;
    }
    public get name(): string {
        return this.m_name;
    }
    public set name(v: string) {
        this.m_name = v;
    }
    public get id(): string {
        return this.m_id;
    }
    // public get pageId(): string {
    //     return this.m_pageId;
    // }
}

@AtomGroup
export class PageMeta {
    private m_id: string;
    private m_name: string;
    // private m_artboards: Map<string, ArtboardMeta>;
    constructor(id: string, name: string) {
        this.m_id = id;
        this.m_name = name;
        // this.m_artboards = new Map(artMeta);
    }
    public get id(): string {
        return this.m_id;
    }
    public get name(): string {
        return this.m_name;
    }
    public set name(v: string) {
        this.m_name = v;
    }
    // public addArtboardMeta(m: ArtboardMeta) {
    //     this.m_artboards.set(m.id, m);
    // }
    // public deleteArtboardMeta(id: string) {
    //     this.m_artboards.delete(id);
    // }
}

@AtomGroup
export class ArtboardsMeta extends Map<string, ArtboardMeta> {
    public addArtboardMeta(m: ArtboardMeta) {
        this.set(m.id, m);
    }
    public deleteArtboardMeta(id: string) {
        this.delete(id);
    }
}

@AtomGroup
export class PagesMeta extends Array<PageMeta> {
    private m_map: Map<string, PageMeta> = new Map();
    constructor(metas:[string, PageMeta][]) {
        super();
        for (let i = 0, len = metas.length; i < len; i++) {
            const a = metas[i];
            super.push(a[1]);
            this.m_map.set(...a);
        }
    }

    get(id: string): PageMeta | undefined {
        return this.m_map.get(id);
    }
}
