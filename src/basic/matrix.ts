/**
 * 标准矩阵
 *  1  0  0
 *  0  1  0
 *  0  0  1
 * https://developer.mozilla.org/zh-CN/docs/Web/CSS/transform-function/matrix
 * 对应数组下标
 *  0  2  4
 *  1  3  5
 * -1 -1 -1
 */
function __multi(lhs: number[], rhs: number[]): number[] {
    return [
        lhs[0] * rhs[0] + lhs[2] * rhs[1], lhs[1] * rhs[0] + lhs[3] * rhs[1],
        lhs[0] * rhs[2] + lhs[2] * rhs[3], lhs[1] * rhs[2] + lhs[3] * rhs[3],
        lhs[0] * rhs[4] + lhs[2] * rhs[5] + lhs[4], lhs[1] * rhs[4] + lhs[3] * rhs[5] + lhs[5]
    ]
}
const float_accuracy = 1e-7;

export class Matrix {
    private m_matrix: number[];

    constructor()
    constructor(m: number[] | Matrix)
    constructor(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number)
    constructor(...args: any) {
        this.m_matrix = args.length === 0 ? [1, 0, 0, 1, 0, 0] :
            (args[0] instanceof Array ? args[0] :
                (args[0] instanceof Matrix ? this.m_matrix = args[0].toArray() : [...args]));
    }

    multiAtLeft(m: number[]): void
    multiAtLeft(m: Matrix): void
    multiAtLeft(m: any): void { // 左乘 this = m * this
        const m0 = this.m_matrix;
        const mm = m instanceof Matrix ? m.m_matrix : m;
        this.m_matrix = __multi(mm, m0);
    }

    multi(m: number[]): void
    multi(m: Matrix): void
    multi(m: any): void { // 右乘 this = this * m
        const m0 = this.m_matrix;
        const mm = m instanceof Matrix ? m.m_matrix : m;
        this.m_matrix = __multi(m0, mm);
    }

    trans(x: number, y: number) {
        this.multiAtLeft([1, 0, 0, 1, x, y]);
    }
    preTrans(x: number, y: number) {
        this.multi([1, 0, 0, 1, x, y]);
    }
    scale(s: number): void;
    scale(sx: number, sy: number): void;
    scale(sx: number, sy?: number) {
        this.multiAtLeft([sx, 0, 0, sy ?? sx, 0, 0]);
    }
    /** 
     * @radians x轴向右，y轴坐标向下，顺时针方向，0-2pi 
     * @x @y 旋转中心点
     * */
    rotate(radians: number): void;
    rotate(radians: number, x: number, y: number): void;
    rotate(radians: number, x?: number, y?: number) {
        if (x || y) this.trans(-(x || 0), -(y || 0));
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        this.multiAtLeft([cos, sin, -sin, cos, 0, 0])
        if (x || y) this.trans(x || 0, y || 0);
    }
    computeCoord(point: { x: number, y: number }): { x: number, y: number };
    computeCoord(x: number, y: number): { x: number, y: number };
    computeCoord(pointOrX: number | { x: number, y: number }, _y?: number) {
        const isPoint = typeof pointOrX === 'object';
        const x = isPoint ? pointOrX.x : pointOrX;
        const y = isPoint ? pointOrX.y : _y!;
        const m = this.m_matrix
        return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
    }
    computeRef(dx: number, dy: number) {
        const m = this.m_matrix
        return { x: m[0] * dx + m[2] * dy, y: m[1] * dx + m[3] * dy };
    }

    get inverse() {
        const m = this.m_matrix;
        const d = m[0] * m[3] - m[1] * m[2];
        return [
            m[3] / d, - m[1] / d,
            - m[2] / d, m[0] / d,
            (m[2] * m[5] - m[4] * m[3]) / d,
            (m[1] * m[4] - m[5] * m[0]) / d
        ];
    }
    inverseCoord(point: { x: number, y: number }): { x: number, y: number };
    inverseCoord(x: number, y: number): { x: number, y: number };
    inverseCoord(pointOrX: number | { x: number, y: number }, _y?: number) {
        const isPoint = typeof pointOrX === 'object';
        const x = isPoint ? pointOrX.x : pointOrX;
        const y = isPoint ? pointOrX.y : _y!;
        const m = this.inverse
        return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
    }
    inverseRef(dx: number, dy: number) {
        const m = this.inverse
        return { x: m[0] * dx + m[2] * dy, y: m[1] * dx + m[3] * dy };
    }

    equals(m: Matrix): boolean {
        for (let i = 0; i < 6; i++) {
            if (Math.abs(this.m_matrix[i] - m.m_matrix[i]) > float_accuracy) return false;
        }
        return true;
    }

    reset(): void
    reset(m: number[] | Matrix): void
    reset(m0: number, m1: number, m2: number, m3: number, m4: number, m5: number): void
    reset(...args: any): void {
        if (args.length === 0) {
            const m = this.m_matrix;
            m[0] = 1;
            m[1] = 0;
            m[2] = 0;
            m[3] = 1;
            m[4] = 0;
            m[5] = 0;
        }
        else {
            this.m_matrix = args[0] instanceof Array ? args[0] :
                (args[0] instanceof Matrix ? this.m_matrix = args[0].toArray() : [...args]);
        }
    }

    toString() {
        return 'matrix(' + this.m_matrix.join(',') + ')';
    }
    toArray() {
        return this.m_matrix.slice(0);
    }

    get m00() {
        return this.m_matrix[0];
    }
    get m01() {
        return this.m_matrix[2];
    }
    get m02() {
        return this.m_matrix[4];
    }
    get m10() {
        return this.m_matrix[1];
    }
    get m11() {
        return this.m_matrix[3];
    }
    get m12() {
        return this.m_matrix[5];
    }

    flipVert(cy?: number) {
        if (cy) this.trans(0, -cy);
        this.multiAtLeft([1, 0, 0, -1, 0, 0]) // y = -y
        if (cy) this.trans(0, cy);
    }

    flipHoriz(cx?: number) {
        if (cx) this.trans(-cx, 0);
        this.multiAtLeft([-1, 0, 0, 1, 0, 0]) // x = -x
        if (cx) this.trans(cx, 0);
    }

    get identity() {
        return [1, 0, 0, 1, 0, 0];
    }
    isIdentity() {
        const identity = this.identity;
        const m = this.m_matrix;
        for (let i = 0, len = m.length; i < len; i++) {
            if (Math.abs(m[i] - identity[i]) > float_accuracy) return false;
        }
        return true;
    }
}
