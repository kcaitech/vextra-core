/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CurveMode, CurvePoint } from "./baseclasses";
import { BasicArray } from "./basic";

function hasSetBit(val: number, mask: number): boolean {
    return !(val & mask);
}

function setBit(val: number, mask: number, b: boolean): number {
    return b ? (val ^ mask) : (val ^ (~~mask));
}

export const ResizingConstraints = {
    Mask: 0b111111,
    Unset: 0, // 0
    Right: 0b000001, // 1
    Width: 0b000010, // 2
    Left: 0b000100, // 4
    Bottom: 0b001000, // 8
    Height: 0b010000, // 16
    Top: 0b100000, // 32

    isUnset(val: number): boolean {
        return (val & this.Mask) === this.Unset;
    },

    hasRight(val: number): boolean {
        return hasSetBit(val, this.Right);
    },
    hasWidth(val: number): boolean {
        return hasSetBit(val, this.Width);
    },
    hasLeft(val: number): boolean {
        return hasSetBit(val, this.Left);
    },
    hasBottom(val: number): boolean {
        return hasSetBit(val, this.Bottom);
    },
    hasHeight(val: number): boolean {
        return hasSetBit(val, this.Height);
    },
    hasTop(val: number): boolean {
        return hasSetBit(val, this.Top);
    },
    hasLR(val: number): boolean {
        return this.hasLeft(val) && this.hasRight(val)
    },

    setRight(val: number, b: boolean): number {
        return setBit(val, this.Right, b);
    },
    setWidth(val: number, b: boolean): number {
        return setBit(val, this.Width, b);
    },
    setLeft(val: number, b: boolean): number {
        return setBit(val, this.Left, b);
    },
    setLR(val: number, b: boolean): number {
        return this.setRight(val, b) & this.setLeft(val, b)
    },
    setBottom(val: number, b: boolean): number {
        return setBit(val, this.Bottom, b);
    },
    setHeight(val: number, b: boolean): number {
        return setBit(val, this.Height, b);
    },
    setTop(val: number, b: boolean): number {
        return setBit(val, this.Top, b);
    },
    setTB(val: number, b: boolean): number {
        return this.setTop(val, b) & this.setBottom(val, b)
    },
}

export const ResizingConstraints2 = {
    Mask: 0b11111111, // 255

    Right: 0b00000001, // 1
    Width: 0b00000010, // 2
    Left: 0b00000100, // 4

    Bottom: 0b00001000, // 8
    Height: 0b00010000, // 16
    Top: 0b00100000, // 32

    HCenter: 0b01000000, // 64
    VCenter: 0b10000000, // 128

    Default: 0b00110110,

    // horizontal
    /**
     * @description 靠左固定，为真的前提是：不靠右边、不居中
     */
    isFixedToLeft(val: number): boolean {
        return !!(val & this.Left) && !(val & this.Right) && !(val & this.HCenter);
    },

    /**
     * @description 靠右固定，为真的前提是：不靠左边、不居中
     */
    isFixedToRight(val: number): boolean {
        return !!(val & this.Right) && !(val & this.Left) && !(val & this.HCenter);
    },

    /**
     * @description 靠左靠右固定，为真的前提是：靠左、靠右、不居中
     */
    isFixedLeftAndRight(val: number): boolean {
        return !!(val & this.Left) && !!(val & this.Right) && !(val & this.HCenter);
    },

    /**
     * @description 居中，为真的前提是：居中，不靠左、不靠右
     */
    isHorizontalJustifyCenter(val: number): boolean {
        return !!(val & this.HCenter) && !(val & this.Left) && !(val & this.Right);
    },

    /**
     * @description 水平跟随缩放
     */
    isHorizontalScale(val: number): boolean {
        return !(val & this.Left) && !(val & this.Right) && !(val & this.HCenter);
    },

    /**
     * @description 宽度不固定，为真的前提是：!Width
     */
    isFlexWidth(val: number): boolean {
        return !(val & this.Width);
    },

    /**
     * @description 宽度固定，为真的前提是：Width
     */
    isFixedWidth(val: number): boolean {
        return !!(val & this.Width);
    },

    /**
     * @description 1. 设置为靠左固定
     */
    setToFixedLeft(status: number) {
        status = status & ~this.Right; // 有靠右则取消靠右
        status = status & ~this.HCenter; // 有居中则取消居中

        return status | this.Left;
    },

    /**
     * @description 2. 设置为靠右固定
     */
    setToFixedRight(status: number) {
        status = status & ~this.Left;
        status = status & ~this.HCenter;

        return status | this.Right;
    },

    /**
     * @description 3. 设置为靠左靠右固定
     */
    setToFixedLeftAndRight(status: number) {
        status = status & ~this.Width;
        status = status & ~this.HCenter;

        return status | this.Left | this.Right;
    },

    /**
     * @description 4. 设置为水平居中
     */
    setToHorizontalJustifyCenter(status: number) {
        status = status & ~this.Left;
        status = status & ~this.Right;

        return status | this.HCenter;
    },

    /**
     * @description 5. 设置为水平跟随缩放
     */
    setToScaleByWidth(status: number) {
        return status & ~this.Left & ~this.HCenter & ~this.Right & ~this.Width;
    },

    /**
     * @description 6. 设置为不固定宽度
     */
    setToWidthFlex(status: number) {
        return status & ~this.Width;
    },

    /**
     * @description 7. 设置为固定宽度
     */
    setToWidthFixed(status: number) {
        if ((status & this.Left) && (status & this.Right)) { // 靠左靠右固定不可以设置固定宽度
            return status;
        }
        if (this.isHorizontalScale(status)) { // 水平跟随缩放不可以设置固定宽度
            return status;
        }

        return status | this.Width;
    },

    // Vertical
    isFixedToTop(val: number): boolean {
        return !!(val & this.Top) && !(val & this.Bottom) && !(val & this.VCenter);
    },

    isFixedToBottom(val: number): boolean {
        return !!(val & this.Bottom) && !(val & this.Top) && !(val & this.VCenter);
    },

    isFixedTopAndBottom(val: number): boolean {
        return !!(val & this.Top) && !!(val & this.Bottom) && !(val & this.VCenter);
    },

    isVerticalJustifyCenter(val: number): boolean {
        return !!(val & this.VCenter) && !(val & this.Top) && !(val & this.Bottom);
    },

    isVerticalScale(val: number): boolean {
        return !(val & this.Top) && !(val & this.Bottom) && !(val & this.VCenter);
    },

    isFlexHeight(val: number): boolean {
        return !(val & this.Height);
    },

    isFixedHeight(val: number): boolean {
        return !!(val & this.Height);
    },

    setToFixedTop(status: number) {
        status = status & ~this.Bottom;
        status = status & ~this.VCenter;

        return status | this.Top;
    },

    setToFixedBottom(status: number) {
        status = status & ~this.Top;
        status = status & ~this.VCenter;

        return status | this.Bottom;
    },

    setToFixedTopAndBottom(status: number) {
        status = status & ~this.Height;
        status = status & ~this.VCenter;

        return status | this.Bottom | this.Top;
    },

    setToVerticalJustifyCenter(status: number) {
        status = status & ~this.Top
        status = status & ~this.Bottom

        return status | this.VCenter;
    },

    /**
     * @description 5. 设置为水平跟随缩放
     */
    setToScaleByHeight(status: number) {
        return status & ~this.Top & ~this.VCenter & ~this.Bottom & ~this.Height;
    },

    setToHeightFlex(status: number) {
        return status & ~this.Height
    },

    setToHeightFixed(status: number) {
        if ((status & this.Top) && (status & this.Bottom)) {
            return status;
        }
        if (this.isVerticalScale(status)) {
            return status;
        }

        return status | this.Height;
    },
}

export const RECT_POINTS = (() => {
    const id1 = "f9bbacab-970e-4bb6-9df2-32b02ea26ccc"
    const id2 = "114f9903-1a14-4534-a7bf-ae10c77c39ff"
    const id3 = "a22094f2-6e4d-4d64-ab35-13fe5452f3a5"
    const id4 = "9407a2d0-e77b-4a44-a064-90f611342e39"
    const p1 = new CurvePoint(
        [0] as BasicArray<number>,
        id1, 0, 0, CurveMode.Straight
    );
    const p2 = new CurvePoint(
        [1] as BasicArray<number>,
        id2, 1, 0, CurveMode.Straight
    );
    const p3 = new CurvePoint(
        [2] as BasicArray<number>,
        id3, 1, 1, CurveMode.Straight
    );
    const p4 = new CurvePoint(
        [3] as BasicArray<number>,
        id4, 0, 1, CurveMode.Straight
    );
    return [p1, p2, p3, p4];
})()

export enum PathType {
    Fixed = 0, // 不可编辑路径
    Editable = 1, // 可编辑路径
}

export enum RadiusType {
    None = 0,
    Fixed = 1,
    Rect = 2
}

