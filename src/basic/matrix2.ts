/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {NumberArray2D} from "./number_array"
import {isEqual, isOne, isZero} from "./number_utils"

export type Matrix3DKeysType =
    "m00"
    | "m01"
    | "m02"
    | "m03"
    | "m10"
    | "m11"
    | "m12"
    | "m13"
    | "m20"
    | "m21"
    | "m22"
    | "m23"
    | "m30"
    | "m31"
    | "m32"
    | "m33"

export class Matrix { // 矩阵
    data: NumberArray2D

    constructor(data: NumberArray2D);
    constructor(size: [number, number], fillValue?: number | number[], skipFillValueCheck?: boolean);
    constructor(data: NumberArray2D | [number, number], fillValue: number | number[] = 0, skipFillValueCheck = false) {
        if (!(data instanceof NumberArray2D)) data = new NumberArray2D(data, fillValue, skipFillValueCheck);
        if (data.dimension !== 2) throw new Error("data必须是二维数组");
        this.data = data
    }

    static Build(size: [number, number], fillValue?: number) { // 构建m*n的矩阵
        return new Matrix(new NumberArray2D(size, fillValue))
    }

    static BuildIdentity(size: [number, number]) { // 构建m*n矩阵，n默认为m，主元为1，其余元素为0
        return new Matrix(NumberArray2D.BuildIdentity(size))
    }

    static FromMatrix(matrix: Matrix) { // 从矩阵构建矩阵
        return new Matrix(matrix.data)
    }

    get(indexes: number[]): number {
        return this.data.get(indexes)
    }

    set(indexes: number[], value: number) {
        this.data.set(indexes, value)
    }

    clone(): this {
        return new (this.constructor as any)(this.data.clone())
    }

    equals(matrix: Matrix) { // 判断是否相等
        return this.data.equals(matrix.data)
    }

    get rawData() {
        return this.data.data
    }

    get m00() {
        return this.data.m00
    }

    set m00(value: number) {
        this.data.m00 = value
    }

    get m01() {
        return this.data.m01
    }

    set m01(value: number) {
        this.data.m01 = value
    }

    get m02() {
        return this.data.m02
    }

    set m02(value: number) {
        this.data.m02 = value
    }

    get m03() {
        return this.data.m03
    }

    set m03(value: number) {
        this.data.m03 = value
    }

    get m10() {
        return this.data.m10
    }

    set m10(value: number) {
        this.data.m10 = value
    }

    get m11() {
        return this.data.m11
    }

    set m11(value: number) {
        this.data.m11 = value
    }

    get m12() {
        return this.data.m12
    }

    set m12(value: number) {
        this.data.m12 = value
    }

    get m13() {
        return this.data.m13
    }

    set m13(value: number) {
        this.data.m13 = value
    }

    get m20() {
        return this.data.m20
    }

    set m20(value: number) {
        this.data.m20 = value
    }

    get m21() {
        return this.data.m21
    }

    set m21(value: number) {
        this.data.m21 = value
    }

    get m22() {
        return this.data.m22
    }

    set m22(value: number) {
        this.data.m22 = value
    }

    get m23() {
        return this.data.m23
    }

    set m23(value: number) {
        this.data.m23 = value
    }

    get m30() {
        return this.data.m30
    }

    set m30(value: number) {
        this.data.m30 = value
    }

    get m31() {
        return this.data.m31
    }

    set m31(value: number) {
        this.data.m31 = value
    }

    get m32() {
        return this.data.m32
    }

    set m32(value: number) {
        this.data.m32 = value
    }

    get m33() {
        return this.data.m33
    }

    set m33(value: number) {
        this.data.m33 = value
    }

    get size() { // 矩阵的大小
        return [...this.data.sizeForDimension] as [number, number]
    }

    get rowCount() { // 矩阵的行数
        return this.size[0]
    }

    get colCount() { // 矩阵的列数
        return this.size[1]
    }

    get isSquare() { // 判断是否为方阵
        return this.rowCount === this.colCount
    }

    get isIdentity() { // 判断是否为单位矩阵
        const [m, n] = this.size
        if (m !== n) return false;
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (!isEqual(this.get([i, j]), i === j ? 1 : 0)) return false;
        return true
    }

    get isDiagonal() { // 判断是否为对角矩阵
        const [m, n] = this.size
        if (m !== n) return false;
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (i !== j && !isZero(this.get([i, j]))) return false;
        return true
    }

    get isSymmetric() { // 判断是否为对称矩阵
        const [m, n] = this.size
        if (m !== n) return false;
        for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) if (!isEqual(this.get([i, j]), this.get([j, i]))) return false;
        return true
    }

    get isUpperTriangular() { // 判断是否为上三角矩阵
        const [m, n] = this.size
        if (m !== n) return false;
        for (let i = 0; i < m; i++) for (let j = 0; j < i; j++) if (!isZero(this.get([i, j]))) return false;
        return true
    }

    get isLowerTriangular() { // 判断是否为下三角矩阵
        const [m, n] = this.size
        if (m !== n) return false;
        for (let i = 0; i < m; i++) for (let j = i + 1; j < n; j++) if (!isZero(this.get([i, j]))) return false;
        return true
    }

    resize(size: [number, number], fillValue: number = 0) { // 调整矩阵的大小
        const [m0, n0] = this.size
        const [m1, n1] = size

        if (m0 > m1) this.data.deleteRow(m1, m0 - m1);
        else if (m0 < m1) this.data.insertRows(new NumberArray2D([m1 - m0, n1], fillValue), m0, true);

        if (n0 > n1) this.data.deleteCol(n1, n0 - n1);
        else if (n0 < n1) this.data.insertCols(new NumberArray2D([m1, n1 - n0], fillValue), n0, true);

        return this
    }

    forEach(callback: (value: number, indexes: [number, number]) => void) { // 遍历（横向优先）
        const [m, n] = this.size
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) callback(this.get([i, j]), [i, j]);
    }

    flat() { // 转为一维数组（横向优先）
        return this.data.data.slice()
    }

    static FromCols(vectors: ColVector[]) { // 从列向量构建矩阵
        const n = vectors.length
        const m = vectors[0].size[0]
        const result = new NumberArray2D([m, n])
        for (let i = 0; i < n; i++) {
            const vector = vectors[i]
            if (vector.size[0] !== m) throw new Error("列向量的维度不匹配");
            for (let j = 0; j < m; j++) result.set([j, i], vector.get([j, 0]));
        }
        return new Matrix(result)
    }

    static FromRows(vectors: RowVector[]) { // 从行向量构建矩阵
        const m = vectors.length
        const n = vectors[0].size[1]
        const result = new NumberArray2D([m, n])
        for (let i = 0; i < m; i++) {
            const vector = vectors[i]
            if (vector.size[1] !== n) throw new Error("行向量的维度不匹配");
            for (let j = 0; j < n; j++) result.set([i, j], vector.get([0, j]));
        }
        return new Matrix(result)
    }

    col(n: number) { // 获取第n列列向量
        const [_, n0] = this.size
        if (n < 0 || n >= n0) throw new Error("列数越界");
        return new ColVector(this.data.col(n))
    }

    cols(n0: number, count?: number) { // 从第n0列开始，获取count列
        const [_, n] = this.size
        if (count === undefined) count = n - n0;
        if (n0 < 0 || n0 + count > n) throw new Error("列索引越界");
        if (count < 0) throw new Error("列数范围错误");
        const result: ColVector[] = []
        for (let i = n0; i < n0 + count; i++) result.push(this.col(i));
        return result
    }

    allCol() { // 获取所有列向量
        return this.cols(0)
    }

    mapCol<T>(callback: (col: ColVector, colIndex: number, matrix: this) => T) {
        const [_, n] = this.size
        const result: T[] = []
        for (let i = 0; i < n; i++) result.push(callback(this.col(i), i, this));
        return result
    }

    row(m: number) { // 获取第n行行向量
        if (m < 0 || m >= this.size[0]) throw new Error("行数越界");
        return new RowVector(this.data.row(m))
    }

    rows(m0: number, count?: number) { // 从第m0行开始，获取count行
        const [m, n] = this.size
        if (count === undefined) count = m - m0;
        if (m0 < 0 || m0 + count > m) throw new Error("行索引越界");
        if (count < 0) throw new Error("行数范围错误");
        const result: RowVector[] = []
        for (let i = m0; i < m0 + count; i++) result.push(this.row(i));
        return result
    }

    allRow() { // 获取所有行向量
        return this.rows(0)
    }

    mapRow<T>(callback: (row: RowVector, rowIndex: number) => T) {
        const [m, _] = this.size
        const result: T[] = []
        for (let i = 0; i < m; i++) result.push(callback(this.row(i), i));
        return result
    }

    subMatrix(size: [number, number], start: [number, number] = [0, 0]) { // 获取子矩阵
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const [m1, n1] = size
        if (m1 < 0 || n1 < 0) throw new Error("子矩阵大小不能为负");
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");

        const result = new NumberArray2D(size)
        for (let i = 0; i < m1; i++) for (let j = 0; j < n1; j++) result.set([i, j], this.get([i + startRow, j + startCol]));
        return new Matrix(result)
    }

    setSubMatrix(matrix: Matrix, start: [number, number] = [0, 0]) { // 设置矩阵的一部分
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        for (let i = 0; i < m1; i++) for (let j = 0; j < n1; j++) this.set([i + startRow, j + startCol], matrix.get([i, j]));
        return this
    }

    get col0(): ColVector {
        return this.col(0)
    }

    set col0(value: ColVector | number[]) {
        if (!(value instanceof ColVector)) value = new ColVector(value);
        this.setSubMatrix(value)
    }

    get col1(): ColVector {
        return this.col(1)
    }

    set col1(value: ColVector | number[]) {
        if (!(value instanceof ColVector)) value = new ColVector(value);
        this.setSubMatrix(value, [0, 1])
    }

    get col2(): ColVector {
        return this.col(2)
    }

    set col2(value: ColVector | number[]) {
        if (!(value instanceof ColVector)) value = new ColVector(value);
        this.setSubMatrix(value, [0, 2])
    }

    get col3(): ColVector {
        return this.col(3)
    }

    set col3(value: ColVector | number[]) {
        if (!(value instanceof ColVector)) value = new ColVector(value);
        this.setSubMatrix(value, [0, 3])
    }

    get row0(): ColVector {
        return this.row(0)
    }

    set row0(value: RowVector | number[]) {
        if (!(value instanceof RowVector)) value = new RowVector(value);
        this.setSubMatrix(value)
    }

    get row1(): ColVector {
        return this.row(1)
    }

    set row1(value: RowVector | number[]) {
        if (!(value instanceof RowVector)) value = new RowVector(value);
        this.setSubMatrix(value, [1, 0])
    }

    get row2(): ColVector {
        return this.row(2)
    }

    set row2(value: RowVector | number[]) {
        if (!(value instanceof RowVector)) value = new RowVector(value);
        this.setSubMatrix(value, [2, 0])
    }

    get row3(): ColVector {
        return this.row(3)
    }

    set row3(value: RowVector | number[]) {
        if (!(value instanceof RowVector)) value = new RowVector(value);
        this.setSubMatrix(value, [3, 0])
    }

    insertCols(colsData: number[] | NumberArray2D | ColVector | ColVector[], col?: number) { // 插入多列
        if (colsData instanceof ColVector) {
            colsData = colsData.data
        } else if (Array.isArray(colsData) && colsData[0] instanceof ColVector) {
            colsData = (colsData as ColVector[]).reduce((prev, cur) => {
                prev.push(...cur.data.data)
                return prev
            }, [] as number[])
        }
        this.data.insertCols(colsData as number[] | NumberArray2D, col, true)
        return this
    }

    insertRows(rowsData: number[] | NumberArray2D | RowVector | RowVector[], row?: number) { // 插入多行
        if (rowsData instanceof RowVector) {
            rowsData = rowsData.data
        } else if (Array.isArray(rowsData) && rowsData[0] instanceof RowVector) {
            rowsData = (rowsData as RowVector[]).reduce((prev, cur) => {
                prev.push(...cur.data.data)
                return prev
            }, [] as number[])
        }
        this.data.insertRows(rowsData as number[] | NumberArray2D, row, true)
        return this
    }

    deleteCol(col?: number, count = 1) { // 删除多列
        this.data.deleteCol(col, count)
        return this
    }

    deleteRow(row?: number, count = 1) { // 删除多行
        this.data.deleteRow(row, count)
        return this
    }

    transpose() { // 转置
        const [m, n] = this.size
        for (let i = 0; i < m; i++) {
            for (let j = i + 1; j < n; j++) {
                const temp = this.get([i, j])
                this.set([i, j], this.get([j, i]))
                this.set([j, i], temp)
            }
        }
        return new Matrix(this.data)
    }

    transposeSubMatrix(size: number, start: [number, number] = [0, 0]) { // 将矩阵的一部分转置
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const m1 = size, n1 = size
        if (m1 < 0) throw new Error("子矩阵大小不能为负");
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        for (let i = 0; i < m1; i++) for (let j = i + 1; j < n1; j++) {
            const temp = this.get([i + startRow, j + startCol])
            this.set([i + startRow, j + startCol], this.get([j + startRow, i + startCol]))
            this.set([j + startRow, i + startCol], temp)
        }
        return this
    }

    add(matrix: Matrix, start: [number, number] = [0, 0]) { // 矩阵相加，将本矩阵的特定区域与matrix相加
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        for (let i = 0; i < m1; i++) for (let j = 0; j < n1; j++) this.set([i + startRow, j + startCol], this.get([i + startRow, j + startCol]) + matrix.get([i, j]));
        return this
    }

    subtract(matrix: Matrix, start: [number, number] = [0, 0]) { // 矩阵相减，将本矩阵的特定区域与matrix相减
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        for (let i = 0; i < m1; i++) for (let j = 0; j < n1; j++) this.set([i + startRow, j + startCol], this.get([i + startRow, j + startCol]) - matrix.get([i, j]));
        return this
    }

    multiplyByNumber(number: number) { // 矩阵数乘
        const [m, n] = this.size
        for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) this.set([i, j], this.get([i, j]) * number);
        return this
    }

    multiplyByNumberSubMatrix(number: number, size: [number, number], start: [number, number] = [0, 0]) { // 将矩阵的一部分进行数乘操作
        const startRow = start[0]
        const startCol = start[1]
        const [m0, n0] = this.size
        const [m1, n1] = size
        if (m1 < 0 || n1 < 0) throw new Error("子矩阵大小不能为负");
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        for (let i = 0; i < m1; i++) for (let j = 0; j < n1; j++) this.set([i + startRow, j + startCol], this.get([i + startRow, j + startCol]) * number);
        return this
    }

    private _getMultiply(matrix: Matrix) {
        const [m0, n0] = this.size
        const [m1, n1] = matrix.size
        if (n0 !== m1) throw new Error("矩阵阶数不匹配，无法相乘");

        const result = new NumberArray2D([m0, n1])

        const isSquareL = this.isSquare, isSquareR = matrix.isSquare
        const isDiagonalL = this.isDiagonal, isDiagonalR = matrix.isDiagonal

        if (isSquareL && isSquareR && isDiagonalL && isDiagonalR) { // 对角矩阵相乘
            for (let i = 0; i < m0; i++) {
                result.set([i, i], this.get([i, i]) * matrix.get([i, i]))
            }
            return result
        } else if (isDiagonalL) { // 左矩阵为对角矩阵
            for (let i = 0; i < m0; i++) {
                for (let j = 0; j < n1; j++) {
                    result.set([i, j], this.get([i, i]) * matrix.get([i, j]))
                }
            }
            return result
        } else if (isDiagonalR) { // 右矩阵为对角矩阵
            for (let i = 0; i < m0; i++) {
                for (let j = 0; j < n1; j++) {
                    result.set([i, j], matrix.get([j, j]) * this.get([i, j]))
                }
            }
            return result
        }

        for (let i = 0; i < m0; i++) {
            for (let j = 0; j < n1; j++) {
                let sum = 0
                for (let k = 0; k < n0; k++) {
                    sum += this.get([i, k]) * matrix.get([k, j])
                }
                result.set([i, j], sum)
            }
        }
        return result
    }

    multiply(matrix: Matrix): Matrix { // 矩阵相乘，右乘matrix，会修改原矩阵
        this.data = this._getMultiply(matrix)
        return this
    }

    getMultiply(matrix: Matrix) { // 矩阵相乘，右乘matrix，不修改原矩阵，返回新矩阵
        return this.clone().multiply(matrix)
    }

    multiplySubMatrix(matrix: Matrix, size?: [number, number], start: [number, number] = [0, 0]) { // 将矩阵的一部分右乘matrix
        const startRow = start[0]
        const startCol = start[1]

        const [m0, n0] = this.size
        const [m2, n2] = matrix.size

        if (size === undefined) size = [m2, m2];
        const [m1, n1] = size

        if (m1 < 0 || n1 < 0) throw new Error("子矩阵大小不能为负");
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        if (m2 < n1 || n2 < n1) throw new Error("矩阵阶数不匹配，无法相乘");

        this.setSubMatrix(this.subMatrix(size, start).multiply(matrix.clone().resize([n1, n1])), start)

        return this
    }

    getMultiplySubMatrix(matrix: Matrix, size?: [number, number], start: [number, number] = [0, 0]) { // 将矩阵的一部分右乘matrix，不修改原矩阵，返回新矩阵
        return this.clone().multiplySubMatrix(matrix, size, start)
    }

    multiplyRight(matrix: Matrix) { // 矩阵右乘
        return this.multiply(matrix)
    }

    multiplyRightSubMatrix(matrix: Matrix, size?: [number, number], start: [number, number] = [0, 0]) { // 将矩阵的一部分右乘matrix
        return this.multiplySubMatrix(matrix, size, start)
    }

    multiplyLeft(matrix: Matrix) { // 矩阵左乘
        this.data = Matrix.FromMatrix(matrix.clone()).multiply(this).data
        return this
    }

    multiplyLeftSubMatrix(matrix: Matrix, size?: [number, number], start: [number, number] = [0, 0]) { // 将矩阵的一部分左乘matrix
        const startRow = start[0]
        const startCol = start[1]

        const [m0, n0] = this.size
        const [m2, n2] = matrix.size

        if (size === undefined) size = [n2, n2];
        const [m1, n1] = size

        if (m1 < 0 || n1 < 0) throw new Error("子矩阵大小不能为负");
        if (startRow < 0 || startCol < 0 || startRow + m1 > m0 || startCol + n1 > n0) throw new Error("子矩阵范围越界");
        if (m2 < m1 || n2 < m1) throw new Error("矩阵阶数不匹配，无法相乘");

        this.setSubMatrix(Matrix.FromMatrix(matrix.clone().resize([m1, m1])).multiply(this.subMatrix(size, start)), start)

        return this
    }

    getInverse(): Matrix | undefined { // 求逆矩阵（消元法），不修改原矩阵，返回新矩阵
        if (!this.isSquare) throw new Error("矩阵不是方阵，无逆矩阵");
        const m = this.size[0] // 矩阵的阶数

        if (this.isDiagonal) { // 对角矩阵的逆矩阵
            const result = new NumberArray2D([m, m])
            for (let i = 0; i < m; i++) {
                const value = this.get([i, i])
                if (isZero(value)) return; // 对角线上有0，矩阵不可逆
                result.set([i, i], 1 / value)
            }
            return new Matrix(result)
        }

        if (m === 3) {
            const det = this.determinant()
            if (isZero(det)) return; // 行列式为0，矩阵不可逆
            return new Matrix(new NumberArray2D([3, 3], [
                (this.m11 * this.m22 - this.m12 * this.m21) / det, (this.m02 * this.m21 - this.m01 * this.m22) / det, (this.m01 * this.m12 - this.m02 * this.m11) / det,
                (this.m12 * this.m20 - this.m10 * this.m22) / det, (this.m00 * this.m22 - this.m02 * this.m20) / det, (this.m02 * this.m10 - this.m00 * this.m12) / det,
                (this.m10 * this.m21 - this.m11 * this.m20) / det, (this.m01 * this.m20 - this.m00 * this.m21) / det, (this.m00 * this.m11 - this.m01 * this.m10) / det,
            ], true))
        } else if (m === 2) {
            const det = this.determinant()
            if (isZero(det)) return; // 行列式为0，矩阵不可逆
            return new Matrix(new NumberArray2D([2, 2], [
                this.m11 / det, -this.m01 / det,
                -this.m10 / det, this.m00 / det,
            ], true))
        } else if (m === 1) {
            return new Matrix(new NumberArray2D([1, 1], 1 / this.get([0, 0])))
        }

        const result = NumberArray2D.BuildIdentity([m, m]) // 单位矩阵数组
        const data = this.data.clone() // 原矩阵的副本

        const __matrix_getInverse_dev_code = false
        if (__matrix_getInverse_dev_code) {
            console.log("start")
            console.log("m", data.toString())
            console.log("r", result.toString())
            console.log()
        }

        for (let i = 0; i < m; i++) {
            if (__matrix_getInverse_dev_code) console.log("pos " + (i + 1));
            if (isZero(data.get([i, i]))) { // 行首为0，要进行行交换
                let j = i + 1 // 从下一行开始找到行首不为0的行
                for (; j < m; j++) if (!isZero(data.get([j, i]))) break;
                if (j === m) return; // 此列的第i行及以下行全为0，矩阵不可逆
                for (let k = 0; k < m; k++) { // 交换行
                    let temp = data.get([i, k])
                    data.set([i, k], data.get([j, k]))
                    data.set([j, k], temp)
                    temp = result.get([i, k])
                    result.set([i, k], result.get([j, k]))
                    result.set([j, k], temp)
                }
                if (__matrix_getInverse_dev_code) {
                    console.log("row swap")
                    console.log("m", data.toString())
                    console.log("r", result.toString())
                }
            }
            const factor = data.get([i, i]) // 主元
            // 第i行除以factor，使主元为1
            if (!isOne(factor)) {
                data.set([i, i], 1)
                for (let j = i + 1; j < m; j++) data.set([i, j], data.get([i, j]) / factor);
                for (let j = 0; j < m; j++) result.set([i, j], result.get([i, j]) / factor);
            }
            if (__matrix_getInverse_dev_code) {
                console.log("set main 1")
                console.log("m", data.toString())
                console.log("r", result.toString())
            }
            // 其余行减去对应倍数的第i行，使第i列除了主元外全为0
            for (let j = 0; j < m; j++) {
                if (j === i) continue; // 跳过自身
                const factor = data.get([j, i])
                if (isZero(factor)) continue; // 本身为0，不需要处理
                data.set([j, i], 0)
                for (let k = i + 1; k < m; k++) data.set([j, k], data.get([j, k]) - data.get([i, k]) * factor);
                for (let k = 0; k < m; k++) result.set([j, k], result.get([j, k]) - result.get([i, k]) * factor);
            }
            if (__matrix_getInverse_dev_code) {
                console.log("set col 0")
                console.log("m", data.toString())
                console.log("r", result.toString())
                console.log()
            }
        }
        return new Matrix(result)
    }

    negate() { // 取反
        return this.multiplyByNumber(-1)
    }

    getNegate() { // 获取取反后的矩阵，不修改原矩阵，返回新矩阵
        return this.clone().negate()
    }

    rank(): number { // 求矩阵的秩（消元法）
        const [m, n] = this.size // 矩阵的阶数
        const data = this.data.clone() // 原矩阵的副本
        const maxRank = Math.min(m, n) // 秩的最大值
        let rank = 0 // 秩
        for (let i = 0; i < n; i++) { // 遍历列
            // 从第rank行开始，找到第一个非0元素，交换行
            let j = rank
            for (; j < m; j++) if (!isZero(data.get([j, i]))) break;
            if (j === m) continue; // 该列全为0
            // 非本行，交换行
            if (j !== rank) for (let k = 0; k < n; k++) {
                const temp = data.get([rank, k])
                data.set([rank, k], data.get([j, k]))
                data.set([j, k], temp)
            }
            // 本行除以data[rank][i]，使主元为1
            const factor = data.get([rank, i])
            if (!isOne(factor)) {
                data.set([rank, i], 1)
                for (let k = i + 1; k < n; k++) data.set([rank, k], data.get([rank, k]) / factor);
            }
            // 其余行减去对应倍数的第rank行，使第i列除了主元外全为0
            for (let j = 0; j < m; j++) {
                if (j === rank) continue; // 跳过自身
                const factor = data.get([j, i])
                if (isZero(factor)) continue; // 本身为0，不需要处理
                data.set([j, i], 0)
                for (let k = i + 1; k < n; k++) data.set([j, k], data.get([j, k]) - data.get([rank, k]) * factor);
            }
            if (++rank === maxRank) break; // 秩达到最大值，结束
        }
        return rank
    }

    determinant(): number { // 求矩阵的行列式（递归降阶法）
        if (!this.isSquare) throw new Error("矩阵不是方阵，无行列式");

        const [m, n] = this.size // 矩阵的阶数
        if (m === 3) return this.m00 * this.m11 * this.m22 + this.m01 * this.m12 * this.m20 + this.m02 * this.m10 * this.m21
            - this.m02 * this.m11 * this.m20 - this.m01 * this.m10 * this.m22 - this.m00 * this.m12 * this.m21; // 3阶矩阵的行列式
        if (m === 2) return this.m00 * this.m11 - this.m01 * this.m10; // 2阶矩阵的行列式
        if (m === 1) return this.m00; // 1阶矩阵的行列式

        let result = 0
        for (let i = 0; i < n; i++) {
            const factor = this.get([0, i]) // 第0行第i列的元素
            if (isZero(factor)) continue; // 该元素为0，跳过
            const subMatrix = this.clone().deleteRow(0).deleteCol(i) // 去掉第0行和第i列后的子矩阵
            const subDeterminant = subMatrix.determinant() // 子矩阵的行列式
            result += (i % 2 === 0 ? 1 : -1) * factor * subDeterminant // 递归计算行列式
        }

        return result
    }

    getAdjoint(): Matrix { // 求矩阵的伴随矩阵
        if (!this.isSquare) throw new Error("矩阵不是方阵，无伴随矩阵");
        const [m, n] = this.size // 矩阵的阶数
        const result = new NumberArray2D([m, n])
        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                const subMatrix = this.clone().deleteRow(i).deleteCol(j) // 去掉第i行和第j列后的子矩阵
                const subDeterminant = subMatrix.determinant() // 子矩阵的行列式
                result.set([i, j], (i + j) % 2 === 0 ? subDeterminant : -subDeterminant) // 伴随矩阵的元素
            }
        }
        return new Matrix(result)
    }

    normalize() { // 将矩阵的每一列化为单位向量
        const [m, n] = this.size
        for (let i = 0; i < n; i++) {
            let sum = 0
            for (let j = 0; j < m; j++) sum += this.get([j, i]) ** 2;
            sum = Math.sqrt(sum)
            if (!isZero(sum)) for (let j = 0; j < m; j++) this.set([j, i], this.get([j, i]) / sum);
        }
        return this
    }

    normalizeRow() { // 将矩阵的每一行化为单位向量
        return this.transpose().normalize().transpose()
    }

    toString() { // 转为字符串
        return this.data.toString()
    }
}

export class Vector extends Matrix { // 向量
    constructor(data: NumberArray2D) {
        super(data)
        if (this.rowCount !== 1 && this.colCount !== 1) throw new Error("向量的大小必须是n * 1或1 * n");
    }

    static FromMatrix(matrix: Matrix, isCol = true) {
        return new Vector(matrix.data.resize(isCol ? [matrix.data.data.length, 1] : [1, matrix.data.data.length]))
    }

    dot(vector: Vector) { // 点积
        const [m, n] = this.size
        const [m1, n1] = vector.size
        if (m !== m1 || n !== n1) throw new Error("向量维度不匹配");
        let result = 0
        for (let i = 0; i < m; i++) result += this.get([i, 0]) * vector.get([i, 0]);
        return result
    }

    cross(vector: Vector) { // 叉积
        const [m, n] = this.size
        const [m1, n1] = vector.size
        if (m !== m1 || n !== n1) throw new Error("向量维度不匹配");
        const dim = m !== 1 ? m : n
        if (dim !== 2 && dim !== 3) throw new Error("叉积只能用于二维向量或三维向量");
        // 二维向量叉积是标量，三维向量叉积是向量
        const isCol = n === 1
        if (isCol) {
            if (dim === 2) return this.m00 * vector.m10 - vector.m00 * this.m10; // x1 * y2 - x2 * y1
            else return new ColVector3D([
                this.m10 * vector.m20 - vector.m10 * this.m20, // y1 * z2 - y2 * z1
                this.m20 * vector.m00 - vector.m20 * this.m00, // z1 * x2 - z2 * x1
                this.m00 * vector.m10 - vector.m00 * this.m10, // x1 * y2 - x2 * y1
            ]);
        } else {
            if (dim === 2) return this.m00 * vector.m01 - vector.m00 * this.m01; // x1 * y2 - x2 * y1
            else return new ColVector3D([
                this.m01 * vector.m02 - vector.m01 * this.m02, // y1 * z2 - y2 * z1
                this.m02 * vector.m00 - vector.m02 * this.m00, // z1 * x2 - z2 * x1
                this.m00 * vector.m01 - vector.m00 * this.m01, // x1 * y2 - x2 * y1
            ]);
        }
    }

    get norm() { // 模
        return Math.sqrt(this.dot(this))
    }

    angleTo(vector: Vector) { // 本向量与目标向量的夹角（0 ~ π）
        const [m, n] = this.size
        const [m1, n1] = vector.size
        if (m !== m1 || n !== n1) throw new Error("向量维度不匹配");

        const dot = this.dot(vector) // 本向量与目标向量的点积
        return Math.acos(dot / (this.norm * vector.norm))
    }

    get isZero() { // 是否为零向量
        return this.data.data.every(isZero)
    }
}

export class ColVector extends Vector { // 列向量
    constructor(data: number[] | NumberArray2D) {
        if (!(data instanceof NumberArray2D)) data = new NumberArray2D([data.length, 1], data, true);
        super(data)
        if (data.colCount !== 1) throw new Error("列向量必须是n * 1的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof ColVector) return matrix;
        return new ColVector(matrix.data.resize([matrix.data.data.length, 1]))
    }

    get x() {
        return this.m00
    }

    set x(value: number) {
        this.m00 = value
    }

    get y() {
        return this.m10
    }

    set y(value: number) {
        this.m10 = value
    }

    get z() {
        return this.m20
    }

    set z(value: number) {
        this.m20 = value
    }

    get m0() {
        return this.m00
    }

    set m0(value: number) {
        this.m00 = value
    }

    get m1() {
        return this.m10
    }

    set m1(value: number) {
        this.m10 = value
    }

    get m2() {
        return this.m20
    }

    set m2(value: number) {
        this.m20 = value
    }

    get m3() {
        return this.m30
    }

    set m3(value: number) {
        this.m30 = value
    }
}

export class ColVector2D extends ColVector { // 二维列向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[0] !== 2) throw new Error("二维列向量必须是2 * 1的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof ColVector2D) return matrix;
        return new ColVector2D(matrix.data.resize([2, 1]))
    }

    static FromXY(x: number, y: number) {
        return new ColVector2D([x, y])
    }
}

export class ColVector3D extends ColVector { // 三维列向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[0] !== 3) throw new Error("三维列向量必须是3 * 1的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof ColVector3D) return matrix;
        return new ColVector3D(matrix.data.resize([3, 1]))
    }

    static FromXY(x: number, y: number): ColVector3D
    static FromXY(xy: {x: number, y: number}): ColVector3D
    static FromXY(xy: {x: number, y: number} | number, y?: number) {
        return typeof xy === 'number' ? new ColVector3D([xy, y ?? 0, 0]) : new ColVector3D([xy.x, xy.y, 0])
    }

    static FromXYZ(x: number, y: number, z: number) {
        return new ColVector3D([x, y, z])
    }
}

export class ColVector4D extends ColVector { // 四维列向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[0] !== 4) throw new Error("四维列向量必须是4 * 1的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof ColVector4D) return matrix;
        return new ColVector4D(matrix.data.resize([4, 1]))
    }

    static FromXY(x: number, y: number) {
        return new ColVector4D([x, y, 0, 0])
    }

    static FromXYZ(x: number, y: number, z: number) {
        return new ColVector4D([x, y, z, 0])
    }
}

export class RowVector extends Vector { // 行向量
    constructor(data: number[] | NumberArray2D) {
        if (!(data instanceof NumberArray2D)) data = new NumberArray2D([1, data.length], data, true);
        super(data)
        if (data.rowCount !== 1) throw new Error("行向量必须是1 * n的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof RowVector) return matrix;
        return new RowVector(matrix.data.resize([1, matrix.data.data.length]))
    }

    get x() {
        return this.m00
    }

    set x(value: number) {
        this.m00 = value
    }

    get y() {
        return this.m01
    }

    set y(value: number) {
        this.m01 = value
    }

    get z() {
        return this.m02
    }

    set z(value: number) {
        this.m02 = value
    }

    get m0() {
        return this.m00
    }

    set m0(value: number) {
        this.m00 = value
    }

    get m1() {
        return this.m01
    }

    set m1(value: number) {
        this.m01 = value
    }

    get m2() {
        return this.m02
    }

    set m2(value: number) {
        this.m02 = value
    }

    get m3() {
        return this.m03
    }

    set m3(value) {
        this.m03 = value
    }
}

export class RowVector2D extends RowVector { // 二维行向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[1] !== 2) throw new Error("二维行向量必须是1 * 2的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof RowVector2D) return matrix;
        return new RowVector2D(matrix.data.resize([1, 2]))
    }

    static FromXY(x: number, y: number) {
        return new RowVector2D([x, y])
    }
}

export class RowVector3D extends RowVector { // 三维行向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[1] !== 3) throw new Error("三维行向量必须是1 * 3的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof RowVector3D) return matrix;
        return new RowVector3D(matrix.data.resize([1, 3]))
    }

    static FromXY(x: number, y: number) {
        return new RowVector3D([x, y, 0])
    }

    static FromXYZ(x: number, y: number, z: number) {
        return new RowVector3D([x, y, z])
    }
}

export class RowVector4D extends RowVector { // 四维行向量
    constructor(data: number[] | NumberArray2D) {
        super(data)
        if (this.size[1] !== 4) throw new Error("四维行向量必须是1 * 4的矩阵");
    }

    static FromMatrix(matrix: Matrix) {
        if (matrix instanceof RowVector4D) return matrix;
        return new RowVector4D(matrix.data.resize([1, 4]))
    }

    static FromXY(x: number, y: number) {
        return new RowVector4D([x, y, 0, 0])
    }

    static FromXYZ(x: number, y: number, z: number) {
        return new RowVector4D([x, y, z, 0])
    }
}
