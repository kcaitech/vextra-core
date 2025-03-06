/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    Artboard,
    BorderPosition,
    GroupShape,
    Page,
    Shape,
    ShapeFrame,
    ShapeType,
} from "../../data";
import { adapt2Shape, ShapeView } from "../../dataview";
import { Api } from "../../coop";

export function layoutShapesOrder(shapes: Shape[], includedBorder: boolean) {
    let shape_rows: Shape[][] = [];
    let unassignedShapes: Shape[] = [...shapes].filter(shape => shape.getVisible());
    while (unassignedShapes.length > 0) {
        // 找出 y + height 最小的图形作为基准图形
        const baseShape = unassignedShapes.reduce((minShape, shape) => {
            const frame = boundingBox(shape, includedBorder);
            const min_frame = boundingBox(minShape, includedBorder);
            return ((frame.y + frame.height) < (min_frame.y + min_frame.height)) ? shape : minShape;
        });
        // 将与基准图形相交的图形放入当前行
        const currentRow = unassignedShapes.filter(shape => {
            const frame = boundingBox(shape, includedBorder);
            const base_frame = boundingBox(baseShape, includedBorder);
            return frame.y < (base_frame.y + base_frame.height)
        });
        if (currentRow.length === 0) {
            currentRow.push(baseShape);
        }
        // 将当前行按 x 坐标排序
        currentRow.sort((a, b) => {
            const a_frame = boundingBox(a);
            const b_frame = boundingBox(b);
            if (a_frame.x > b_frame.x) {
                return 1;
            } else if (a_frame.x < b_frame.x) {
                return -1;
            } else {
                return 1;
            }
        })
        // 保存当前行的图形
        shape_rows.push(currentRow);

        // 从未分配图形中移除当前行的图形
        unassignedShapes = unassignedShapes.filter(shape => !currentRow.includes(shape));
    }
    return shape_rows;
}

export const initAutoLayout = (page: Page, api: Api, container: Shape, shape_rows: Shape[][]) => {
    const shape_row: Shape[] = [];
    shape_rows.forEach(item => shape_row.push(...item));
    const layoutInfo = (container as Artboard).autoLayout;
    if (!layoutInfo) return;
    const horSpacing = layoutInfo.stackSpacing; // 水平间距
    const verSpacing = layoutInfo.stackCounterSpacing; //垂直间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距
    let maxHeightInRow = 0;

    let max_row_width = 0;
    let max_row_height = 0;

    let container_auto_height = topPadding + layoutInfo.stackPaddingBottom;

    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape);
        // 设置新的 x 和 y 坐标

        const transx = leftPadding - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.transform.translateX + transx;
        const y = shape.transform.translateY + transy;
        api.shapeModifyXY(page, (shape), x, y);

        max_row_width = Math.max(leftPadding + frame.width, max_row_width);
        max_row_height = Math.max(topPadding + frame.height, max_row_height);
        // 更新当前行的最大高度
        maxHeightInRow = Math.max(maxHeightInRow, frame.height);

        // 更新下一个图形的 x 坐标
        leftPadding += frame.width + horSpacing;

        // 如果下一个矩形放不下了，就换行
        if (i !== shape_row.length - 1 && (leftPadding + boundingBox(shape_row[i + 1]).width > (container.size.width - layoutInfo.stackPaddingRight))) {
            leftPadding = layoutInfo.stackHorizontalPadding; // 重置为左边距
            topPadding += maxHeightInRow + verSpacing; // 换行，增加 y 坐标
            container_auto_height += maxHeightInRow + verSpacing;
            maxHeightInRow = 0; // 重置当前行的最大高度
        }
    }
    container_auto_height += maxHeightInRow;
    return { width: max_row_width, height: max_row_height, container_hieght: container_auto_height }
}

function boundingBox(shape: Shape, includedBorder?: boolean): ShapeFrame {
    let frame = { ...getShapeFrame(shape) };
    frame.height = Math.max(frame.height, 1);
    frame.width = Math.max(frame.width, 1);
    if (includedBorder) {
        const border = shape.getBorders();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        if (border) {
            const isEnabled = border.strokePaints.some(p => p.isEnabled);
            if (isEnabled) {
                const outer = border.position === BorderPosition.Outer;
                maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
                maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
                maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
                maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
            }

        }
        frame.x -= maxleftborder;
        frame.y -= maxtopborder;
        frame.width += maxleftborder + maxrightborder;
        frame.height += maxtopborder + maxbottomborder;
    }
    const m = shape.transform;
    const corners = [
        { x: frame.x, y: frame.y },
        { x: frame.x + frame.width, y: frame.y },
        { x: frame.x + frame.width, y: frame.y + frame.height },
        { x: frame.x, y: frame.y + frame.height }]
        .map((p) => m.computeCoord(p));
    const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
    const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
    const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
    const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
    return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
}

const getShapeFrame = (shape: Shape) => {
    if (shape.type !== ShapeType.Group) return shape.frame;
    const childframes = (shape as GroupShape).childs.map((c) => c.boundingBox());
    const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
        if (i === 0) {
            p.minx = c.x;
            p.maxx = c.x + c.width;
            p.miny = c.y;
            p.maxy = c.y + c.height;
        } else {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
        }
        return p;
    }
    const bounds = childframes.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
    const { minx, miny, maxx, maxy } = bounds;
    return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
}

export type TidyUpAlgin = 'center' | 'start' | 'end';
export const tidyUpLayout = (page: Page, api: Api, shape_rows: ShapeView[][], horSpacing: number, verSpacing: number, dir_hor: boolean, algin: TidyUpAlgin, start?: { x: number, y: number }) => {
    const minX = Math.min(...shape_rows[0].map(s => s._p_frame.x));
    const minY = Math.min(...shape_rows[0].map(s => s._p_frame.y));
    let leftTrans = start?.x || minX; //水平起点
    let topTrans = start?.y || minY; //垂直起点
    const minWidth = Math.min(...shape_rows.map(row => Math.min(...row.map(s => s._p_frame.width))));
    const minHeight = Math.min(...shape_rows.map(row => Math.min(...row.map(s => s._p_frame.height))));
    horSpacing = Math.max(-minWidth + 1, horSpacing);
    verSpacing = Math.max(-minHeight + 1, verSpacing);
    if (!dir_hor) {
        for (let i = 0; i < shape_rows.length; i++) {
            const shape_row = shape_rows[i];
            if (shape_row.length === 0) continue;
            // 更新当前行的最大高度
            const maxHeightInRow = Math.max(...shape_row.map(s => s._p_frame.height));
            for (let i = 0; i < shape_row.length; i++) {
                const shape = shape_row[i];
                const frame = shape._p_frame;
                const parent = shape.parent!;
                let transx = 0;
                let transy = 0;
                // 设置新的 x 和 y 坐标
                let verticalOffset = 0;
                if (algin === 'center') {
                    verticalOffset = (maxHeightInRow - frame.height) / 2;
                } else if (algin === 'end') {
                    verticalOffset = maxHeightInRow - frame.height;
                }
                if (parent.type === ShapeType.Page) {
                    const m = parent.matrix2Root();
                    const box = m.computeCoord2(shape._p_frame.x, shape._p_frame.y);
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
            const maxWidthInRow = Math.max(...shape_row.map(s => s._p_frame.width));
            for (let i = 0; i < shape_row.length; i++) {
                const shape = shape_row[i];
                const frame = shape._p_frame;
                const parent = shape.parent!;
                let transx = 0;
                let transy = 0;
                // 设置新的 x 和 y 坐标
                let horizontalOffset = 0;
                if (algin === 'center') {
                    horizontalOffset = (maxWidthInRow - frame.width) / 2;
                } else if (algin === 'end') {
                    horizontalOffset = maxWidthInRow - frame.width;
                }
                if (parent.type === ShapeType.Page) {
                    const m = parent.matrix2Root();
                    const box = m.computeCoord2(shape._p_frame.x, shape._p_frame.y);
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
