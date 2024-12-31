import { Matrix } from "../basic/matrix";
import * as classes from "./baseclasses"
import { float_accuracy } from "../basic/consts";
import { ColVector3D } from "../basic/matrix2";

function __multi(lhs: classes.Transform | Matrix, rhs: classes.Transform | Matrix, result: classes.Transform): void {
    const m00 = lhs.m00 * rhs.m00 + lhs.m01 * rhs.m10;
    const m10 = lhs.m10 * rhs.m00 + lhs.m11 * rhs.m10;
    const m01 = lhs.m00 * rhs.m01 + lhs.m01 * rhs.m11;
    const m11 = lhs.m10 * rhs.m01 + lhs.m11 * rhs.m11;
    const m02 = lhs.m00 * rhs.m02 + lhs.m01 * rhs.m12 + lhs.m02;
    const m12 = lhs.m10 * rhs.m02 + lhs.m11 * rhs.m12 + lhs.m12;
    result.m00 = m00;
    result.m01 = m01;
    result.m02 = m02;
    result.m10 = m10;
    result.m11 = m11;
    result.m12 = m12;
}
const __tmp: classes.Transform = new classes.Transform();
function _tmp(m00: number, m10: number, m01: number, m11: number, m02: number, m12: number) {
    __tmp.m00 = m00;
    __tmp.m01 = m01;
    __tmp.m02 = m02;
    __tmp.m10 = m10;
    __tmp.m11 = m11;
    __tmp.m12 = m12;
    return __tmp;
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

export class Transform extends classes.Transform {

    static from = function (m: Matrix | number[]) {
        if (Array.isArray(m)) return new Transform(m[0], m[2], m[4], m[1], m[3], m[5]);
        return new Transform(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12);
    }

    toMatrix() {
        const t = this;
        return new Matrix(t.m00, t.m10, t.m01, t.m11, t.m02, t.m12);
    }

    get translateX() {
        return this.m02;
    }

    set translateX(x: number) {
        this.m02 = x;
    }

    get translateY() {
        return this.m12;
    }

    set translateY(y: number) {
        this.m12 = y;
    }

    equals(t: Transform | Matrix) {
        return Math.abs(this.m00 - t.m00) <= float_accuracy &&
            Math.abs(this.m01 - t.m01) <= float_accuracy &&
            Math.abs(this.m02 - t.m02) <= float_accuracy &&
            Math.abs(this.m10 - t.m10) <= float_accuracy &&
            Math.abs(this.m11 - t.m11) <= float_accuracy &&
            Math.abs(this.m12 - t.m12) <= float_accuracy;
    }
    reset(t?: Transform | Matrix) {
        if (t) {
            this.m00 = t.m00;
            this.m01 = t.m01;
            this.m02 = t.m02;
            this.m10 = t.m10;
            this.m11 = t.m11;
            this.m12 = t.m12;
        } else {
            this.m00 = 1;
            this.m01 = 0;
            this.m02 = 0;
            this.m10 = 0;
            this.m11 = 1;
            this.m12 = 0;
        }
        return this
    }
    clone(): Transform {
        const m = this;
        return new Transform(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12);
    }

    // matrix
    multiAtLeft(m: classes.Transform | Matrix): Transform { // 左乘 this = m * this
        __multi(m, this, this);
        return this
    }

    multi(m: classes.Transform | Matrix): Transform { // 右乘 this = this * m
        __multi(this, m, this);
        return this
    }

    trans(x: number, y: number) {
        this.multiAtLeft(_tmp(1, 0, 0, 1, x, y));
        return this
    }
    preTrans(x: number, y: number) {
        this.multi(_tmp(1, 0, 0, 1, x, y));
        return this
    }
    transTo(x: number, y: number) {
        const origin = this.computeCoord(0, 0);
        const dx = x - origin.x;
        const dy = y - origin.y;
        this.trans(dx, dy);
        return this
    }
    scale(s: number): Transform;
    scale(sx: number, sy: number): Transform;
    scale(sx: number, sy?: number) {
        this.multiAtLeft(_tmp(sx, 0, 0, sy ?? sx, 0, 0));
        return this
    }
    preScale(s: number): Transform;
    preScale(sx: number, sy: number): Transform;
    preScale(sx: number, sy?: number) {
        this.multi(_tmp(sx, 0, 0, sy ?? sx, 0, 0));
        return this
    }
    skewX(radians: number) {
        this.multiAtLeft(_tmp(1, 0, Math.tan(radians), 1, 0, 0));
        return this
    }
    scaleX(sx: number) {
        this.multiAtLeft(_tmp(sx, 0, 0, 1, 0, 0));
        return this
    }
    scaleY(sy: number) {
        this.multiAtLeft(_tmp(1, 0, 0, sy, 0, 0));
        return this
    }
    /** 
     * @radians x轴向右，y轴坐标向下，顺时针方向，0-2pi 
     * @x @y 旋转中心点
     * */
    rotate(radians: number): Transform;
    rotate(radians: number, x: number, y: number): Transform;
    rotate(radians: number, x?: number, y?: number) {
        if (x || y) this.trans(-(x || 0), -(y || 0));
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        this.multiAtLeft(_tmp(cos, sin, -sin, cos, 0, 0))
        if (x || y) this.trans(x || 0, y || 0);
        return this
    }
    computeCoord(point: { x: number, y: number }): { x: number, y: number };
    computeCoord(x: number, y: number): { x: number, y: number };
    computeCoord(pointOrX: number | { x: number, y: number }, _y?: number) {
        const isPoint = typeof pointOrX === 'object';
        const x = isPoint ? pointOrX.x : pointOrX;
        const y = isPoint ? pointOrX.y : _y!;
        return { x: this.m00 * x + this.m01 * y + this.m02, y: this.m10 * x + this.m11 * y + this.m12 };
    }
    computeCoord2(x: number, y: number): { x: number, y: number } {
        return { x: this.m00 * x + this.m01 * y + this.m02, y: this.m10 * x + this.m11 * y + this.m12 };
    }
    computeCoord3(p: { x: number, y: number }): { x: number, y: number } {
        const x = p.x, y = p.y;
        return { x: this.m00 * x + this.m01 * y + this.m02, y: this.m10 * x + this.m11 * y + this.m12 };
    }
    computeRef(dx: number, dy: number) {
        return { x: this.m00 * dx + this.m01 * dy, y: this.m10 * dx + this.m11 * dy };
    }
    transform(point: { x: number, y: number }): { x: number, y: number }
    transform(point: { x: number, y: number }[]): { x: number, y: number }[]
    transform(point: { x: number, y: number } | { x: number, y: number }[]) {
        const map = (p: { x: number, y: number }) => ({ x: this.m00 * p.x + this.m01 * p.y + this.m02, y: this.m10 * p.x + this.m11 * p.y + this.m12 });
        if (Array.isArray(point)) return point.map(map);
        else return map(point);
    }

    getInverse() {
        return this.inverse
    }

    get inverse() {
        const m = [this.m00, this.m10, this.m01, this.m11, this.m02, this.m12]
        const d = m[0] * m[3] - m[1] * m[2];
        return Transform.from([
            m[3] / d, - m[1] / d,
            - m[2] / d, m[0] / d,
            (m[2] * m[5] - m[4] * m[3]) / d,
            (m[1] * m[4] - m[5] * m[0]) / d
        ]);
    }
    inverseCoord(point: { x: number, y: number }): { x: number, y: number };
    inverseCoord(x: number, y: number): { x: number, y: number };
    inverseCoord(pointOrX: number | { x: number, y: number }, _y?: number) {
        const isPoint = typeof pointOrX === 'object';
        const x = isPoint ? pointOrX.x : pointOrX;
        const y = isPoint ? pointOrX.y : _y!;
        const m = this.inverse
        return { x: m.m00 * x + m.m01 * y + m.m02, y: m.m10 * x + m.m11 * y + m.m12 };
    }
    inverseRef(dx: number, dy: number) {
        const m = this.inverse
        return { x: m.m00 * dx + m.m01 * dy, y: m.m10 * dx + m.m11 * dy };
    }

    toString() {
        return 'matrix(' + this.toArray().join(',') + ')';
    }
    toArray() {
        return [this.m00, this.m10, this.m01, this.m11, this.m02, this.m12]
    }

    flipVert(cy?: number) {
        if (cy) this.trans(0, -cy);
        this.multiAtLeft(_tmp(1, 0, 0, -1, 0, 0)) // y = -y
        if (cy) this.trans(0, cy);
        return this
    }

    flipHoriz(cx?: number) {
        if (cx) this.trans(-cx, 0);
        this.multiAtLeft(_tmp(-1, 0, 0, 1, 0, 0)) // x = -x
        if (cx) this.trans(cx, 0);
        return this
    }

    get identity() {
        return Transform.from([1, 0, 0, 1, 0, 0]);
    }
    isIdentity() {
        const identity = [1, 0, 0, 1, 0, 0];
        const m = this.toArray();
        for (let i = 0, len = m.length; i < len; i++) {
            if (Math.abs(m[i] - identity[i]) > float_accuracy) return false;
        }
        return true;
    }
    isValid() {
        const m = this.toArray();
        for (let i = 0, len = m.length; i < len; i++) {
            const x = m[i];
            if (Number.isNaN(x) || (!Number.isFinite(x))) return false;
        }
        return true;
    }
    checkValid() {
        if (!this.isValid()) throw new Error("Wrong Matrix: " + this.toString());
    }

    
    decompose() {

        const col0 = [this.m00, this.m10, 0]
        const col1 = [this.m01, this.m11, 0]
        const col2 = [0, 0, 1]

        // z轴预期方向（x轴与y轴的叉积，为xoy平面的法向量，其方向与z轴预期方向一致）
        const expectedZ = vector_cross3(col0, col1)
        // z轴与z轴预期方向的点积
        const zDot = vector_dot(expectedZ, col2)
        // z轴与预期方向相反，说明有一个或有三个坐标轴反向，这里认为是y轴反向，后续通过旋转来对齐
        // 反向会在后续被算入缩放矩阵中
        const isYFlipped = zDot < 0
        // x轴与y轴的夹角（0 ~ π）
        let angleXY = vector_angleTo(col0, col1)
        if (isYFlipped) {
            angleXY = Math.PI - angleXY // 反向前的夹角
        }

        // 斜切
        const yAngle = angleXY - 0.5 * Math.PI // y轴（绕z轴预期方向）旋转角度（-π/2 ~ π/2）
        const skewMatrix = new Transform(1, -Math.sin(yAngle), 0, 0, Math.cos(yAngle), 0)

        // 缩放
        const xNorm = vector_norm(col0)
        const yNorm = vector_norm(col1) * (isYFlipped ? -1 : 1)
        const scaleMatrix = (new Transform(xNorm, 0, 0, 0, yNorm, 0))

        // 旋转
        const rotateMatrix = new Transform(this.m00, this.m01, 0, this.m10, this.m11, 0)
        if (!scaleMatrix.isIdentity()) rotateMatrix.multi(scaleMatrix.inverse);    // ·(S^-1)
        if (!skewMatrix.isIdentity()) rotateMatrix.multi(skewMatrix.inverse);      // ·(K^-1)

        // 平移
        const translateMatrix = new Transform(1, 0, this.m02, 0, 1, this.m12)

        return {
            translate: translateMatrix,
            rotate: rotateMatrix,
            skew: skewMatrix,
            scale: scaleMatrix,
        }
    }

    decomposeEuler() { // 通过旋转矩阵分解出欧拉角（ZXY序），返回值的单位为弧度
        const matrix = this.decompose().rotate
        const z = Math.atan2(-matrix.m01, matrix.m11)
        return new ColVector3D([0, 0, z])
    }

    // clearScaleSize() {
    //     const d = this.decompose()
    //     const m = d.translate.multiAtLeft(d.rotate).multiAtLeft(d.skew)
    //     this.reset(m)
    // }

    clearScale(): { x: number, y: number } {
        const d = this.decompose()
        const m = d.translate.multiAtLeft(d.rotate).multiAtLeft(d.skew)
        this.reset(m)
        return { x: d.scale.m00, y: d.scale.m11 }
    }
}
