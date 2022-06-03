
export class EL {
    private m_tag: string;
    private m_attr: any;
    private m_childs: EL[];
    constructor(tag: string, attr?: any, childs?: EL | EL[]) {
        this.m_tag = tag;
        this.m_attr = attr || {};
        this.m_childs = childs? (Array.isArray(childs)? childs : [childs]) : [];
    }
    create<T>(h: (tag: string, attr: any, childs:T[]) => T): T {
        return h(this.m_tag, this.m_attr, this.createChilds(h));
    }
    createChilds<T>(h: (tag: string, attr: any, childs:T[]) => T): T[] {
        return this.m_childs.map((c) => c.create(h));
    }
    get tag() {
        return this.m_tag;
    }
    set tag(tag: string) {
        this.m_tag = tag;
    }
    get attr() {
        return this.m_attr;
    }
    set attr(attr: any) {
        this.m_attr = attr || {};
    }
    addAttr(attr: any) {
        Object.keys(attr).forEach((k) => {
            this.m_attr[k] = attr[k];
        })
    }
    get childs() {
        return this.m_childs;
    }
    push(el:EL) {
        this.m_childs.push(el);
    }
    pushEL(tag: string, attr?: any, childs?: EL | EL[]) {
        this.push(new EL(tag, attr, childs));
    }
    childsCount(): number {
        return this.m_childs.length;
    }
}

export class ELArray extends Array<EL> {
    create<T>(h: (tag: string, attr: any, childs:T[]) => T): T[] {
        return this.map((c) => c.create(h));
    }
}

export function el(tag: string, attr?: any, childs?: EL | EL[]): EL {
    return new EL(tag, attr, childs);
}