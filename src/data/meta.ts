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

export class PagesMeta extends Map<string, PageMeta> {}
