import { AtomGroup } from "./transact";

@AtomGroup
export class ArtboardMeta {
    private m_name: string;
    private m_id: string;
    constructor(id: string, name: string) {
        this.m_id = id;
        this.m_name = name;
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
}

@AtomGroup
export class PageMeta {
    private m_id: string;
    private m_name: string;
    private m_artboards: Map<string, ArtboardMeta>;
    constructor(id: string, name: string, artMeta?: [string, ArtboardMeta][]) {
        this.m_id = id;
        this.m_name = name;
        this.m_artboards = new Map(artMeta);
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
    public addArtboardMeta(m: ArtboardMeta) {
        this.m_artboards.set(m.id, m);
    }
    public deleteArtboardMeta(id: string) {
        this.m_artboards.delete(id);
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
