/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    AutoLayout,
    BorderPosition,
    ShapeFrame,
    ShapeType,
    StackAlign,
    StackMode,
    StackSizing,
    StackWrap
} from "../../data";
import { GroupShapeView, ShapeView } from "../../dataview";

export function layoutShapesOrder2(shapes: ShapeView[], includedBorder: boolean) {
    let shape_rows: ShapeView[][] = [];
    let unassignedShapes: ShapeView[] = [...shapes].filter(shape => shape.isVisible);

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

export function layoutSpacing(shape_rows: ShapeView[][]) {
    let totalHorSpacing = 0; // 用于累计所有水平间距
    let totalVerSpacing = 0; // 用于累计所有垂直间距
    let horSpacingCount = 0; // 记录水平间距的总数
    let verSpacingCount = 0; // 记录垂直间距的总数

    shape_rows.forEach((row, rowIndex) => {
        row.forEach((shape, index) => {
            let spacing = 0;
            if (index > 0) {
                const previousShape = row[index - 1];
                spacing = boundingBox(shape).x - (boundingBox(previousShape).x + boundingBox(previousShape).width);
                totalHorSpacing += spacing; // 累加水平间距
                horSpacingCount += 1; // 增加水平间距计数
            }
        });
        if (rowIndex > 0) {
            // 计算当前行与上一行之间的垂直间距
            const previousRow = shape_rows[rowIndex - 1];
            const minYOfCurrentRow = Math.min(...row.map(shape => boundingBox(shape).y));
            const maxYOfPreviousRow = Math.max(...previousRow.map(shape => boundingBox(shape).y + boundingBox(shape).height));
            const verSpacing = minYOfCurrentRow - maxYOfPreviousRow;

            totalVerSpacing += verSpacing; // 累加垂直间距
            verSpacingCount += 1; // 增加垂直间距计数
        }
    });
    // 计算平均水平间距并向下取整
    const averageHorSpacing = horSpacingCount > 0 ? Math.floor(totalHorSpacing / horSpacingCount) : 0;

    // 计算平均垂直间距并向下取整
    let averageVerSpacing = verSpacingCount > 0 ? Math.floor(totalVerSpacing / verSpacingCount) : 0;
    averageVerSpacing = averageVerSpacing > 0 ? averageVerSpacing : 0;

    return { hor: averageHorSpacing, ver: averageVerSpacing }
}


export const updateAutoLayout = (childs: ShapeView[], layoutInfo: AutoLayout, size: { width: number, height: number }) => {
    const frame = { ...size }
    if (layoutInfo.stackPrimarySizing === StackSizing.Auto) {
        const autoFrame = autoWidthLayout(layoutInfo, childs, frame);
        size.width = autoFrame.width;
        if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
            size.height = autoFrame.height;
        }
        return autoFrame.layout;
    } else {
        if (!layoutInfo.stackWrap || layoutInfo.stackWrap === StackWrap.Wrap) {
            const autoFrame = autoWrapLayout(layoutInfo, childs, frame);
            if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
                size.height = autoFrame.height;
            }
            return autoFrame.layout;
        } else if (layoutInfo.stackMode === StackMode.Vertical) {
            const autoFrame = autoVerticalLayout(layoutInfo, childs, frame);
            if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
                size.height = autoFrame.height;
            }
            return autoFrame.layout;
        } else {
            const autoFrame = autoHorizontalLayout(layoutInfo, childs, frame);
            if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
                size.height = autoFrame.height;
            }
            return autoFrame.layout;
        }
    }
}

const autoWidthLayout = (layoutInfo: AutoLayout, shape_row: ShapeView[], container: {
    width: number,
    height: number
}) => {
    const layoutXY: { x: number, y: number }[] = [];

    // 预计算每个形状的宽度和高度，避免多次调用 boundingBox
    const shapeDimensions = shape_row.map(s => {
        const { width, height } = boundingBox(s, layoutInfo.bordersTakeSpace);
        return { width, height };
    });
    // 计算最小宽度和最小高度
    const minShapeWidth = Math.min(...shapeDimensions.map(d => d.width));
    const minShapeHeight = Math.min(...shapeDimensions.map(d => d.height));
    const horSpacing = Math.max(layoutInfo.stackSpacing, -minShapeWidth); // 水平间距
    let verSpacing = layoutInfo.stackCounterSpacing; //垂直间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距
    const container_height = container.height - layoutInfo.stackPaddingBottom - layoutInfo.stackVerticalPadding;
    const max_height = Math.max(...shapeDimensions.map(d => d.height));
    const max_width = Math.max(...shapeDimensions.map(d => d.width));

    let container_auto_width = layoutInfo.stackPaddingRight + layoutInfo.stackHorizontalPadding;
    let container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding;

    // 计算总高度
    const totalVerHeight = shapeDimensions.reduce((sum, d) => sum + d.height, 0) + (shape_row.length - 1) * verSpacing;
    const totalHeight = shapeDimensions.reduce((sum, d) => sum + d.height, 0);
    let maxVerSpacing = 0;

    if (layoutInfo.stackMode === StackMode.Vertical) {
        verSpacing = Math.max(verSpacing, -minShapeHeight);
        if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
            verSpacing = 0;
            maxVerSpacing = Math.max(-minShapeHeight, (container_height - totalHeight) / Math.max(1, (shape_row.length - 1)));
            if (shape_row.length === 1) {
                const space = (container_height / 2) - (minShapeHeight / 2);
                topPadding += Math.max(space, 0);
            }
        }
    }

    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape, layoutInfo.bordersTakeSpace);
        if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                leftPadding += (max_width - frame.width) / 2;
            }
        } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                leftPadding += max_width - frame.width;
            }
        }
        const h = container.height - layoutInfo.stackVerticalPadding - layoutInfo.stackPaddingBottom;
        if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    topPadding += (h - totalVerHeight) / 2;
                }
            } else {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    topPadding += (h - frame.height) / 2;
                } else {
                    topPadding += (max_height - frame.height) / 2;
                }
            }
        } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    topPadding += h - totalVerHeight;
                }
            } else {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    topPadding += h - frame.height;
                } else {
                    topPadding += max_height - frame.height;
                }
            }
        }
        // 设置新的 x 和 y 坐标
        const transx = leftPadding - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.transform.translateX + transx;
        const y = shape.transform.translateY + transy;

        layoutXY.push({ x, y });

        if (layoutInfo.stackMode === StackMode.Vertical) {
            leftPadding = layoutInfo.stackHorizontalPadding; // 重置为左边距
            topPadding += frame.height + verSpacing + Math.max(maxVerSpacing, 0); // 换行，增加 y 坐标
            container_auto_height += frame.height + verSpacing;
        } else {
            // 更新下一个图形的 x 坐标
            leftPadding += frame.width + horSpacing;
            topPadding = layoutInfo.stackVerticalPadding;
            container_auto_width += frame.width + horSpacing;
        }
    }
    if (layoutInfo.stackMode === StackMode.Vertical) {
        container_auto_height -= (verSpacing + Math.max(maxVerSpacing, 0));
        container_auto_width += max_width;
    } else {
        container_auto_width -= horSpacing;
        container_auto_height += max_height;
    }
    return { width: container_auto_width, height: container_auto_height, layout: layoutXY }
}

const autoWrapLayout = (layoutInfo: AutoLayout, shape_row: ShapeView[], container: {
    width: number,
    height: number
}) => {
    const layoutXY: { x: number, y: number }[] = [];
    const minShapeWidth = Math.min(...shape_row.map(s => boundingBox(s, layoutInfo.bordersTakeSpace).width));
    let horSpacing = Math.max(layoutInfo.stackSpacing, -minShapeWidth); // 水平间距
    let verSpacing = Math.max(layoutInfo.stackCounterSpacing, 0); //垂直间距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距

    const container_width = container.width - layoutInfo.stackPaddingRight - layoutInfo.stackHorizontalPadding;
    const container_height = container.height - layoutInfo.stackPaddingBottom - layoutInfo.stackVerticalPadding;

    // 计算每行的总宽度和最大高度，并计算布局总高度
    let rowShapes: ShapeView[] = [];
    let rowHeights: number[] = [];
    let layoutHeight = 0;
    if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
        horSpacing = 0;
    }
    shape_row.forEach((shape, index) => {
        rowShapes.push(shape);
        let maxHeightInRow = Math.max(...rowShapes.map(s => boundingBox(s, layoutInfo.bordersTakeSpace).height));

        // 检查是否需要换行
        if (index === shape_row.length - 1 || ((rowShapes.reduce((sum, s) => sum + boundingBox(s, layoutInfo.bordersTakeSpace).width, 0) + ((rowShapes.length - 1) * horSpacing) + boundingBox(shape_row[index + 1], layoutInfo.bordersTakeSpace).width + horSpacing) > container_width)) {
            layoutHeight += maxHeightInRow + verSpacing;
            rowHeights.push(maxHeightInRow);
            rowShapes = [];
        }
    });

    let rowIndex = 0;
    // 去掉最后一行多加的垂直间距
    layoutHeight -= verSpacing;

    // 计算整体垂直居中的起始 y 坐标
    if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
        if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
            const allShapeHeight = rowHeights.reduce((sum, height) => sum + height, 0);
            verSpacing = Math.max(0, (container_height - allShapeHeight) / Math.max(1, (rowHeights.length - 1)));
        } else {
            if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
                topPadding += (container_height - layoutHeight) / 2;
            } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
                topPadding += container_height - layoutHeight;
            }
        }
    }
    let container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding;
    rowShapes = [];
    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        rowShapes.push(shape);
        let maxHeightInRow = rowHeights[rowIndex];
        const rowWidth = rowShapes.reduce((sum, s) => sum + boundingBox(s, layoutInfo.bordersTakeSpace).width, 0) + ((rowShapes.length - 1) * horSpacing);
        // 检查是否需要换行
        if (i === shape_row.length - 1 || ((rowWidth + boundingBox(shape_row[i + 1], layoutInfo.bordersTakeSpace).width + horSpacing) > container_width)) {
            container_auto_height += maxHeightInRow + verSpacing;
            // 计算行的总宽度
            let startX = layoutInfo.stackHorizontalPadding;
            let horHeight = 0;
            // 计算左侧边距以居中
            if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
                horHeight = (container_width - rowWidth) / Math.max(1, (rowShapes.length - 1));
                // if (rowShapes.length === 1) {
                //     startX += (container_width / 2) - (rowWidth / 2);
                // }
            } else {
                if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
                    startX += (container_width - rowWidth) / 2;
                } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
                    startX += container_width - rowWidth;
                }
            }

            // 布局当前行的矩形并垂直居中
            rowShapes.forEach((s, i) => {
                const frame = boundingBox(s, layoutInfo.bordersTakeSpace);

                let verticalOffset = 0;
                if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
                    verticalOffset = (maxHeightInRow - frame.height) / 2;
                } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
                    verticalOffset = maxHeightInRow - frame.height;
                }
                const transx = startX - frame.x;
                const transy = topPadding + verticalOffset - frame.y;
                const x = s.transform.translateX + transx;
                const y = s.transform.translateY + transy;

                layoutXY.push({ x, y });

                startX += frame.width + horHeight + horSpacing;
            });

            // 准备下一行
            rowShapes = [];
            topPadding += maxHeightInRow + verSpacing; // 换行，增加 y 坐标
            rowIndex++;
        }
    }
    container_auto_height -= verSpacing;
    return { height: container_auto_height, layout: layoutXY };
}

const autoHorizontalLayout = (layoutInfo: AutoLayout, shape_row: ShapeView[], container: {
    width: number,
    height: number
}) => {
    const layoutXY: { x: number, y: number }[] = [];
    const shapeDimensions = shape_row.map(s => {
        const { width, height } = boundingBox(s, layoutInfo.bordersTakeSpace);
        return { width, height };
    });

    const minShapeWidth = Math.min(...shapeDimensions.map(d => d.width));
    let horSpacing = Math.max(layoutInfo.stackSpacing, -minShapeWidth); // 水平间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距

    const maxHeightInRow = Math.max(...shapeDimensions.map(d => d.height));

    const container_width = container.width - layoutInfo.stackPaddingRight - layoutInfo.stackHorizontalPadding;
    const container_height = container.height - layoutInfo.stackPaddingBottom - layoutInfo.stackVerticalPadding;

    // 计算整体垂直居中的起始 y 坐标
    if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
        if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
            topPadding += (container_height - maxHeightInRow) / 2;
        } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
            topPadding += container_height - maxHeightInRow;
        }
    }
    if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
        horSpacing = 0;
    }
    // 计算行的总宽度

    const maxWeightInRow = shapeDimensions.reduce((sum, d) => sum + d.width, 0) + ((shape_row.length - 1) * horSpacing);
    let maxHorSpacing = 0;
    // 计算左侧边距以居中
    if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
        const allShapeWidth = shapeDimensions.reduce((sum, d) => sum + d.width, 0);
        const maxShapeWidth = Math.max(...shapeDimensions.map(d => d.width));
        maxHorSpacing = Math.max(-maxShapeWidth, (container_width - allShapeWidth) / Math.max(1, (shape_row.length - 1)));
        if (shape_row.length === 1) {
            maxHorSpacing += (container_width / 2) - (allShapeWidth / 2);
        }
    } else {
        if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
            leftPadding += (container_width - maxWeightInRow) / 2;
        } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
            leftPadding += container_width - maxWeightInRow;
        }
    }
    const container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding + maxHeightInRow;
    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape, layoutInfo.bordersTakeSpace);
        let verticalOffset = 0;
        if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
            verticalOffset = (maxHeightInRow - frame.height) / 2;
        } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
            verticalOffset = maxHeightInRow - frame.height;
        }
        const transx = leftPadding - frame.x;
        const transy = topPadding + verticalOffset - frame.y;

        const x = shape.transform.translateX + transx;
        const y = shape.transform.translateY + transy;

        layoutXY.push({ x, y });

        // 更新当前行的 x 坐标
        leftPadding += frame.width + maxHorSpacing + horSpacing;
    }
    return { height: container_auto_height, layout: layoutXY };
}

const autoVerticalLayout = (layoutInfo: AutoLayout, shape_row: ShapeView[], container: {
    width: number,
    height: number
}) => {
    const layoutXY: { x: number, y: number }[] = [];
    const shapeDimensions = shape_row.map(s => {
        const { width, height } = boundingBox(s, layoutInfo.bordersTakeSpace);
        return { width, height };
    });
    const minShapeHeight = Math.min(...shapeDimensions.map(d => d.height));
    let verSpacing = Math.max(layoutInfo.stackCounterSpacing, -minShapeHeight); //垂直间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距

    const container_width = container.width - layoutInfo.stackPaddingRight - layoutInfo.stackHorizontalPadding;
    const container_height = container.height - layoutInfo.stackPaddingBottom - layoutInfo.stackVerticalPadding;

    if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
        verSpacing = 0;
    }

    const maxHeight = shapeDimensions.reduce((sum, d) => sum + d.height, 0) + (shape_row.length - 1) * verSpacing;
    let maxVerSpacing = 0;
    if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
        if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
            const totalHeight = shapeDimensions.reduce((sum, d) => sum + d.height, 0);
            maxVerSpacing = Math.max(-minShapeHeight, (container_height - totalHeight) / Math.max(1, (shape_row.length - 1)));
            if (shape_row.length === 1) {
                const space = (container_height / 2) - (totalHeight / 2);
                topPadding += Math.max(space, 0);
            }
        } else {
            if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
                topPadding += (container_height - maxHeight) / 2;
            } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
                topPadding += container_height - maxHeight;
            }
        }
    }
    const maxWeight = Math.max(...shapeDimensions.map(d => d.width));
    // 计算左侧边距以居中
    if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
        leftPadding += (container_width - maxWeight) / 2;
    } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
        leftPadding += container_width - maxWeight;
    }
    let container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding;
    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape, layoutInfo.bordersTakeSpace);
        container_auto_height += frame.height + verSpacing;
        let horizontalOffset = 0;
        if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
            horizontalOffset = (maxWeight - frame.width) / 2;
        } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
            horizontalOffset = maxWeight - frame.width;
        }

        const transx = leftPadding + horizontalOffset - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.transform.translateX + transx;
        const y = shape.transform.translateY + transy;

        layoutXY.push({ x, y });
        // 更新当前行的 x 坐标
        topPadding += frame.height + verSpacing + maxVerSpacing;
    }
    container_auto_height -= verSpacing + maxVerSpacing;
    return { height: container_auto_height, layout: layoutXY };
}

function boundingBox(shape: ShapeView, includedBorder?: boolean): ShapeFrame {
    let frame = { ...getShapeFrame(shape) };
    frame.height = Math.max(frame.height, 1);
    frame.width = Math.max(frame.width, 1);
    if (includedBorder) {
        const border = shape.getBorder();
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

export const getShapeFrame = (shape: ShapeView) => {
    if (shape.type !== ShapeType.Group) {
        const { x, y, height, width } = shape.frame;
        return new ShapeFrame(x, y, width, height);
    }
    const childframes = (shape as GroupShapeView).childs.map((c) => c.boundingBox());
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