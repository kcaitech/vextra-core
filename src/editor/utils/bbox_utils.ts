/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ColVector3D } from "../../basic/matrix2";
import { Transform } from "../../basic/transform";

export function getRectBox(transform: Transform, w: number, h: number) { // 获取一个矩形的包围盒
    // 矩形的四个顶点坐标
    const points = [
        new ColVector3D([0, 0, 0]), // 左上
        new ColVector3D([w, 0, 0]), // 右上
        new ColVector3D([w, h, 0]), // 右下
        new ColVector3D([0, h, 0]), // 左下
    ]
    // 变换后的四个顶点坐标
    const newPoints = transform.transform(points)
    // 右左上角坐标
    const minX = Math.min(...newPoints.data.row(0))
    const minY = Math.min(...newPoints.data.row(1))
    // 右下角坐标
    const maxX = Math.max(...newPoints.data.row(0))
    const maxY = Math.max(...newPoints.data.row(1))
    // 从中心点平移回原点
    return {
        lt: {x: minX, y: minY},
        rb: {x: maxX, y: maxY},
        w: maxX - minX,
        h: maxY - minY,
    }
}
