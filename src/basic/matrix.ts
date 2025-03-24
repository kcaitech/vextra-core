/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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

function transpose2x2(m: number[]) {
    return [
        m[0], m[2],
        m[1], m[3],
    ]
}

function multi2x2(m1: number[], m2: number[]) {
    return [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
    ]
}

function eigenDecomposition(A: number[]) {
    // A 是一个 2x2 对称矩阵 [[a, b], [b, d]]
    const a = A[0];
    const b = A[1]; // 因为是对称矩阵，A[1][0] == A[0][1]
    const d = A[3];

    // 特征多项式的系数
    const trace = a + d; // 迹
    const det = a * d - b * b; // 行列式

    // 计算特征值 (lambda)
    const discriminant = Math.sqrt(trace * trace - 4 * det);
    const lambda1 = (trace + discriminant) / 2;
    const lambda2 = (trace - discriminant) / 2;

    // 计算特征向量
    let v1: number[];
    let v2: number[];

    if (Math.abs(b) < float_accuracy) {
        v1 = [1, 0];
        v2 = [0, 1];
    } else {
        v1 = [lambda1 - d, b];
        v2 = [lambda2 - d, b];
    }

    // 归一化特征向量
    const norm1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
    const norm2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
    v1 = [v1[0] / norm1, v1[1] / norm1];
    v2 = [v2[0] / norm2, v2[1] / norm2];

    // 构建 V 和 Lambda
    const V = [
        v1[0], v1[1], v2[0], v2[1]
    ];
    const Lambda = [lambda1, lambda2];

    return { V, Lambda };
}

function polarDecomposition(A: number[]) {
    // 计算A的转置
    const AT = transpose2x2(A);

    // 计算ATA
    const ATA = multi2x2(AT, A);

    // 计算ATA的特征值分解（Eigendecomposition）
    const eigen = eigenDecomposition(ATA);
    const V = eigen.V;
    const Lambda = eigen.Lambda;

    // 构建对角矩阵的平方根
    const sqrtLambdaMatrix = [
        Math.sqrt(Lambda[0]), 0, 0, Math.sqrt(Lambda[1])
    ];

    const S = multi2x2(
        multi2x2(V, sqrtLambdaMatrix),
        transpose2x2(V)
    );

    const R = multi2x2(
        A,
        inverse2x2(S)
    );

    const scale = { x: sqrtLambdaMatrix[0], y: sqrtLambdaMatrix[3] }

    return { S, R, scale, sqrtLambdaMatrix, eigen };
}

function inverse2x2(m: number[]) {
    const d = m[0] * m[3] - m[1] * m[2];
    return [
        m[3] / d, - m[1] / d,
        - m[2] / d, m[0] / d,
    ]
}

type Decompose = {
    T: number[];
    S: number[];
    R: number[];
    eigen: { V: number[], Lambda: number[] };
    sqrtLambdaMatrix: number[];
    scale: { x: number, y: number };
    translate: { x: number, y: number };
    rotate: number;
}

// 极分解，
function decomposition(A: number[]): Decompose {
    const { S, R, scale, sqrtLambdaMatrix, eigen } = polarDecomposition(A);
    const T = [1, 0, 0, 1, A[4], A[5]];
    S[4] = 0;
    S[5] = 0;
    R[4] = 0;
    R[5] = 0;
    // S2[4] = 0;
    // S2[5] = 0;
    // A = TRS
    const rotate = Math.atan2(R[1], R[0])
    return { T, S, R, scale, sqrtLambdaMatrix, eigen, translate: { x: A[4], y: A[5] }, rotate };
}

function vector_dot(vector1: number[], vector2: number[]) { // 点积
    if (vector1.length !== vector2.length) throw new Error("dimension not match")
    let result = 0
    for (let i = 0, len = vector1.length; i < len; ++i) result += vector1[i] * vector2[i];
    return result
}

function vector_cross3(vector1: number[], vector2: number[]) { // 叉积
    if (vector1.length !== vector2.length) throw new Error("dimension not match")
    if (vector1.length !== 3) throw new Error("dimension not support")
    return [
        vector1[1] * vector2[2] - vector1[2] * vector2[1],
        vector1[2] * vector2[0] - vector1[0] * vector2[2],
        vector1[0] * vector2[1] - vector1[1] * vector2[0]
    ]
}

function vector_norm(vector: number[]) { // 模
    return Math.sqrt(vector_dot(vector, vector))
}

function vector_angleTo(vector1: number[], vector2: number[]) { // 本向量与目标向量的夹角（0 ~ π）
    if (vector1.length !== vector2.length) throw new Error("dimension not match")
    const dot = vector_dot(vector1, vector2) // 本向量与目标向量的点积
    return Math.acos(dot / (vector_norm(vector1) * vector_norm(vector2)))
}

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

    multiAtLeft(m: number[]): Matrix
    multiAtLeft(m: Matrix): Matrix
    multiAtLeft(m: any): Matrix { // 左乘 this = m * this
        const m0 = this.m_matrix;
        const mm = m instanceof Matrix ? m.m_matrix : m;
        this.m_matrix = __multi(mm, m0);
        return this
    }

    multi(m: number[]): Matrix
    multi(m: Matrix): Matrix
    multi(m: any): Matrix { // 右乘 this = this * m
        const m0 = this.m_matrix;
        const mm = m instanceof Matrix ? m.m_matrix : m;
        this.m_matrix = __multi(m0, mm);
        return this;
    }

    trans(x: number, y: number) {
        this.multiAtLeft([1, 0, 0, 1, x, y]);
    }
    preTrans(x: number, y: number) {
        this.multi([1, 0, 0, 1, x, y]);
    }
    scale(s: number): Matrix;
    scale(sx: number, sy: number): Matrix;
    scale(sx: number, sy?: number) {
        this.multiAtLeft([sx, 0, 0, sy ?? sx, 0, 0]);
        return this
    }
    preScale(s: number): void;
    preScale(sx: number, sy: number): void;
    preScale(sx: number, sy?: number) {
        this.multi([sx, 0, 0, sy ?? sx, 0, 0]);
    }
    skewX(radians: number) {
        this.multiAtLeft([1, 0, Math.tan(radians), 1, 0, 0]);
    }
    scaleX(sx: number) {
        this.multiAtLeft([sx, 0, 0, 1, 0, 0]);
    }
    scaleY(sy: number) {
        this.multiAtLeft([1, 0, 0, sy, 0, 0]);
    }
    /** 
     * @radians x轴向右，y轴坐标向下，顺时针方向，0-2pi 
     * @x @y 旋转中心点
     * */
    rotate(radians: number): Matrix;
    rotate(radians: number, x: number, y: number): Matrix;
    rotate(radians: number, x?: number, y?: number) {
        if (x || y) this.trans(-(x || 0), -(y || 0));
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        this.multiAtLeft([cos, sin, -sin, cos, 0, 0])
        if (x || y) this.trans(x || 0, y || 0);
        return this;
    }
    map(point: { x: number, y: number }): { x: number, y: number };
    map(x: number, y: number): { x: number, y: number };
    map(pointOrX: number | { x: number, y: number }, _y?: number) {
        const isPoint = typeof pointOrX === 'object';
        const x = isPoint ? pointOrX.x : pointOrX;
        const y = isPoint ? pointOrX.y : _y!;
        const m = this.m_matrix
        return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
    }
    /**
     * @deprecated use map instead
     * @param point 
     */
    computeCoord(point: { x: number, y: number }): { x: number, y: number };
    computeCoord(x: number, y: number): { x: number, y: number };
    computeCoord(pointOrX: number | { x: number, y: number }, _y?: number) {
        return this.map(pointOrX as any, _y as any)
    }
    computeCoord2(x: number, y: number): { x: number, y: number } {
        const m = this.m_matrix
        return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
    }
    computeCoord3(p: { x: number, y: number }): { x: number, y: number } {
        const m = this.m_matrix, x = p.x, y = p.y;
        return { x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] };
    }
    computeRef(dx: number, dy: number) {
        const m = this.m_matrix
        return { x: m[0] * dx + m[2] * dy, y: m[1] * dx + m[3] * dy };
    }

    getInverse() {
        return new Matrix(this.inverse)
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

    toArray(): [number, number, number, number, number, number] {
        return this.m_matrix.slice(0) as [number, number, number, number, number, number];
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

    // get col0() {
    //     return [this.m_matrix[0], this.m_matrix[1], 0];
    // }
    // get col1() {
    //     return [this.m_matrix[2], this.m_matrix[3], 0];
    // }
    // get col2() {
    //     return [this.m_matrix[4], this.m_matrix[5], 1];
    // }

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
    isValid() {
        const m = this.m_matrix;
        for (let i = 0, len = m.length; i < len; i++) {
            const x = m[i];
            if (Number.isNaN(x) || (!Number.isFinite(x))) return false;
        }
        return true;
    }
    checkValid() {
        if (!this.isValid()) throw new Error("Wrong Matrix: " + this.m_matrix);
    }

    clone() {
        return new Matrix(this)
    }

    // decompose(): Decompose {
    //     return decomposition(this.m_matrix);
    // }

    // static clearScale(d: Decompose): Matrix {
    //     // TRS
    //     const sqrtLambdaMatrix = d.sqrtLambdaMatrix
    //     const V = d.eigen.V
    //     const savg = Math.sqrt(sqrtLambdaMatrix[0] * sqrtLambdaMatrix[3]);
    //     const S2 = multi2x2(
    //         multi2x2(V, [sqrtLambdaMatrix[0] / savg, 0, 0, sqrtLambdaMatrix[3] / savg]),
    //         transpose2x2(V)
    //     );
    //     const SR = multi2x2(d.R, S2)
    //     return new Matrix([SR[0], SR[1], SR[2], SR[3], d.T[4], d.T[5]])
    // }

    // static clearSkew(d: Decompose): Matrix {
    //     // TRS
    //     const sqrtLambdaMatrix = d.sqrtLambdaMatrix
    //     const V = d.eigen.V
    //     const savg = Math.sqrt(sqrtLambdaMatrix[0] * sqrtLambdaMatrix[3]);
    //     const S2 = multi2x2(
    //         multi2x2(V, [savg, 0, 0, savg]),
    //         transpose2x2(V)
    //     );
    //     const SR = multi2x2(d.R, S2)
    //     return new Matrix([SR[0], SR[1], SR[2], SR[3], d.T[4], d.T[5]])
    // }

    // static clearSkewAndScale(d: Decompose): Matrix {
    //     // TRS
    //     const SR = d.R; // multi2x2(d.R, S2)
    //     return new Matrix([SR[0], SR[1], SR[2], SR[3], d.T[4], d.T[5]])
    // }

    // static setScale(d: Decompose, scale: {x: number, y: number}): Matrix {
    //     const V = d.eigen.V
    //     const S2 = multi2x2(
    //         multi2x2(V, [scale.x, 0, 0, scale.y]),
    //         transpose2x2(V)
    //     );
    //     const SR = multi2x2(d.R, S2)
    //     return new Matrix([SR[0], SR[1], SR[2], SR[3], d.T[4], d.T[5]])
    // }

    transform(point: { x: number, y: number }): { x: number, y: number }
    transform(point: { x: number, y: number }[]): { x: number, y: number }[]
    transform(point: { x: number, y: number } | { x: number, y: number }[]) {
        const m = this.m_matrix
        const map = (p: { x: number, y: number }) => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
        if (Array.isArray(point)) return point.map(map);
        else return map(point);
    }
}
