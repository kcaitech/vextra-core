import { Matrix } from "../basic/matrix";
import * as classes from "./baseclasses"
import { float_accuracy } from "../basic/consts";
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
    }
    clone(): Transform {
        const m = this;
        return new Transform(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12);
    }

    // matrix
    multiAtLeft(m: classes.Transform | Matrix): void { // 左乘 this = m * this
        __multi(m, this, this);
    }

    multi(m: classes.Transform | Matrix): void { // 右乘 this = this * m
        __multi(this, m, this);
    }

    trans(x: number, y: number) {
        this.multiAtLeft(_tmp(1, 0, 0, 1, x, y));
    }
    preTrans(x: number, y: number) {
        this.multi(_tmp(1, 0, 0, 1, x, y));
    }
    transTo(x: number, y: number) {
        const origin = this.computeCoord(0, 0);
        const dx = x - origin.x;
        const dy = y - origin.y;
        this.trans(dx, dy);
    }
    scale(s: number): void;
    scale(sx: number, sy: number): void;
    scale(sx: number, sy?: number) {
        this.multiAtLeft(_tmp(sx, 0, 0, sy ?? sx, 0, 0));
    }
    preScale(s: number): void;
    preScale(sx: number, sy: number): void;
    preScale(sx: number, sy?: number) {
        this.multi(_tmp(sx, 0, 0, sy ?? sx, 0, 0));
    }
    skewX(radians: number) {
        this.multiAtLeft(_tmp(1, 0, Math.tan(radians), 1, 0, 0));
    }
    scaleX(sx: number) {
        this.multiAtLeft(_tmp(sx, 0, 0, 1, 0, 0));
    }
    scaleY(sy: number) {
        this.multiAtLeft(_tmp(1, 0, 0, sy, 0, 0));
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
        this.multiAtLeft(_tmp(cos, sin, -sin, cos, 0, 0))
        if (x || y) this.trans(x || 0, y || 0);
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
    }

    flipHoriz(cx?: number) {
        if (cx) this.trans(-cx, 0);
        this.multiAtLeft(_tmp(-1, 0, 0, 1, 0, 0)) // x = -x
        if (cx) this.trans(cx, 0);
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
}
