/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page, ShapeType } from "../../data";
import { adapt2Shape, ShapeView } from "../../dataview";
import { Api } from "../../coop";

export type TidyUpAlign = 'center' | 'start' | 'end';
export const tidyUpLayout = (page: Page, api: Api, shape_rows: ShapeView[][], horSpacing: number, verSpacing: number, dir_hor: boolean, align: TidyUpAlign, start?: { x: number, y: number }) => {
    const minX = Math.min(...shape_rows[0].map(s => s.relativeFrame.x));
    const minY = Math.min(...shape_rows[0].map(s => s.relativeFrame.y));
    let leftTrans = start?.x || minX; //水平起点
    let topTrans = start?.y || minY; //垂直起点
    const minWidth = Math.min(...shape_rows.map(row => Math.min(...row.map(s => s.relativeFrame.width))));
    const minHeight = Math.min(...shape_rows.map(row => Math.min(...row.map(s => s.relativeFrame.height))));
    horSpacing = Math.max(-minWidth + 1, horSpacing);
    verSpacing = Math.max(-minHeight + 1, verSpacing);
    if (!dir_hor) {
        for (let i = 0; i < shape_rows.length; i++) {
            const shape_row = shape_rows[i];
            if (shape_row.length === 0) continue;
            // 更新当前行的最大高度
            const maxHeightInRow = Math.max(...shape_row.map(s => s.relativeFrame.height));
            for (let i = 0; i < shape_row.length; i++) {
                const shape = shape_row[i];
                const frame = shape.relativeFrame;
                const parent = shape.parent!;
                let transx = 0;
                let transy = 0;
                // 设置新的 x 和 y 坐标
                let verticalOffset = 0;
                if (align === 'center') {
                    verticalOffset = (maxHeightInRow - frame.height) / 2;
                } else if (align === 'end') {
                    verticalOffset = maxHeightInRow - frame.height;
                }
                if (parent.type === ShapeType.Page) {
                    const m = parent.matrix2Root();
                    const box = m.computeCoord2(shape.relativeFrame.x, shape.relativeFrame.y);
                    transx = leftTrans - box.x;
                    transy = topTrans + verticalOffset - box.y;
                } else {
                    transx = leftTrans - frame.x;
                    transy = topTrans + verticalOffset - frame.y;
                }
                const x = shape.transform.translateX + transx;
                const y = shape.transform.translateY + transy;
                api.shapeModifyXY(page, adapt2Shape(shape), x, y);

                // 更新下一个图形的 x 坐标
                leftTrans += frame.width + horSpacing;
            }
            leftTrans = start?.x || minX; // 重置为左边距
            topTrans += maxHeightInRow + verSpacing; // 换行，增加 y 坐标
        }
    } else {
        // 垂直方向
        for (let i = 0; i < shape_rows.length; i++) {
            const shape_row = shape_rows[i];
            if (shape_row.length === 0) continue;
            // 更新当前行的最大宽度
            const maxWidthInRow = Math.max(...shape_row.map(s => s.relativeFrame.width));
            for (let i = 0; i < shape_row.length; i++) {
                const shape = shape_row[i];
                const frame = shape.relativeFrame;
                const parent = shape.parent!;
                let transx = 0;
                let transy = 0;
                // 设置新的 x 和 y 坐标
                let horizontalOffset = 0;
                if (align === 'center') {
                    horizontalOffset = (maxWidthInRow - frame.width) / 2;
                } else if (align === 'end') {
                    horizontalOffset = maxWidthInRow - frame.width;
                }
                if (parent.type === ShapeType.Page) {
                    const m = parent.matrix2Root();
                    const box = m.computeCoord2(shape.relativeFrame.x, shape.relativeFrame.y);
                    transx = leftTrans + horizontalOffset - box.x;
                    transy = topTrans - box.y;
                } else {
                    transx = leftTrans + horizontalOffset - frame.x;
                    transy = topTrans - frame.y;
                }

                const x = shape.transform.translateX + transx;
                const y = shape.transform.translateY + transy;
                api.shapeModifyXY(page, adapt2Shape(shape), x, y);

                // 更新下一个图形的 y 坐标
                topTrans += frame.height + verSpacing;
            }
            topTrans = start?.y || minY; // 重置为上边距
            leftTrans += maxWidthInRow + horSpacing; // 换列，增加 x 坐标
        }
    }
}
