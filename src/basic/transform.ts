/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {ColVector3D, Matrix, Matrix3DKeysType} from "./matrix2"
import {NumberArray2D} from "./number_array"
import {isZero} from "./number_utils"

function hasSkewZ(matrix: Matrix) { // 验证矩阵是否存在Z轴斜切
    return matrix.col0.dot(matrix.col2) !== 0 || matrix.col1.dot(matrix.col2) !== 0
}

export enum TransformMode { // 变换模式
    Local, // 局部模式，不同变换（缩放、斜切、旋转、平移）之间互不影响
    Global, // 全局模式，不同变换之间相互影响
}

// 重写子变换矩阵的部分方法，优化性能

export class TranslateMatrix extends Matrix { // 平移矩阵
    getInverse(): Matrix | undefined {
        return new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, -this.m03,
            0, 1, 0, -this.m13,
            0, 0, 1, -this.m23,
            0, 0, 0, 1,
        ], true))
    }

    multiply(matrix: Matrix) {
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (n0 !== m1) throw new Error("矩阵阶数不匹配，无法相乘");

        return Matrix.FromMatrix(matrix.clone().add(this.col3.deleteRow(3), [0, 3]))
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof TranslateMatrix) return matrix;
        return new TranslateMatrix(matrix.data)
    }

    buildMatrix() {
        return new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, this.m03,
            0, 1, 0, this.m13,
            0, 0, 1, this.m23,
            0, 0, 0, 1,
        ], true))
    }
}

export class RotateMatrix extends Matrix { // 旋转矩阵
    getInverse(): Matrix | undefined {
        if (isZero(this.m20) && isZero(this.m21) && isZero(this.m02) && isZero(this.m12)) { // 退化为二维旋转矩阵
            const det = this.m00 * this.m11 - this.m01 * this.m10
            if (isZero(det)) return; // 行列式为0，矩阵不可逆
            return new Matrix(new NumberArray2D([4, 4], [
                this.m11 / det, -this.m01 / det, 0, 0,
                -this.m10 / det, this.m00 / det, 0, 0,
                0, 0, 1 / this.m22, 0,
                0, 0, 0, 1,
            ], true))
        }
        return super.getInverse()
    }

    multiply(matrix: Matrix) {
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (n0 !== m1) throw new Error("矩阵阶数不匹配，无法相乘");

        // 分块矩阵相乘
        const R0 = this.subMatrix([3, 3])
        matrix.clone().multiplyLeftSubMatrix(R0)
            .multiplyLeftSubMatrix(R0, [3, 1], [0, 3])
        return Matrix.FromMatrix(matrix)
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof RotateMatrix) return matrix;
        return new RotateMatrix(matrix.data)
    }

    buildMatrix() {
        return new Matrix(new NumberArray2D([4, 4], [
            this.m00, this.m01, this.m02, 0,
            this.m10, this.m11, this.m12, 0,
            this.m20, this.m21, this.m22, 0,
            0, 0, 0, 1,
        ], true))

    }
}

export class ScaleMatrix extends Matrix { // 缩放矩阵
    getInverse(): Matrix | undefined {
        return new Matrix(new NumberArray2D([4, 4], [
            1 / this.m00, 0, 0, 0,
            0, 1 / this.m11, 0, 0,
            0, 0, 1 / this.m22, 0,
            0, 0, 0, 1,
        ], true))
    }

    multiply(matrix: Matrix) {
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (n0 !== m1) throw new Error("矩阵阶数不匹配，无法相乘");

        const sX = this.m00, sY = this.m11, sZ = this.m11
        return new Matrix(new NumberArray2D([4, 4], [
            sX * matrix.m00, sX * matrix.m01, sX * matrix.m02, sX * matrix.m03,
            sY * matrix.m10, sY * matrix.m11, sY * matrix.m12, sY * matrix.m13,
            sZ * matrix.m20, sZ * matrix.m21, sZ * matrix.m22, sZ * matrix.m23,
            0, 0, 0, 1,
        ], true))
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof ScaleMatrix) return matrix;
        return new ScaleMatrix(matrix.data)
    }

    buildMatrix() {
        return new Matrix(new NumberArray2D([4, 4], [
            this.m00, 0, 0, 0,
            0, this.m11, 0, 0,
            0, 0, this.m22, 0,
            0, 0, 0, 1,
        ], true))
    }
}

export class Transform { // 变换
    /** 变换矩阵
     * | a b c tx |         |         |   |
     * | d e f ty | ------> |  R·K·S  | T |
     * | g h i tz | ------> |_________|___|
     * | 0 0 0 1  |         |    0    | 1 |
     */
    matrix: Matrix

    // 变换顺序：缩放、斜切、旋转、平移 -> Transform = T·R·K·S
    translateMatrix: TranslateMatrix // 平移矩阵 T
    rotateMatrix: RotateMatrix // 旋转矩阵 R
    skewMatrix: Matrix // 斜切矩阵 K
    scaleMatrix: ScaleMatrix // 缩放矩阵 S

    // 修改回调
    onChange: (transform: Transform) => void = () => {
    }

    // 分解操作的缓存
    decomposeTranslateCache: ColVector3D | undefined = undefined
    decomposeEulerCache: ColVector3D | undefined = undefined
    decomposeSkewCache: {
        x: {
            axis: ColVector3D,
            angle: number,
        },
        y: {
            axis: ColVector3D,
            angle: number,
        },
        z: {
            axis: ColVector3D,
            angle: number,
        },
    } | undefined = undefined
    decomposeScaleCache: ColVector3D | undefined = undefined

    // 逆矩阵的缓存
    inverseCache: Transform | undefined = undefined

    clearDecomposeCache() {
        this.decomposeTranslateCache = undefined
        this.decomposeEulerCache = undefined
        this.decomposeSkewCache = undefined
        this.decomposeScaleCache = undefined
    }

    clearInverseCache() {
        this.inverseCache = undefined
    }

    clearCache() {
        this.clearDecomposeCache()
        this.clearInverseCache()
    }

    // 借助set isMatrixLatest=false和set isSubMatrixLatest=false来清除缓存
    // 当矩阵更新时，必须将其中一个设为false
    _isMatrixLatest: boolean = true // matrix为最新
    _isSubMatrixLatest: boolean = true // T、R、K、S子矩阵是否为最新

    get isMatrixLatest() {
        return this._isMatrixLatest
    }

    set isMatrixLatest(value: boolean) {
        if (!value) this.clearCache();
        this._isMatrixLatest = value
    }

    get isSubMatrixLatest() {
        return this._isSubMatrixLatest
    }

    set isSubMatrixLatest(value: boolean) {
        if (!value) this.clearCache();
        this._isSubMatrixLatest = value
    }

    updateMatrix() { // 根据matrix分解出T、R、K、S子矩阵，或根据T、R、K、S子矩阵计算出matrix
        if (this.isMatrixLatest && this.isSubMatrixLatest) return;
        // if (!this.isMatrixLatest && !this.isSubMatrixLatest) throw new Error("矩阵数据错误：isMatrixLatest与isSubMatrixLatest同时为false");
        if (!this.isMatrixLatest) { // 根据T、R、K、S子矩阵计算matrix
            // matrix = T·R·K·S
            this.matrix = this.translateMatrix.clone().multiply(this.rotateMatrix).multiply(this.skewMatrix).multiply(this.scaleMatrix)
        } else { // 根据matrix分解T、R、K、S子矩阵
            // 平移
            this.translateMatrix = TranslateMatrix.FromMatrix(Matrix.BuildIdentity([4, 3]).insertCols(this.matrix.col3))

            const matrix3x3 = this.matrix.clone().resize([3, 3])
            // z轴预期方向（x轴与y轴的叉积，为xoy平面的法向量，其方向与z轴预期方向一致）
            let expectedZ = matrix3x3.col0.cross(matrix3x3.col1) as ColVector3D
            // z轴与z轴预期方向的点积
            const zDot = expectedZ.dot(matrix3x3.col2)
            // z轴与预期方向相反，说明有一个或有三个坐标轴反向，这里认为是y轴反向，后续通过旋转来对齐
            // 反向会在后续被算入缩放矩阵中
            const isYFlipped = zDot < 0
            // x轴与y轴的夹角（0 ~ π）
            let angleXY = matrix3x3.col0.angleTo(matrix3x3.col1)
            if (isYFlipped) {
                angleXY = Math.PI - angleXY // 反向前的夹角
                expectedZ.negate()
            }

            // 斜切
            const yAngle = angleXY - 0.5 * Math.PI // y轴（绕z轴预期方向）旋转角度（-π/2 ~ π/2）
            const {x: zX, y: zY, z: zZ} = expectedZ.cross(matrix3x3.col2) as ColVector3D // z轴的旋转轴
            const zAngle = expectedZ.angleTo(matrix3x3.col2) // z轴旋转角度（-π ~ π）
            // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate3d#syntax
            const zS = Math.sin(zAngle)
            const zT = 1 - Math.cos(zAngle)
            this.skewMatrix = new Matrix(new NumberArray2D([4, 4], [
                1, -Math.sin(yAngle), -zY * zS + zX * zZ * zT, 0,
                0, Math.cos(yAngle), zX + zY * zZ * zT, 0,
                0, 0, 1 + zT * (zZ ** 2 - 1), 0,
                0, 0, 0, 1,
            ], true))

            // 缩放
            const xNorm = this.matrix.col0.norm
            const yNorm = this.matrix.col1.norm * (isYFlipped ? -1 : 1)
            const zNorm = this.matrix.col2.norm
            this.scaleMatrix = ScaleMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
                xNorm, 0, 0, 0,
                0, yNorm, 0, 0,
                0, 0, zNorm, 0,
                0, 0, 0, 1,
            ], true)))

            // 旋转
            // R = (T^-1)·Transform·(S^-1)·(K^-1)
            const temp = this.translateMatrix.isIdentity ? this.matrix.clone() : this.translateMatrix.getInverse()!.multiply(this.matrix) // (T^-1)·Transform
            if (!this.scaleMatrix.isIdentity) temp.multiply(this.scaleMatrix.getInverse()!);    // ·(S^-1)
            if (!this.skewMatrix.isIdentity) temp.multiply(this.skewMatrix.getInverse()!);      // ·(K^-1)
            this.rotateMatrix = RotateMatrix.FromMatrix(temp)
        }
        this.isMatrixLatest = true
        this.isSubMatrixLatest = true
    }

    constructor(params?: {
        matrix?: Matrix,
        subMatrix?: {
            translate: Matrix,
            rotate: Matrix,
            skew: Matrix,
            scale: Matrix,
        },
    }) {
        this.matrix = params?.matrix || Matrix.BuildIdentity([4, 4])
        if (this.matrix.rowCount !== 4 || this.matrix.colCount !== 4) throw new Error("矩阵数据错误：matrix不是4x4矩阵")

        this.translateMatrix = TranslateMatrix.FromMatrix(params?.subMatrix?.translate || Matrix.BuildIdentity([4, 4]))
        if (this.translateMatrix.rowCount !== 4 || this.translateMatrix.colCount !== 4) throw new Error("矩阵数据错误：translateMatrix必须为4x4矩阵")

        this.rotateMatrix = RotateMatrix.FromMatrix(params?.subMatrix?.rotate || Matrix.BuildIdentity([4, 4]))
        if (this.rotateMatrix.rowCount !== 4 || this.rotateMatrix.colCount !== 4) throw new Error("矩阵数据错误：rotateMatrix必须为4x4矩阵")

        this.skewMatrix = params?.subMatrix?.skew || Matrix.BuildIdentity([4, 4])
        if (this.skewMatrix.rowCount !== 4 || this.skewMatrix.colCount !== 4) throw new Error("矩阵数据错误：skewMatrix必须为4x4矩阵")

        this.scaleMatrix = ScaleMatrix.FromMatrix(params?.subMatrix?.scale || Matrix.BuildIdentity([4, 4]))
        if (this.scaleMatrix.rowCount !== 4 || this.scaleMatrix.colCount !== 4) throw new Error("矩阵数据错误：scaleMatrix必须为4x4矩阵")

        if (params?.matrix || params?.subMatrix) {
            this.isMatrixLatest = !!params?.matrix
            this.isSubMatrixLatest = !!params?.subMatrix
            // if (this.isMatrixLatest && hasSkewZ(this.matrix)) throw new Error("矩阵数据错误：matrix存在Z轴斜切");
            // if (this.isSubMatrixLatest && hasSkewZ(this.skewMatrix)) throw new Error("矩阵数据错误：skewMatrix存在Z轴斜切");
        }
    }

    clone(): this {
        this.updateMatrix()

        const transform = new (this.constructor as any)({
            matrix: this.matrix.clone(),
            subMatrix: {
                translate: this.translateMatrix.clone(),
                rotate: this.rotateMatrix.clone(),
                skew: this.skewMatrix.clone(),
                scale: this.scaleMatrix.clone(),
            },
        })

        transform.decomposeTranslateCache = this.decomposeTranslateCache?.clone()
        transform.decomposeEulerCache = this.decomposeEulerCache?.clone()
        transform.decomposeScaleCache = this.decomposeScaleCache?.clone()
        transform.inverseCache = this.inverseCache?.clone()

        if (this.decomposeSkewCache) {
            transform.decomposeSkewCache = {
                x: {
                    axis: this.decomposeSkewCache.x.axis.clone(),
                    angle: this.decomposeSkewCache.x.angle,
                },
                y: {
                    axis: this.decomposeSkewCache.y.axis.clone(),
                    angle: this.decomposeSkewCache.y.angle,
                },
                z: {
                    axis: this.decomposeSkewCache.z.axis.clone(),
                    angle: this.decomposeSkewCache.z.angle,
                },
            }
        }

        return transform
    }

    equals(transform: Transform) {
        let matrixLatestMask = this.isMatrixLatest && transform.isMatrixLatest
        let subMatrixLatestMask = this.isSubMatrixLatest && transform.isSubMatrixLatest

        if (!matrixLatestMask && !subMatrixLatestMask) this.updateMatrix();

        matrixLatestMask = this.isMatrixLatest && transform.isMatrixLatest
        subMatrixLatestMask = this.isSubMatrixLatest && transform.isSubMatrixLatest

        if (matrixLatestMask) {
            return this.matrix.equals(transform.matrix)
        } else {
            return this.translateMatrix.equals(transform.translateMatrix)
                && this.rotateMatrix.equals(transform.rotateMatrix)
                && this.skewMatrix.equals(transform.skewMatrix)
                && this.scaleMatrix.equals(transform.scaleMatrix)
        }
    }

    reset() {
        this.matrix = Matrix.BuildIdentity([4, 4])
        this.translateMatrix = TranslateMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.rotateMatrix = RotateMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.skewMatrix = Matrix.BuildIdentity([4, 4])
        this.scaleMatrix = ScaleMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.isMatrixLatest = true
        this.isSubMatrixLatest = true
        this.onChange(this)
    }

    setMatrix(matrix: Matrix) {
        if (matrix.rowCount !== 4 || matrix.colCount !== 4) throw new Error("矩阵数据错误：matrix不是4x4矩阵")
        this.matrix = matrix
        this.isMatrixLatest = true
        this.isSubMatrixLatest = false
        this.onChange(this)
    }

    setSubMatrix(params: {
        translate?: Matrix,
        rotate?: Matrix,
        skew?: Matrix,
        scale?: Matrix,
    }) {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        if (params.translate) {
            if (params.translate.rowCount !== 4 || params.translate.colCount !== 4) throw new Error("矩阵数据错误：translate必须为4x4矩阵");
            this.translateMatrix = TranslateMatrix.FromMatrix(params.translate)
        }
        if (params.rotate) {
            if (params.rotate.rowCount !== 4 || params.rotate.colCount !== 4) throw new Error("矩阵数据错误：rotate必须为4x4矩阵");
            this.rotateMatrix = RotateMatrix.FromMatrix(params.rotate)
        }
        if (params.skew) {
            if (params.skew.rowCount !== 4 || params.skew.colCount !== 4) throw new Error("矩阵数据错误：skew必须为4x4矩阵");
            this.skewMatrix = params.skew
        }
        if (params.scale) {
            if (params.scale.rowCount !== 4 || params.scale.colCount !== 4) throw new Error("矩阵数据错误：scale必须为4x4矩阵");
            this.scaleMatrix = ScaleMatrix.FromMatrix(params.scale)
        }
        this.isMatrixLatest = false
        this.isSubMatrixLatest = true
        this.onChange(this)
    }

    getInverse(): Transform { // 获取逆变换，不修改原变换
        if (this.inverseCache) return this.inverseCache.clone();
        if (!this.isMatrixLatest) this.updateMatrix();
        const matrix = this.matrix.getInverse()
        if (!matrix) throw new Error("矩阵不可逆");
        this.inverseCache = new Transform({
            matrix: matrix,
        })
        return this.inverseCache.clone()
    }

    // 从一个向量到另一个向量的变换矩阵
    static FromVectorToVector(from: ColVector3D, to: ColVector3D): Transform {
        if (from.isZero || to.isZero) throw new Error("不能为零向量");

        const fromUnit = from.clone().normalize()
        const toUnit = to.clone().normalize()

        const transform = new Transform()
        if (from.equals(to)) return transform;

        const axis = fromUnit.cross(toUnit) as ColVector3D
        const angle = fromUnit.angleTo(toUnit)
        if (!isZero(angle)) transform.rotateAt({
            axis: new Line(axis),
            angle: angle,
        });

        return transform
    }

    // 从一条直线到另一条直线的变换矩阵
    static FromLineToLine(from: Line, to: Line): Transform {
        return Transform.FromVectorToVector(from.direction, to.direction).translate(to.point.clone().subtract(from.point))
    }

    // 从一个平面到另一个平面的变换矩阵
    static FromPlaneToPlane(from: Plane, to: Plane): Transform {
        return Transform.FromVectorToVector(from.normal, to.normal).translateAt({
            axis: to.normal,
            distance: to.d - from.d,
        })
    }

    private _getMatrixEl(key: Matrix3DKeysType) {
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix[key]
    }

    private _setMatrixEl(key: Matrix3DKeysType, value: number) {
        if (!this.isMatrixLatest) this.updateMatrix();
        this.matrix[key] = value
        this.isSubMatrixLatest = false
        this.onChange(this)
    }

    get m00() {
        return this._getMatrixEl("m00")
    }

    set m00(value) {
        this._setMatrixEl("m00", value)
    }

    get m01() {
        return this._getMatrixEl("m01")
    }

    set m01(value) {
        this._setMatrixEl("m01", value)
    }

    get m02() {
        return this._getMatrixEl("m02")
    }

    set m02(value) {
        this._setMatrixEl("m02", value)
    }

    get m03() {
        return this._getMatrixEl("m03")
    }

    set m03(value) {
        this._setMatrixEl("m03", value)
    }

    get m10() {
        return this._getMatrixEl("m10")
    }

    set m10(value) {
        this._setMatrixEl("m10", value)
    }

    get m11() {
        return this._getMatrixEl("m11")
    }

    set m11(value) {
        this._setMatrixEl("m11", value)
    }

    get m12() {
        return this._getMatrixEl("m12")
    }

    set m12(value) {
        this._setMatrixEl("m12", value)
    }

    get m13() {
        return this._getMatrixEl("m13")
    }

    set m13(value) {
        this._setMatrixEl("m13", value)
    }

    get m20() {
        return this._getMatrixEl("m20")
    }

    set m20(value) {
        this._setMatrixEl("m20", value)
    }

    get m21() {
        return this._getMatrixEl("m21")
    }

    set m21(value) {
        this._setMatrixEl("m21", value)
    }

    get m22() {
        return this._getMatrixEl("m22")
    }

    set m22(value) {
        this._setMatrixEl("m22", value)
    }

    get m23() {
        return this._getMatrixEl("m23")
    }

    set m23(value) {
        this._setMatrixEl("m23", value)
    }

    get m30() {
        return this._getMatrixEl("m30")
    }

    set m30(value) {
        this._setMatrixEl("m30", value)
    }

    get m31() {
        return this._getMatrixEl("m31")
    }

    set m31(value) {
        this._setMatrixEl("m31", value)
    }

    get m32() {
        return this._getMatrixEl("m32")
    }

    set m32(value) {
        this._setMatrixEl("m32", value)
    }

    get m33() {
        return this._getMatrixEl("m33")
    }

    set m33(value) {
        this._setMatrixEl("m33", value)
    }

    transform(cols: Matrix | ColVector3D[]) { // 对多个三维列向量（三维点）进行变换
        if (Array.isArray(cols)) cols = Matrix.FromCols(cols);
        const [m, n] = cols.size
        if (m !== 3) throw new Error("点必须是3维列向量");
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix.clone().multiply(cols.clone().insertRows(new NumberArray2D([1, n], 1))).deleteRow()
    }

    transformLine(line: Line) {
        return line.clone().transform(this)
    }

    transformPlane(plane: Plane) {
        return plane.clone().transform(this)
    }

    transformCol(col: ColVector3D) { // 对一个三维列向量（三维点）进行变换
        return ColVector3D.FromMatrix(this.transform(col))
    }

    // 平移
    translate(vector: ColVector3D) {
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, vector.x,
            0, 1, 0, vector.y,
            0, 0, 1, vector.z,
            0, 0, 0, 1,
        ], true))

        if (this.isMatrixLatest) {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        } else {
            this.translateMatrix = TranslateMatrix.FromMatrix(matrix.multiply(this.translateMatrix))
            this.isMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 朝向平移
    translateAt(params: {
        axis: ColVector3D,
        distance: number,
    }) {
        return this.translate(params.axis.clone().normalize().multiplyByNumber(params.distance))
    }

    // 在当前坐标系的方向下平移，但平移的大小不受当前坐标系影响
    translateInLocal(vector: ColVector3D) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const m = this.matrix.clone().resize([3, 3]).normalize()
        return this.translate(m.multiply(vector).col0)
    }

    // X轴平移
    translateX(value: number) {
        this.translate(ColVector3D.FromXYZ(value, 0, 0))
    }

    // Y轴平移
    translateY(value: number) {
        this.translate(ColVector3D.FromXYZ(0, value, 0))
    }

    // Z轴平移
    translateZ(value: number) {
        this.translate(ColVector3D.FromXYZ(0, 0, value))
    }

    // 在本变换之前平移
    preTranslate(vector: ColVector3D) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, vector.x,
            0, 1, 0, vector.y,
            0, 0, 1, vector.z,
            0, 0, 0, 1,
        ], true))

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 在本变换之前进行X轴平移
    preTranslateX(value: number) {
        this.preTranslate(new ColVector3D([value, 0, 0]))
    }

    // 在本变换之前进行Y轴平移
    preTranslateY(value: number) {
        this.preTranslate(new ColVector3D([0, value, 0]))
    }

    // 在本变换之前进行Z轴平移
    preTranslateZ(value: number) {
        this.preTranslate(new ColVector3D([0, 0, value]))
    }

    // 设置平移参数
    setTranslate(vector: ColVector3D) {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.translateMatrix = TranslateMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, vector.x,
            0, 1, 0, vector.y,
            0, 0, 1, vector.z,
            0, 0, 0, 1,
        ], true)))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 设置X轴平移参数
    setTranslateX(value: number) {
        const translateNow = this.decomposeTranslate()
        this.setTranslate(new ColVector3D([value, translateNow.y, translateNow.z]))
    }

    // 设置Y轴平移参数
    setTranslateY(value: number) {
        const translateNow = this.decomposeTranslate()
        this.setTranslate(new ColVector3D([translateNow.x, value, translateNow.z]))
    }

    // 设置Z轴平移参数
    setTranslateZ(value: number) {
        const translateNow = this.decomposeTranslate()
        this.setTranslate(new ColVector3D([translateNow.x, translateNow.y, value]))
    }

    // 是否存在平移
    hasTranslate() {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        return isZero(this.translateMatrix.m03) && isZero(this.translateMatrix.m13) && isZero(this.translateMatrix.m23)
    }

    // 是否仅存在平移
    onlyTranslate() {
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix.clone().resize([3, 3]).isIdentity
    }

    // 缩放
    scale(params: {
        point?: ColVector3D, // 缩放的中心点
        vector: ColVector3D, // 缩放值向量
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;

        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        const matrix = new Matrix(new NumberArray2D([4, 4], [
            params.vector.x, 0, 0, 0,
            0, params.vector.y, 0, 0,
            0, 0, params.vector.z, 0,
            0, 0, 0, 1,
        ], true))

        if (params.mode === TransformMode.Local) {
            if (params.point) {
                // diffTranslate = (S1 - S0) * (-P) // P为缩放中心

                const s0 = this.scaleMatrix.buildMatrix().resize([3, 3])

                this.scaleMatrix = ScaleMatrix.FromMatrix(matrix.multiply(this.scaleMatrix))

                const s1 = this.scaleMatrix.buildMatrix().resize([3, 3])
                const diffTranslate = s1.subtract(s0).multiply(params.point.clone().negate()).col0

                this.translate(diffTranslate)
            } else {
                this.scaleMatrix = ScaleMatrix.FromMatrix(matrix.multiply(this.scaleMatrix))
            }

            this.isMatrixLatest = false

        } else {
            if (params.point) this.translate(params.point.getNegate() as ColVector3D);

            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false

            if (params.point) this.translate(params.point);
        }

        this.onChange(this)

        return this
    }

    // X轴缩放
    scaleX(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
        mode?: TransformMode,
    }) {
        return this.scale({point: params.point, vector: new ColVector3D([params.value, 1, 1]), mode: params.mode})
    }

    // Y轴缩放
    scaleY(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
        mode?: TransformMode,
    }) {
        return this.scale({point: params.point, vector: new ColVector3D([1, params.value, 1]), mode: params.mode})
    }

    // Z轴缩放
    scaleZ(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
        mode?: TransformMode,
    }) {
        return this.scale({point: params.point, vector: new ColVector3D([1, 1, params.value]), mode: params.mode})
    }

    // 在本变换之前缩放
    preScale(params: {
        point?: ColVector3D, // 缩放的中心点
        vector: ColVector3D,
    }) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const matrix = new Matrix(new NumberArray2D([4, 4], [
            params.vector.x, 0, 0, 0,
            0, params.vector.y, 0, 0,
            0, 0, params.vector.z, 0,
            0, 0, 0, 1,
        ], true))

        if (params.point) this.translate(params.point.getNegate() as ColVector3D);

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        if (params.point) this.translate(params.point);

        this.onChange(this)

        return this
    }

    // 在本变换之前进行X轴缩放
    preScaleX(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
    }) {
        return this.preScale({vector: new ColVector3D([params.value, 1, 1])})
    }

    // 在本变换之前进行Y轴缩放
    preScaleY(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
    }) {
        return this.preScale({vector: new ColVector3D([1, params.value, 1])})
    }

    // 在本变换之前进行Z轴缩放
    preScaleZ(params: {
        point?: ColVector3D, // 缩放的中心点
        value: number,
    }) {
        return this.preScale({vector: new ColVector3D([1, 1, params.value])})
    }

    // 设置缩放参数
    setScale(vector: ColVector3D) {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.scaleMatrix = ScaleMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
            vector.x, 0, 0, 0,
            0, vector.y, 0, 0,
            0, 0, vector.z, 0,
            0, 0, 0, 1,
        ], true)))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 设置X轴缩放参数
    setScaleX(value: number) {
        const scaleNow = this.decomposeScale()
        this.setScale(new ColVector3D([value, scaleNow.y, scaleNow.z]))
    }

    // 设置Y轴缩放参数
    setScaleY(value: number) {
        const scaleNow = this.decomposeScale()
        this.setScale(new ColVector3D([scaleNow.x, value, scaleNow.z]))
    }

    // 设置Z轴缩放参数
    setScaleZ(value: number) {
        const scaleNow = this.decomposeScale()
        this.setScale(new ColVector3D([scaleNow.x, scaleNow.y, value]))
    }

    // 是否存在缩放
    hasScale() {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        return !this.scaleMatrix.isIdentity
    }

    // 是否仅存在缩放
    onlyScale() {
        return !this.hasTranslate() && !this.hasSkew() && !this.hasRotation()
    }

    // 绕x轴旋转
    rotateX(params: {
        angle: number,
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;

        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        const sin = Math.sin(params.angle)
        const cos = Math.cos(params.angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, 0,
            0, cos, -sin, 0,
            0, sin, cos, 0,
            0, 0, 0, 1,
        ], true))

        if (params.mode === TransformMode.Local) {
            this.rotateMatrix = RotateMatrix.FromMatrix(matrix.multiply(this.rotateMatrix))
            this.isMatrixLatest = false
        } else {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前绕x轴旋转
    preRotateX(angle: number) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const sin = Math.sin(angle)
        const cos = Math.cos(angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1, 0, 0, 0,
            0, cos, -sin, 0,
            0, sin, cos, 0,
            0, 0, 0, 1,
        ], true))

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 绕y轴旋转
    rotateY(params: {
        angle: number,
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;

        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        const sin = Math.sin(params.angle)
        const cos = Math.cos(params.angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            cos, 0, sin, 0,
            0, 1, 0, 0,
            -sin, 0, cos, 0,
            0, 0, 0, 1,
        ], true))

        if (params.mode === TransformMode.Local) {
            this.rotateMatrix = RotateMatrix.FromMatrix(matrix.multiply(this.rotateMatrix))
            this.isMatrixLatest = false
        } else {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前绕y轴旋转
    preRotateY(angle: number) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const sin = Math.sin(angle)
        const cos = Math.cos(angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            cos, 0, sin, 0,
            0, 1, 0, 0,
            -sin, 0, cos, 0,
            0, 0, 0, 1,
        ], true))

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 绕z轴旋转
    rotateZ(params: {
        angle: number,
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;

        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        const sin = Math.sin(params.angle)
        const cos = Math.cos(params.angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            cos, -sin, 0, 0,
            sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ], true))

        if (params.mode === TransformMode.Local) {
            this.rotateMatrix = RotateMatrix.FromMatrix(matrix.multiply(this.rotateMatrix))
            this.isMatrixLatest = false
        } else {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前绕z轴旋转
    preRotateZ(angle: number) {
        if (!this.isMatrixLatest) this.updateMatrix();

        const sin = Math.sin(angle)
        const cos = Math.cos(angle)
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            cos, -sin, 0, 0,
            sin, cos, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ], true))

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 绕任意轴旋转
    rotate(params: {
        axis?: LineThrough0, // 旋转轴方向向量，默认为z轴方向
        angle: number,
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;

        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        if (params.axis === undefined) params.axis = LineThrough0.FromPoints(ColVector3D.FromXYZ(0, 0, 1));

        let [x, y, z] = params.axis.direction.rawData
        // matrix中定义的旋转正方向为顺时针，与本模块相反，所以取负值
        const angle = -params.angle
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const t = 1 - c
        // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate3d#syntax
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1 + t * (x ** 2 - 1), z * s + x * y * t, -y * s + x * z * t, 0,
            -z * s + x * y * t, 1 + t * (y ** 2 - 1), x * s + y * z * t, 0,
            y * s + x * z * t, -x * s + y * z * t, 1 + t * (z ** 2 - 1), 0,
            0, 0, 0, 1,
        ], true))

        if (params.mode === TransformMode.Local) {
            this.rotateMatrix = RotateMatrix.FromMatrix(matrix.multiply(this.rotateMatrix))
            this.isMatrixLatest = false
        } else {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前绕任意轴旋转
    preRotate(params: {
        axis?: LineThrough0, // 旋转轴方向向量
        angle: number,
    }) {
        if (!this.isMatrixLatest) this.updateMatrix();

        if (params.axis === undefined) params.axis = LineThrough0.FromPoints(ColVector3D.FromXYZ(0, 0, 1));

        let [x, y, z] = params.axis.direction.rawData
        z = -z // z轴方向定义相反
        const c = Math.cos(params.angle)
        const s = Math.sin(params.angle)
        const t = 1 - c
        // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/rotate3d#syntax
        const matrix = new Matrix(new NumberArray2D([4, 4], [
            1 + t * (x ** 2 - 1), z * s + x * y * t, -y * s + x * z * t, 0,
            -z * s + x * y * t, 1 + t * (y ** 2 - 1), x * s + y * z * t, 0,
            y * s + x * z * t, -x * s + y * z * t, 1 + t * (z ** 2 - 1), 0,
            0, 0, 0, 1,
        ], true))

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 绕任意不过原点的轴旋转
    rotateAt(params: {
        axis?: Line, // 旋转轴
        angle: number,
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;
        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        const linePoint = params.axis?.point
        if (params.mode === TransformMode.Local) {
            if (linePoint) {
                let point: Matrix = linePoint.clone()
                if (!this.scaleMatrix.isIdentity) point = this.scaleMatrix.buildMatrix().resize([3, 3]).multiply(point);
                if (!this.skewMatrix.isIdentity) point = this.skewMatrix.clone().resize([3, 3]).multiply(point);

                // diffTranslate = (R1 - R0) * (-P) // P为旋转中心
                const r0 = this.rotateMatrix.buildMatrix().resize([3, 3])
                this.rotate(params)
                const r1 = this.rotateMatrix.buildMatrix().resize([3, 3])
                const diffTranslate = r1.subtract(r0).multiply(point.negate()).col0

                this.translate(diffTranslate)
            } else {
                this.rotate(params)
            }
        } else {
            if (linePoint) this.translate(linePoint.getNegate() as ColVector3D);
            this.rotate(params)
            if (linePoint) this.translate(linePoint);
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前绕任意不过原点的轴旋转
    preRotateAt(params: {
        axis?: Line, // 旋转轴
        angle: number,
    }) {
        if (!this.isMatrixLatest) this.updateMatrix();

        if (params.axis) this.preTranslate(params.axis.point);
        this.preRotate(params)
        if (params.axis) this.preTranslate(params.axis.point.clone().getNegate())

        this.onChange(this)

        return this
    }

    // 设置旋转参数（欧拉角（ZXY序）：先绕y轴旋转，再绕x轴旋转，最后绕z轴旋转）
    // https://en.wikipedia.org/wiki/Euler_angles
    // x、y、z分别对应维基百科中的β、γ、α
    setRotate(euler: ColVector3D) {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        const [x, y, z] = euler.rawData
        const c2 = Math.cos(x), s2 = Math.sin(x)
        const c3 = Math.cos(y), s3 = Math.sin(y)
        const c1 = Math.cos(z), s1 = Math.sin(z)
        this.rotateMatrix = RotateMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
            c1 * c3 - s1 * s2 * s3, -c2 * s1, c1 * s3 + c3 * s1 * s2, 0,
            c3 * s1 + c1 * s2 * s3, c1 * c2, s1 * s3 - c1 * c3 * s2, 0,
            -c2 * s3, s2, c2 * c3, 0,
            0, 0, 0, 1,
        ], true)))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 设置绕x轴旋转参数
    setRotateX(angle: number) {
        return this.setRotate(new ColVector3D([angle, 0, 0]))
    }

    // 设置绕y轴旋转参数
    setRotateY(angle: number) {
        return this.setRotate(new ColVector3D([0, angle, 0]))
    }

    // 设置绕z轴旋转参数
    setRotateZ(angle: number) {
        return this.setRotate(new ColVector3D([0, 0, angle]))
    }

    // 判断是否有旋转
    // 当同时支持x、y、z轴斜切时，不能仅根据旋转子矩阵rotateMatrix是否为单位矩阵来判断是否有旋转
    // 因为当rotateMatrix表示存在旋转时，x、y、z轴斜切可能会刚好抵消旋转的效果，从而使得主矩阵matrix中并不存在旋转
    // 所以当同时支持x、y、z轴斜切时，还需做更多处理才能判断是否有旋转
    // 目前仅支持x、y轴斜切，解析时x轴斜切参数恒为0，相当于仅存在y轴斜切，所以暂不需要考虑上述情况
    hasRotation() {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        return !this.rotateMatrix.isIdentity
    }

    // 是否仅存在旋转
    onlyRotation() {
        return !this.hasTranslate() && !this.hasSkew() && !this.hasScale()
    }

    // 要确保调用前已调用 this.updateMatrix()
    _getSkewMatrix(skew: {
        x?: {
            axis: ColVector3D, // 旋转轴
            angle: number, // 旋转角度
        },
        y?: {
            axis: ColVector3D,
            angle: number,
        },
        z?: {
            axis: ColVector3D,
            angle: number,
        }
    }) {
        function getAxis(skewItem: {
            axis: ColVector3D,
            angle: number,
        }, calcIndex: number) {
            const angle = -skewItem.angle
            const c = Math.cos(angle)
            const s = Math.sin(angle)
            const t = 1 - c
            const [x, y, z] = skewItem.axis!.rawData
            // https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function/skew#syntax
            const calcList = [
                () => ColVector3D.FromXYZ(
                    1 + t * (x ** 2 - 1),
                    -z * s + x * y * t,
                    y * s + x * z * t,
                ),
                () => ColVector3D.FromXYZ(
                    z * s + x * y * t,
                    1 + t * (y ** 2 - 1),
                    -x * s + y * z * t,
                ),
                () => ColVector3D.FromXYZ(
                    -y * s + x * z * t,
                    x * s + y * z * t,
                    1 + t * (z ** 2 - 1),
                ),
            ]
            return calcList[calcIndex]()
        }

        const xAxis = (skew.x === undefined || skew.x.angle === 0)
            ? ColVector3D.FromXYZ(1, 0, 0)
            : getAxis(skew.x, 0)
        const yAxis = (skew.y === undefined || skew.y.angle === 0)
            ? ColVector3D.FromXYZ(0, 1, 0)
            : getAxis(skew.y, 1)
        const zAxis = (skew.z === undefined || skew.z.angle === 0)
            ? ColVector3D.FromXYZ(0, 0, 1)
            : getAxis(skew.z, 2)

        return Matrix.FromCols([xAxis, yAxis, zAxis]).insertCols([0, 0, 0]).insertRows([0, 0, 0, 1])
    }

    // 斜切
    skew(params: {
        skew?: {
            x?: {
                axis: ColVector3D, // 旋转轴
                angle: number, // 旋转角度
            },
            y?: {
                axis: ColVector3D,
                angle: number,
            },
            z?: {
                axis: ColVector3D,
                angle: number,
            }
        },
        skewAxis?: {
            x?: ColVector3D,
            y?: ColVector3D,
            z?: ColVector3D,
        },
        mode?: TransformMode,
    }) {
        if (params.mode === undefined) params.mode = TransformMode.Global;
        if ((params.mode === TransformMode.Local && !this.isSubMatrixLatest)
            || (params.mode === TransformMode.Global && !this.isMatrixLatest)) {
            this.updateMatrix()
        }

        let matrix = Matrix.BuildIdentity([4, 4])
        if (params.skew !== undefined) {
            matrix = this._getSkewMatrix(params.skew)
        } else if (params.skewAxis !== undefined) {
            if (params.skewAxis.x !== undefined) matrix.setSubMatrix(params.skewAxis.x, [0, 0]);
            if (params.skewAxis.y !== undefined) matrix.setSubMatrix(params.skewAxis.y, [0, 1]);
            if (params.skewAxis.z !== undefined) matrix.setSubMatrix(params.skewAxis.z, [0, 2]);
        }

        if (params.mode === TransformMode.Local) {
            this.skewMatrix = matrix.multiply(this.skewMatrix)
            this.isMatrixLatest = false
        } else {
            this.matrix = matrix.multiply(this.matrix)
            this.isSubMatrixLatest = false
        }

        this.onChange(this)

        return this
    }

    // 在本变换之前斜切
    preSkew(params: {
        skew?: {
            x?: {
                axis: ColVector3D,  // 旋转轴
                angle: number,      // 旋转角度
            },
            y?: {
                axis: ColVector3D,
                angle: number,
            },
            z?: {
                axis: ColVector3D,
                angle: number,
            }
        },
        skewAxis?: {
            x?: ColVector3D,
            y?: ColVector3D,
            z?: ColVector3D,
        },
    }) {
        if (!this.isMatrixLatest) this.updateMatrix();

        let matrix = Matrix.BuildIdentity([4, 4])
        if (params.skew !== undefined) {
            matrix = this._getSkewMatrix(params.skew)
        } else if (params.skewAxis !== undefined) {
            if (params.skewAxis.x !== undefined) matrix.setSubMatrix(params.skewAxis.x, [0, 0]);
            if (params.skewAxis.y !== undefined) matrix.setSubMatrix(params.skewAxis.y, [0, 1]);
            if (params.skewAxis.z !== undefined) matrix.setSubMatrix(params.skewAxis.z, [0, 2]);
        }

        this.matrix.multiply(matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 设置斜切参数
    setSkew(params: {
        skew?: {
            x?: {
                axis: ColVector3D,  // 旋转轴
                angle: number,      // 旋转角度
            },
            y?: {
                axis: ColVector3D,
                angle: number,
            },
            z?: {
                axis: ColVector3D,
                angle: number,
            }
        },
        skewAxis?: {
            x?: ColVector3D,
            y?: ColVector3D,
            z?: ColVector3D,
        },
    }) {
        if (!this.isSubMatrixLatest) this.updateMatrix();

        let matrix = Matrix.BuildIdentity([4, 4])
        if (params.skew !== undefined) {
            matrix = this._getSkewMatrix(params.skew)
        } else if (params.skewAxis !== undefined) {
            if (params.skewAxis.x !== undefined) matrix.setSubMatrix(params.skewAxis.x.normalize(), [0, 0]);
            if (params.skewAxis.y !== undefined) matrix.setSubMatrix(params.skewAxis.y.normalize(), [0, 1]);
            if (params.skewAxis.z !== undefined) matrix.setSubMatrix(params.skewAxis.z.normalize(), [0, 2]);
        }

        this.skewMatrix = matrix
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 判断是否有斜切
    // 情况同上（hasRotation函数）
    hasSkew() {
        if (!this.isSubMatrixLatest) this.updateMatrix();
        return !this.skewMatrix.isIdentity
    }

    // 是否仅存在斜切
    onlySkew() {
        return !this.hasTranslate() && !this.hasRotation() && !this.hasScale()
    }

    // 左乘 同multiAtLeft
    addTransform(transform: Transform) { // 叠加另一个变换（先执行本变换，再执行另一个变换）
        if (!transform.isMatrixLatest) transform.updateMatrix();
        if (!this.isMatrixLatest) this.updateMatrix();
        this.matrix = transform.matrix.clone().multiply(this.matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 右乘 同multi
    addPreTransform(transform: Transform) { // 叠加另一个变换（先执行另一个变换，再执行本变换）
        if (!transform.isMatrixLatest) transform.updateMatrix();
        if (!this.isMatrixLatest) this.updateMatrix();
        this.matrix = this.matrix.clone().multiply(transform.matrix)
        this.isSubMatrixLatest = false

        this.onChange(this)

        return this
    }

    mirrorX(x?: number) { // 基于x=a平面镜像
        return this.scaleX({point: ColVector3D.FromXYZ(x || 0, 0, 0), value: -1})
    }

    mirrorY(y?: number) { // 基于y=a平面镜像
        return this.scaleY({point: ColVector3D.FromXYZ(0, y || 0, 0), value: -1})
    }

    mirrorZ(z?: number) { // 基于z=a平面镜像
        return this.scaleZ({point: ColVector3D.FromXYZ(0, 0, z || 0), value: -1})
    }

    // 基于任意平面镜像
    flip(plane: Plane) {
        const transform = Transform.FromPlaneToPlane(plane, Plane.FromVerticalX())
        return this.addTransform(transform).mirrorX().addTransform(transform.getInverse())
    }

    // 在本变换之前基于任意平面镜像
    preFlip(plane: Plane) {
        const transform = Transform.FromPlaneToPlane(plane, Plane.FromVerticalX())
        return this.addPreTransform(transform.clone().mirrorX().addTransform(transform.getInverse()))
    }

    // 水平翻转
    flipH(x?: number) {
        return this.flip(new Plane(ColVector3D.FromXYZ(1, 0, 0), x || 0))
    }

    // 在本变换之前进行水平翻转
    preFlipH(x?: number) {
        return this.preFlip(new Plane(ColVector3D.FromXYZ(1, 0, 0), x || 0))
    }

    // 垂直翻转
    flipV(y?: number) {
        return this.flip(new Plane(ColVector3D.FromXYZ(0, 1, 0), y || 0))
    }

    // 在本变换之前进行垂直翻转，point为旋转轴上的一点
    preFlipV(y?: number) {
        return this.preFlip(new Plane(ColVector3D.FromXYZ(0, 1, 0), y || 0))
    }

    decomposeTranslate() { // 分解平移参数
        if (this.decomposeTranslateCache !== undefined) return this.decomposeTranslateCache.clone();
        const matrix = this.isMatrixLatest ? this.matrix : this.translateMatrix
        this.decomposeTranslateCache = matrix.col3.deleteRow()
        return this.decomposeTranslateCache.clone()
    }

    decomposeEuler() { // 分解欧拉角（ZXY序）参数
        if (this.decomposeEulerCache !== undefined) return this.decomposeEulerCache.clone();
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.decomposeEulerCache = Transform.DecomposeEuler(this.rotateMatrix)
        return this.decomposeEulerCache.clone()
    }

    decomposeScale() { // 分解缩放参数
        if (this.decomposeScaleCache !== undefined) return this.decomposeScaleCache.clone();
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.decomposeScaleCache = new ColVector3D([this.scaleMatrix.m00, this.scaleMatrix.m11, this.scaleMatrix.m22])
        return this.decomposeScaleCache.clone()
    }

    decomposeSkew() { // 分解斜切参数
        if (this.decomposeSkewCache === undefined) {
            if (!this.isSubMatrixLatest) this.updateMatrix();

            const xAxis = this.skewMatrix.col0.deleteRow()
            const yAxis = this.skewMatrix.col1.deleteRow()
            const zAxis = this.skewMatrix.col2.deleteRow()

            // 标准轴
            const normalXAxis = ColVector3D.FromXYZ(1, 0, 0)
            const normalYAxis = ColVector3D.FromXYZ(0, 1, 0)
            const normalZAxis = ColVector3D.FromXYZ(0, 0, 1)

            const yAngle = Math.asin(-this.skewMatrix.m01)
            const decomposeSkewCache = {
                x: {
                    axis: normalZAxis.clone(),
                    angle: 0,
                },
                y: {
                    axis: normalZAxis.clone(),
                    angle: yAngle,
                },
                z: {
                    axis: normalZAxis.cross(zAxis) as ColVector3D,
                    angle: normalZAxis.angleTo(zAxis),
                },
            }
            if (!xAxis.equals(normalXAxis)) {
                decomposeSkewCache.x = {
                    axis: normalXAxis.cross(xAxis) as ColVector3D,
                    angle: normalXAxis.angleTo(xAxis),
                }
            }
            if (!yAxis.equals(normalYAxis)) {
                decomposeSkewCache.y = {
                    axis: normalYAxis.cross(yAxis) as ColVector3D,
                    angle: normalYAxis.angleTo(yAxis),
                }
            }
            this.decomposeSkewCache = decomposeSkewCache
        }

        return {
            x: {
                axis: this.decomposeSkewCache.x.axis.clone(),
                angle: this.decomposeSkewCache.x.angle,
            },
            y: {
                axis: this.decomposeSkewCache.y.axis.clone(),
                angle: this.decomposeSkewCache.y.angle,
            },
            z: {
                axis: this.decomposeSkewCache.z.axis.clone(),
                angle: this.decomposeSkewCache.z.angle,
            },
        }
    }

    // 旋转矩阵转欧拉角
    // 欧拉角的“序”与实际操作顺序相反，例如ZXY序指的是先绕y轴旋转，再绕x轴旋转，最后绕z轴旋转
    // https://en.wikipedia.org/wiki/Euler_angles
    // x、y、z分别对应维基百科中的β、γ、α
    // https://zhuanlan.zhihu.com/p/45404840?from=groupmessage
    static DecomposeEuler(matrix: Matrix) { // 通过旋转矩阵分解出欧拉角（ZXY序），返回值的单位为弧度
        const x = Math.asin(matrix.m21)
        let y, z
        if (x === Math.PI / 2 || x === -Math.PI / 2) {
            y = Math.atan2(matrix.m10, matrix.m00)
            z = 0
        } else {
            y = Math.atan2(-matrix.m20, matrix.m22)
            z = Math.atan2(-matrix.m01, matrix.m11)
        }
        return new ColVector3D([x, y, z])
    }

    decompose() { // 分解出平移、欧拉角（ZXY序）、缩放、斜切的参数
        return {
            translate: this.decomposeTranslate(),
            rotate: this.decomposeEuler(),
            scale: this.decomposeScale(),
            skew: this.decomposeSkew(),
        }
    }

    clearRotation() { // 清除旋转操作
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.rotateMatrix = RotateMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    clearSkew() { // 清除斜切操作
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.skewMatrix = Matrix.BuildIdentity([4, 4])
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 清除斜切，同时清除斜切带来的缩放
    clearSkewAndResetScale() {
        if (!this.isSubMatrixLatest) this.updateMatrix();

        this.scaleMatrix
            .multiplyByNumberSubMatrix(this.skewMatrix.m00, [3, 1], [0, 0])
            .multiplyByNumberSubMatrix(this.skewMatrix.m11, [3, 1], [0, 1])
            .multiplyByNumberSubMatrix(this.skewMatrix.m22, [3, 1], [0, 2])
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    clearScale() { // 清除缩放操作
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.scaleMatrix = ScaleMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    // 清除缩放，但保留斜切带来的缩放
    clearScaleAndKeepSkew() {
        if (!this.isSubMatrixLatest) this.updateMatrix();

        const xLength = 1 / this.skewMatrix.m00
        const yLength = 1 / this.skewMatrix.m11
        const zLength = 1 / this.skewMatrix.m22
        this.scaleMatrix = ScaleMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
            xLength, 0, 0, 0,
            0, yLength, 0, 0,
            0, 0, zLength, 0,
            0, 0, 0, 1,
        ], true)))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    clearScaleSize() { // 清除缩放大小，但保留缩放方向
        const scale = this.decomposeScale()
        this.setScale(ColVector3D.FromXYZ(
            scale.x < 0 ? -1 : 1,
            scale.y < 0 ? -1 : 1,
            scale.z < 0 ? -1 : 1,
        ))
        return this
    }

    clearScaleSizeAndKeepSkew() { // 清除缩放大小，但保留缩放方向和斜切带来的缩放
        if (!this.isSubMatrixLatest) this.updateMatrix();

        const scale = this.decomposeScale()
        const xLength = (scale.x < 0 ? -1 : 1) / this.skewMatrix.m00
        const yLength = (scale.y < 0 ? -1 : 1) / this.skewMatrix.m11
        const zLength = (scale.z < 0 ? -1 : 1) / this.skewMatrix.m22
        this.scaleMatrix = ScaleMatrix.FromMatrix(new Matrix(new NumberArray2D([4, 4], [
            xLength, 0, 0, 0,
            0, yLength, 0, 0,
            0, 0, zLength, 0,
            0, 0, 0, 1,
        ], true)))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    clearRKS() { // 清除旋转、斜切、缩放操作
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.rotateMatrix = RotateMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.skewMatrix = Matrix.BuildIdentity([4, 4])
        this.scaleMatrix = ScaleMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    clearTranslate() { // 清除平移操作
        if (!this.isSubMatrixLatest) this.updateMatrix();
        this.translateMatrix = TranslateMatrix.FromMatrix(Matrix.BuildIdentity([4, 4]))
        this.isMatrixLatest = false

        this.onChange(this)

        return this
    }

    makeFromRotateMatrix() { // 根据rotateMatrix构建新的Transform
        return new Transform({
            matrix: Matrix.FromMatrix(this.rotateMatrix.clone()),
        })
    }

    makeFromTranslateMatrix() { // 根据translateMatrix构建新的Transform
        return new Transform({
            matrix: Matrix.FromMatrix(this.translateMatrix.clone()),
        })
    }

    makeFromSkewMatrix() { // 根据skewMatrix构建新的Transform
        return new Transform({
            matrix: Matrix.FromMatrix(this.skewMatrix.clone()),
        })
    }

    makeFromScaleMatrix() { // 根据scaleMatrix构建新的Transform
        return new Transform({
            matrix: Matrix.FromMatrix(this.scaleMatrix.clone()),
        })
    }

    getMatrix() { // 获取矩阵
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix.clone()
    }

    getCoordinateSystemMatrix() { // 获取坐标系矩阵（3x4矩阵）
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix.clone().resize([3, 4])
    }

    toString() {
        if (!this.isMatrixLatest) this.updateMatrix();
        return this.matrix.toString()
    }
}

// 直线
export class Line {
    // 直线方程
    // x = x0 + at
    // y = y0 + bt
    // z = z0 + ct
    // 其中(x0, y0, z0)为直线上一点，(a, b, c)为方向向量

    direction: ColVector3D // 方向向量
    point: ColVector3D // 直线上一点

    constructor(direction: ColVector3D, point?: ColVector3D) {
        this.direction = direction.clone().normalize()
        this.point = point ? point.clone() : ColVector3D.FromXYZ(0, 0, 0)
    }

    static FromPoints(p1: ColVector3D, p2?: ColVector3D) { // 两点式
        if (p2 === undefined) [p1, p2] = [ColVector3D.FromXYZ(0, 0, 0), p1];
        return new Line(p2.subtract(p1), p2)
    }

    static FromParallelX(point?: ColVector3D) { // 与x轴平行的直线
        if (point) point.x = 0;
        return new Line(ColVector3D.FromXYZ(1, 0, 0), point)
    }

    static FromParallelY(point?: ColVector3D) { // 与y轴平行的直线
        if (point) point.y = 0;
        return new Line(ColVector3D.FromXYZ(0, 1, 0), point)
    }

    static FromParallelZ(point?: ColVector3D) { // 与z轴平行的直线
        if (point) point.z = 0;
        return new Line(ColVector3D.FromXYZ(0, 0, 1), point)
    }

    clone() {
        return new Line(this.direction.clone(), this.point.clone())
    }

    transform(transform: Transform) { // 变换
        this.direction = transform.transform(this.direction).col0
        this.point = transform.transform(this.point).col0
        return this
    }

    distanceToPoint(point: ColVector3D) { // 点到直线的距离
        // 叉积的模 = 两向量组成的平行四边形面积 = 底 * 高 = direction的模 * 点到直线的距离 = 点到直线的距离
        return (this.direction.cross(point.subtract(this.point)) as ColVector3D).norm
    }

    projectionPoint(point: ColVector3D) { // 点在直线上的投影点
        const t = this.direction.dot(point.subtract(this.point))
        return this.point.add(this.direction.clone().multiplyByNumber(t))
    }

    isPointOnLine(point: ColVector3D) { // 判断点是否在直线上
        return isZero((this.direction.cross(point.subtract(this.point)) as ColVector3D).norm)
    }

    isLineParallel(line: Line) { // 判断直线是否平行
        return isZero((this.direction.cross(line.direction) as ColVector3D).norm)
    }

    isLineVertical(line: Line) { // 判断直线是否垂直
        return isZero(this.direction.dot(line.direction))
    }

    /* 求两直线交点
     * 两直线的参数方程：
     * r0 = p0 + d0 * t
     * r1 = p1 + d1 * s
     * 两直线交点满足：
     * p0 + d0 * t = p1 + d1 * s
     * d0 * t - d1 * s = p1 - p0
     * 用矩阵表示：
     * [d0, -d1] * [t, s]^T = [p1 - p0]
     * Ax = b
     * x = A^(-1) * b
     */
    intersectionWithLine(line: Line) {
        const d0 = this.direction, d1 = line.direction
        const p0 = this.point, p1 = line.point
        const A = Matrix.FromCols([d0, d1.clone().negate()])
        const b = p1.clone().subtract(p0)
        const AInverse = A.getInverse()
        if (AInverse === undefined) return undefined;
        const {x: t, y: s} = AInverse.multiply(b).col0
        return p0.clone().add(d0.clone().multiplyByNumber(t))
    }

    isLineIntersect(line: Line) { // 两直线是否相交
        return !!this.intersectionWithLine(line)
    }

    equals(line: Line) { // 判断是否相等
        return this.isLineParallel(line) && this.isPointOnLine(line.point)
    }

    toString() {
        return `x = ${this.point.m0} + ${this.direction.m0}t, y = ${this.point.m1} + ${this.direction.m1}t, z = ${this.point.m2} + ${this.direction.m2}t`
    }

}

// 过原点的直线
export class LineThrough0 extends Line {
    constructor(direction: ColVector3D) {
        super(direction, ColVector3D.FromXYZ(0, 0, 0))
    }

    static FromPoints(p: ColVector3D) {
        return new Line(p)
    }

    static FromXAxis() {
        return new Line(ColVector3D.FromXYZ(1, 0, 0))
    }

    static FromYAxis() {
        return new Line(ColVector3D.FromXYZ(0, 1, 0))
    }

    static FromZAxis() {
        return new Line(ColVector3D.FromXYZ(0, 0, 1))
    }
}

// 平面
export class Plane {
    // 平面方程
    // Ax + By + Cz + D = 0
    // A(x - x0) + B(y - y0) + C(z - z0) = 0

    normal: ColVector3D // 法向量

    // 常数项
    // 平面上任意一点与法向量的点积的负数
    // 其绝对值为平面到原点的距离与法向量模的乘积
    d: number

    constructor(normal: ColVector3D, d: number) {
        this.normal = normal.clone().normalize()
        this.d = d
    }

    static FromPointAndNormal(point: ColVector3D, normal: ColVector3D) { // 点法式
        return new Plane(normal, -normal.dot(point))
    }

    static FromPoints(p1: ColVector3D, p2: ColVector3D, p3: ColVector3D) { // 三点式
        const v1 = p2.subtract(p1)
        const v2 = p3.subtract(p1)
        const normal = v1.cross(v2) as ColVector3D
        if (normal.norm === 0) throw new Error('三点共线');
        return new Plane(normal.normalize(), -normal.dot(p1))
    }

    // 与x轴垂直的平面
    static FromVerticalX(d: number = 0) {
        return new Plane(ColVector3D.FromXYZ(1, 0, 0), d)
    }

    // 与y轴垂直的平面
    static FromVerticalY(d: number = 0) {
        return new Plane(ColVector3D.FromXYZ(0, 1, 0), d)
    }

    // 与z轴垂直的平面
    static FromVerticalZ(d: number = 0) {
        return new Plane(ColVector3D.FromXYZ(0, 0, 1), d)
    }

    clone() {
        return new Plane(this.normal.clone(), this.d)
    }

    transform(transform: Transform) { // 变换
        this.normal = transform.transform(this.normal).col0
        this.d = transform.transform(this.normal.clone().multiplyByNumber(this.d)).col0.norm
        return this
    }

    // 点到平面的有向距离
    // 若点到平面的垂线方向与法向量同向，则返回正值，否则返回负值
    distanceToPointDirect(point: ColVector3D) {
        return this.normal.dot(point) + this.d
    }

    // 点到平面的距离
    distanceToPoint(point: ColVector3D) {
        return Math.abs(this.distanceToPointDirect(point))
    }

    projectionPoint(point: ColVector3D) { // 点在平面上的投影点
        const distance = this.distanceToPointDirect(point)
        return point.subtract(this.normal.clone().multiplyByNumber(distance))
    }

    intersectionWithLine(line: Line) { // 平面与直线的交点
        if (this.isLineParallel(line)) return undefined;
        const t = (this.d + this.normal.dot(this.normal)) / this.normal.dot(line.direction)
        return line.point.add(line.direction.clone().multiplyByNumber(t))
    }

    intersectionWithPlane(plane: Plane) { // 平面与平面的相交线
        if (this.isPlaneParallel(plane)) return undefined;
        const direction = this.normal.cross(plane.normal) as ColVector3D
        return new Line(direction, this.intersectionWithLine(new Line(direction, this.normal.multiplyByNumber(this.d))))
    }

    isPointOnPlane(point: ColVector3D) { // 判断点是否在平面上
        return isZero(this.distanceToPoint(point))
    }

    isLineOnPlane(line: Line) { // 判断直线是否在平面上
        return this.isPointOnPlane(line.point) && isZero(this.normal.dot(line.direction))
    }

    isLineParallel(line: Line) { // 判断平面是否与直线平行
        return isZero(this.normal.dot(line.direction))
    }

    isLineVertical(line: Line) { // 判断平面是否与直线垂直
        return line.isLineParallel(new Line(this.normal))
    }

    isPlaneParallel(plane: Plane) { // 判断平面是否与平面平行
        return isZero((this.normal.cross(plane.normal) as ColVector3D).norm)
    }

    isPlaneVertical(plane: Plane) { // 判断平面是否与平面垂直
        return isZero(this.normal.dot(plane.normal))
    }

    equals(plane: Plane) { // 判断是否相等
        return this.isPlaneParallel(plane) && this.isPointOnPlane(plane.normal.multiplyByNumber(plane.d))
    }

    toString() {
        return `${this.normal.m0}x + ${this.normal.m1}y + ${this.normal.m2}z + ${this.d} = 0`
    }
}

// 过原点的平面
export class PlaneThrough0 extends Plane {
    constructor(normal: ColVector3D) {
        super(normal, 0)
    }

    static FromPointAndNormal(normal: ColVector3D) {
        return new PlaneThrough0(normal)
    }

    static FromPoints(p1: ColVector3D, p2: ColVector3D) {
        return new PlaneThrough0(p1.clone().cross(p2) as ColVector3D)
    }
}
