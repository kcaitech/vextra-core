/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ResizingConstraints2 } from "./consts";
import { ShapeSize } from "./typesdefine";

export function fixConstrainFrame(resizingConstraint: number, x: number, y: number, width: number, height: number, scaleX: number, scaleY: number, currentEnvFrame: ShapeSize, originEnvFrame: ShapeSize) {
    // 水平 HORIZONTAL
    if (ResizingConstraints2.isHorizontalScale(resizingConstraint)) { // 跟随缩放。一旦跟随缩放，则不需要考虑其他约束场景了
        x *= scaleX;
        width *= scaleX;
    }
    else if (ResizingConstraints2.isFlexWidth(resizingConstraint)) { // 宽度自由，x、width值都需要根据约束场景变化
        let _width = scaleX * width;

        if (ResizingConstraints2.isFixedToLeft(resizingConstraint)) { // 靠左固定
            width = _width;
        }
        else if (ResizingConstraints2.isFixedToRight(resizingConstraint)) { // 靠右固定                
            const origin_d_to_right = originEnvFrame.width - width - x;
            x = currentEnvFrame.width - _width - origin_d_to_right;
            width = _width;
        }
        else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) { // 居中
            const origin_d_to_center = originEnvFrame.width / 2 - x - width / 2;
            x = currentEnvFrame.width / 2 - origin_d_to_center - _width / 2;
            width = _width;
        }
        else if (ResizingConstraints2.isFixedLeftAndRight(resizingConstraint)) { // 左右固定，通过固定x值来使左边固定，通过修改宽度和水平翻转来使右边固定
            const origin_d_to_right = originEnvFrame.width - width - x;
            width = currentEnvFrame.width - x - origin_d_to_right;
        }
    }
    else { // 宽度固定，只需要修改x值，此场景中不存在左右固定，靠左固定不需要修改x的值，所以只需要处理靠右固定和居中场景
        if (ResizingConstraints2.isFixedToRight(resizingConstraint)) { // 靠右固定，通过修改x值来使图层靠右边固定
            x = currentEnvFrame.width - originEnvFrame.width + x;
        }
        else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) { // 居中
            x = currentEnvFrame.width / 2 - originEnvFrame.width / 2 + x;
        }
    }

    // 垂直 VERTICAL
    if (ResizingConstraints2.isVerticalScale(resizingConstraint)) {
        y *= scaleY;
        height *= scaleY;
    }
    else if (ResizingConstraints2.isFlexHeight(resizingConstraint)) {
        let _height = scaleY * height;

        if (ResizingConstraints2.isFixedToTop(resizingConstraint)) {
            height = _height;
        }
        else if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
            const origin_d_to_bottom = originEnvFrame.height - height - y;
            y = currentEnvFrame.height - _height - origin_d_to_bottom;
            height = _height;
        }
        else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
            const origin_d_to_center = originEnvFrame.height / 2 - y - height / 2;
            y = currentEnvFrame.height / 2 - origin_d_to_center - _height / 2;
            height = _height;
        }
        else if (ResizingConstraints2.isFixedTopAndBottom(resizingConstraint)) {
            const origin_d_to_bottom = originEnvFrame.height - height - y;
            height = currentEnvFrame.height - y - origin_d_to_bottom;
        }
    }
    else {
        if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
            y = currentEnvFrame.height - originEnvFrame.height + y;
        }
        else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
            y = currentEnvFrame.height / 2 - originEnvFrame.height / 2 + y;
        }
    }

    return { x, y, width, height };
}