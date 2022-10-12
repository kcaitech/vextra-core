
export class Matrix {
    private m_matrix: number[];

    constructor()
    constructor(m: number[])
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number)
    constructor(...args: any) {
        this.m_matrix = args.length === 0 ? [1, 0, 0, 1, 0, 0] :
            (args[0] instanceof Array ? args[0] : [...args]);
    }

    multi(m: number[]): void
    multi(m: Matrix): void
    multi(m: any): void {
        const m0 = this.m_matrix;
        const mm = m instanceof Matrix ? m.m_matrix : m;
        const m1 = [
            mm[0] * m0[0] + mm[1] * m0[2], mm[0] * m0[1] + mm[1] * m0[3],
            mm[2] * m0[0] + mm[3] * m0[2], mm[2] * m0[1] + mm[3] * m0[3],
            mm[0] * m0[4] + mm[1] * m0[5] + mm[4], mm[2] * m0[4] + mm[3] * m0[5] + mm[5]
        ]
        this.m_matrix = m1;
    }
    trans(x: number, y: number) {
        this.multi([1, 0, 0, 1, x, y]);
    }
    scale(s: number) {
        this.multi([s, 0, 0, s, 0, 0]);
    }
    computeCoord(x: number, y: number) {
        const m = this.m_matrix
        return { x: m[0] * x + m[1] * y + m[4], y: m[2] * x + m[3] * y + m[5] };
    }

    reset(): void
    reset(m: number[]): void
    reset(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number): void
    reset(...args: any): void {
        this.m_matrix = args.length === 0 ? [1, 0, 0, 1, 0, 0] :
            (args[0] instanceof Array ? args[0] : [...args]);
    }

    toString() {
        return 'matrix(' + this.m_matrix.join(',') + ')';
    }
    toArray() {
        return this.m_matrix.slice(0);
    }
}
