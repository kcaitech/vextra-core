/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {isEqual} from "./number_utils"

export class NumberArray { // 任意维数的Number数组
    dimension: number // 维数
    sizeForDimension: number[] // 各维度的大小
    data: number[]

    // skipFillValueCheck: 跳过填充值检查，用于在填充值为数组时不检查数组的元素类型
    constructor(size: number[], fillValue: number | number[] = 0, skipFillValueCheck = false) {
        if (size.findIndex(item => item < 0) !== -1) throw new Error("各维度的大小不能为负数");
        this.dimension = size.length
        this.sizeForDimension = [...size]
        const length = size.reduce((a, b) => a * b, 1)
        const isFillValueArray = Array.isArray(fillValue)
        if (isFillValueArray) {
            if (fillValue.length !== length) throw new Error("填充数组长度不匹配");
            if (!skipFillValueCheck && fillValue.findIndex(item => typeof item !== "number") !== -1) throw new Error("填充数组元素类型不匹配");
            this.data = fillValue
        } else {
            if (typeof fillValue !== "number") throw new Error("填充值类型不匹配");
            this.data = new Array(length).fill(fillValue)
        }
    }

    getIndex(indexes: number[]): number {
        if (indexes.length !== this.dimension) throw new Error("维数不匹配");
        let i = 0
        for (let j = 0; j < indexes.length; j++) {
            const index = indexes[j]
            if (index < 0 || index >= this.sizeForDimension[j]) throw new Error("索引越界");
            i = i * this.sizeForDimension[j] + index
        }
        return i
    }

    get(indexes: number[]): number {
        return this.data[this.getIndex(indexes)]
    }

    set(indexes: number[], value: number) {
        this.data[this.getIndex(indexes)] = value
    }

    clone(): this {
        const array = new (this.constructor as any)(this.sizeForDimension)
        array.data = this.data.slice()
        return array
    }

    resize(size: number[], fillValue: number = 0) { // 重新设置维数信息，复用底层原数据
        if (size.findIndex(item => item < 0) !== -1) throw new Error("各维度的大小不能为负数");
        const length = size.reduce((a, b) => a * b, 1)
        if (length < this.data.length) this.data = this.data.slice(0, length);
        else if (length > this.data.length) this.data = this.data.concat(new Array(length - this.data.length).fill(fillValue));
        this.dimension = size.length
        this.sizeForDimension = [...size]
        return this
    }

    _toString(indexes: number[]): string { // 从索引位置开始，将剩余维度的数组转换为字符串
        if (indexes.length > this.dimension) throw new Error("维数不匹配");
        if (indexes.length === this.dimension) return this.get(indexes).toString();
        let indent = "\n"
        if (indexes.length > 0) indent += " ".repeat(indexes.length * 2);
        return (indexes.length === 0 ? "" : indent) + "[" // 首行不换行
            + Array.from({length: this.sizeForDimension[indexes.length]}, (_, i) => this._toString([...indexes, i]))
                .join("," + (indexes.length === this.dimension - 1 ? " " : "")) // 最后一维的元素分隔符额外加一个空格
            + (indexes.length === this.dimension - 1 ? "" : ",") // 除最后一维外，每个维度所有元素的末尾加一个逗号
            + (indexes.length === this.dimension - 1 ? "" : indent) + "]" // 除最后一维外，每个维度所有元素末尾的']'前要加换行缩进
    }

    toString() {
        return this._toString([])
    }
}

export class NumberArray2D extends NumberArray { // 二维Number数组
    constructor(size: [number, number], fillValue: number | number[] = 0, skipFillValueCheck = false) {
        if (size.length !== 2) throw new Error("必须为2维");
        super(size, fillValue, skipFillValueCheck)
    }

    getIndex(indexes: number[]): number {
        if (indexes.length !== 2) throw new Error("维数不匹配");
        return indexes[0] * this.sizeForDimension[1] + indexes[1]
    }

    equals(array: NumberArray2D) { // 判断是否相等
        // 判断维度信息是否相等
        if (this.sizeForDimension.length !== array.sizeForDimension.length) return false;
        for (let i = 0; i < this.sizeForDimension.length; i++) if (this.sizeForDimension[i] !== array.sizeForDimension[i]) return false;
        // 判断数据是否相等
        if (this.data.length !== array.data.length) return false;
        for (let i = 0; i < this.data.length; i++) if (!isEqual(this.data[i], array.data[i])) return false;
        return true;
    }

    static FromNumberArray(numberArray: NumberArray) {
        if (numberArray instanceof NumberArray2D) return numberArray;
        if (numberArray.dimension !== 2) throw new Error("numberArray必须是二维数组");
        return new NumberArray2D(numberArray.sizeForDimension as [number, number], numberArray.data, true)
    }

    static BuildIdentity(size: [number, number]) { // 构建m*n数组，n默认为m，主元为1，其余元素为0
        const rowCount = size[0], colCount = size[1]
        if (rowCount === 2 && colCount === 2) {
            return new NumberArray2D([2, 2], [
                1, 0,
                0, 1,
            ], true)
        }
        if (rowCount === 3 && colCount === 3) {
            return new NumberArray2D([3, 3], [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1,
            ], true)
        }
        if (rowCount === 4 && colCount === 4) {
            return new NumberArray2D([4, 4], [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ], true)
        }
        const result = new NumberArray2D(size, 0)
        const rank = Math.min(rowCount, colCount)
        for (let i = 0; i < rank; i++) result.set([i, i], 1);
        return result
    }

    get rowCount() {
        return this.sizeForDimension[0]
    }

    get colCount() {
        return this.sizeForDimension[1]
    }

    rows(m0: number, count?: number) { // 从第m0行开始，获取count行
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        const [m, n] = this.sizeForDimension
        if (count === undefined) count = m - m0;
        if (m0 < 0 || m0 + count > m) throw new Error("行索引越界");
        if (count < 0) throw new Error("行数范围错误");
        return this.data.slice(m0 * n, (m0 + count) * n)
    }

    row(m: number) { // 获取第m行
        return this.rows(m, 1)
    }

    cols(n0: number, count?: number) { // 从第n0列开始，获取count列
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        const [m, n] = this.sizeForDimension
        if (count === undefined) count = n - n0;
        if (n0 < 0 || n0 + count > n) throw new Error("列索引越界");
        if (count < 0) throw new Error("列数范围错误");
        const result = []
        for (let i = n0; i < n0 + count; i++) for (let j = 0; j < m; j++) result.push(this.get([j, i]));
        return result
    }

    col(n: number) { // 获取NumberArray中的第n列
        return this.cols(n, 1)
    }

    insertRows(rowsData: number[] | NumberArray2D, row?: number, skipFillValueCheck = false) { // 插入多行
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        if (rowsData instanceof NumberArray2D) rowsData = rowsData.data;
        if (rowsData.length % this.sizeForDimension[1] !== 0) throw new Error("行数据长度不匹配");
        if (row === undefined) row = this.sizeForDimension[0];
        if (row < 0 || row > this.sizeForDimension[0]) throw new Error("行索引越界");
        if (!skipFillValueCheck && rowsData.findIndex(item => typeof item !== "number") !== -1) throw new Error("填充数组元素类型不匹配");
        this.data.splice(row * this.sizeForDimension[1], 0, ...rowsData)
        this.sizeForDimension[0] += rowsData.length / this.sizeForDimension[1]
        return this
    }

    insertCols(colsData: number[] | NumberArray2D, col?: number, skipFillValueCheck = false) { // 插入多列
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        const [m, n] = this.sizeForDimension
        if (!(colsData instanceof NumberArray2D)) {
            if (colsData.length % m !== 0) throw new Error("列数据长度不匹配");
            colsData = new NumberArray2D([m, colsData.length / m], colsData, skipFillValueCheck);
        }
        if (col === undefined) col = n;
        if (col < 0 || col > n) throw new Error("列索引越界");

        for (let i = colsData.sizeForDimension[1] - 1, l = 0; i >= 0; i--, l++) {
            for (let j = m - 1; j >= 0; j--) {
                this.data.splice(j * (n + l) + col, 0, colsData.get([j, i]))
            }
        }
        this.sizeForDimension[1] += colsData.sizeForDimension[1]
        return this
    }

    deleteRow(row?: number, count = 1) { // 删除多行
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        const [m, n] = this.sizeForDimension
        if (row === undefined) row = m - 1;
        if (row < 0 || row + count > m) throw new Error("行索引越界");
        this.data.splice(row * n, count * n)
        this.sizeForDimension[0] -= count
        return this
    }

    deleteCol(col?: number, count = 1) { // 删除多列
        if (this.dimension !== 2) throw new Error("data必须是二维数组");
        const [m, n] = this.sizeForDimension
        if (col === undefined) col = n - 1;
        if (col < 0 || col + count > n) throw new Error("列索引越界");
        for (let i = m - 1; i >= 0; i--) {
            this.data.splice(i * n + col, count)
        }
        this.sizeForDimension[1] -= count
        return this
    }

    get m00() {
        return this.get([0, 0])
    }

    set m00(value) {
        this.set([0, 0], value)
    }

    get m01() {
        return this.get([0, 1])
    }

    set m01(value) {
        this.set([0, 1], value)
    }

    get m02() {
        return this.get([0, 2])
    }

    set m02(value) {
        this.set([0, 2], value)
    }

    get m03() {
        return this.get([0, 3])
    }

    set m03(value) {
        this.set([0, 3], value)
    }

    get m10() {
        return this.get([1, 0])
    }

    set m10(value) {
        this.set([1, 0], value)
    }

    get m11() {
        return this.get([1, 1])
    }

    set m11(value) {
        this.set([1, 1], value)
    }

    get m12() {
        return this.get([1, 2])
    }

    set m12(value) {
        this.set([1, 2], value)
    }

    get m13() {
        return this.get([1, 3])
    }

    set m13(value) {
        this.set([1, 3], value)
    }

    get m20() {
        return this.get([2, 0])
    }

    set m20(value) {
        this.set([2, 0], value)
    }

    get m21() {
        return this.get([2, 1])
    }

    set m21(value) {
        this.set([2, 1], value)
    }

    get m22() {
        return this.get([2, 2])
    }

    set m22(value) {
        this.set([2, 2], value)
    }

    get m23() {
        return this.get([2, 3])
    }

    set m23(value) {
        this.set([2, 3], value)
    }

    get m30() {
        return this.get([3, 0])
    }

    set m30(value) {
        this.set([3, 0], value)
    }

    get m31() {
        return this.get([3, 1])
    }

    set m31(value) {
        this.set([3, 1], value)
    }

    get m32() {
        return this.get([3, 2])
    }

    set m32(value) {
        this.set([3, 2], value)
    }

    get m33() {
        return this.get([3, 3])
    }

    set m33(value) {
        this.set([3, 3], value)
    }

}
