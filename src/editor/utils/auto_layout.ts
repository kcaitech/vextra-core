import { Artboard, AutoLayout, Page, Shape, ShapeFrame, ShapeType, StackAlign, StackMode, StackSizing, StackWrap } from "../../data";
import { adapt2Shape, ArtboradView, ShapeView } from "../../dataview";
import { Api } from "../coop/recordapi";
import { translate } from "../frame";

export function layoutShapesOrder(shapes: ShapeView[]) {
    let shape_rows: ShapeView[][] = [];
    let unassignedShapes: ShapeView[] = [...shapes];

    while (unassignedShapes.length > 0) {
        // 找出 y + height 最小的图形作为基准图形
        const baseShape = unassignedShapes.reduce((minShape, shape) => {
            const frame = boundingBox(shape.data);
            const min_frame = boundingBox(minShape.data);
            return (frame.y + frame.height < min_frame.y + min_frame.height) ? shape : minShape;
        });

        // 将与基准图形相交的图形放入当前行
        const currentRow = unassignedShapes.filter(shape => {
            const frame = boundingBox(shape.data);
            const base_frame = boundingBox(baseShape.data);
            return frame.y < base_frame.y + base_frame.height && frame.y + frame.height >= base_frame.y;
        });

        // 将当前行按 x 坐标排序
        currentRow.sort((a, b) => {
            const a_frame = boundingBox(a.data);
            const b_frame = boundingBox(b.data);
            if (a_frame.x > b_frame.x) {
                return 1;
            } else {
                return -1;
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
                spacing = shape._p_frame.x - (previousShape._p_frame.x + previousShape._p_frame.width);
                totalHorSpacing += spacing; // 累加水平间距
                horSpacingCount += 1; // 增加水平间距计数
            }
        });
        if (rowIndex > 0) {
            // 计算当前行与上一行之间的垂直间距
            const previousRow = shape_rows[rowIndex - 1];
            const minYOfCurrentRow = Math.min(...row.map(shape => shape._p_frame.y));
            const maxYOfPreviousRow = Math.max(...previousRow.map(shape => shape._p_frame.y + shape._p_frame.height));
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

export const initAutoLayout = (page: Page, api: Api, container: Shape, shape_rows: ShapeView[][]) => {
    const shape_row: ShapeView[] = [];
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

    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = shape._p_frame;
        // 设置新的 x 和 y 坐标

        const transx = leftPadding - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.data.transform.translateX + transx;
        const y = shape.data.transform.translateY + transy;
        api.shapeModifyX(page, adapt2Shape(shape), x);
        api.shapeModifyY(page, adapt2Shape(shape), y);

        max_row_width = Math.max(leftPadding + frame.width, max_row_width);
        max_row_height = Math.max(topPadding + frame.height, max_row_height);
        // 更新当前行的最大高度
        maxHeightInRow = Math.max(maxHeightInRow, frame.height);

        // 更新下一个图形的 x 坐标
        leftPadding += frame.width + horSpacing;

        // 如果下一个矩形放不下了，就换行
        if (i !== shape_row.length - 1 && (leftPadding + shape_row[i + 1]._p_frame.width > (container.size.width - layoutInfo.stackPaddingRight))) {
            leftPadding = layoutInfo.stackHorizontalPadding; // 重置为左边距
            topPadding += maxHeightInRow + verSpacing; // 换行，增加 y 坐标
            maxHeightInRow = 0; // 重置当前行的最大高度
        }
    }
    return { width: max_row_width, height: max_row_height }
}

export const modifyAutoLayout = (page: Page, api: Api, shape: ShapeView) => {
    const layoutInfo = (shape as ArtboradView).data.autoLayout;
    if (!layoutInfo) return;
    const shape_rows = layoutShapesOrder(shape.childs);
    const shape_row: ShapeView[] = [];
    shape_rows.forEach(item => shape_row.push(...item));
    const frame = { width: shape.data.size.width, height: shape.data.size.height }
    if (layoutInfo.stackPrimarySizing === StackSizing.Auto) {
        const { width, height } = autoWidthLayout(page, api, layoutInfo, shape_row, frame);
        api.shapeModifyWidth(page, adapt2Shape(shape), width);
        if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
            api.shapeModifyHeight(page, adapt2Shape(shape), height);
        }
    } else {
        let autoHeight = 0;
        if (!layoutInfo.stackWrap || layoutInfo.stackWrap === StackWrap.Wrap) {
            autoHeight = autoWrapLayout(page, api, layoutInfo, shape_rows, frame);

        } else if (layoutInfo.stackMode === StackMode.Vertical) {
            autoHeight = autoVerticalLayout(page, api, layoutInfo, shape_rows, frame);
        } else {
            autoHeight = autoHorizontalLayout(page, api, layoutInfo, shape_rows, frame);
        }
        if (layoutInfo.stackCounterSizing !== StackSizing.Fixed) {
            api.shapeModifyHeight(page, adapt2Shape(shape), autoHeight);
        }
    }
}

const autoWidthLayout = (page: Page, api: Api, layoutInfo: AutoLayout, shape_row: ShapeView[], container: { width: number, height: number }) => {
    const horSpacing = layoutInfo.stackSpacing; // 水平间距
    const verSpacing = layoutInfo.stackCounterSpacing; //垂直间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距
    const max_height = Math.max(...shape_row.map(shape => boundingBox(shape.data).height));
    const max_width = Math.max(...shape_row.map(shape => boundingBox(shape.data).width));
    let container_auto_width = layoutInfo.stackPaddingRight + layoutInfo.stackHorizontalPadding;
    let container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding;
    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape.data);

        if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                leftPadding += (max_width - frame.width) / 2;
            } else {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    const h = container.height - layoutInfo.stackVerticalPadding - layoutInfo.stackPaddingBottom;
                    topPadding += (h - frame.height) / 2;
                } else {
                    topPadding += (max_height - frame.height) / 2;
                }
            }
        } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
            if (layoutInfo.stackMode === StackMode.Vertical) {
                leftPadding += max_width - frame.width;
            } else {
                if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
                    const h = container.height - layoutInfo.stackVerticalPadding - layoutInfo.stackPaddingBottom;
                    topPadding += h - frame.height;
                } else {
                    topPadding += max_height - frame.height;
                }
            }
        }
        // 设置新的 x 和 y 坐标
        const transx = leftPadding - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.data.transform.translateX + transx;
        const y = shape.data.transform.translateY + transy;
        api.shapeModifyX(page, adapt2Shape(shape), x);
        api.shapeModifyY(page, adapt2Shape(shape), y);
        if (layoutInfo.stackMode === StackMode.Vertical) {
            leftPadding = layoutInfo.stackHorizontalPadding; // 重置为左边距
            topPadding += frame.height + verSpacing; // 换行，增加 y 坐标
            container_auto_height += frame.height + verSpacing;
        } else {
            // 更新下一个图形的 x 坐标
            leftPadding += frame.width + horSpacing;
            topPadding = layoutInfo.stackVerticalPadding;
            container_auto_width += frame.width + horSpacing;
        }
    }
    if (layoutInfo.stackMode === StackMode.Vertical) {
        container_auto_height -= verSpacing;
        container_auto_width += max_width;
    } else {
        container_auto_width -= horSpacing;
        container_auto_height += max_height;
    }
    return { width: container_auto_width, height: container_auto_height }
}

const autoWrapLayout = (page: Page, api: Api, layoutInfo: AutoLayout, shape_rows: ShapeView[][], container: { width: number, height: number }) => {
    const shape_row: ShapeView[] = [];
    shape_rows.forEach(item => shape_row.push(...item));
    let horSpacing = layoutInfo.stackSpacing; // 水平间距
    let verSpacing = layoutInfo.stackCounterSpacing; //垂直间距
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
        let maxHeightInRow = Math.max(...rowShapes.map(s => boundingBox(s.data).height));

        // 检查是否需要换行
        if (index === shape_row.length - 1 || ((rowShapes.reduce((sum, s) => sum + boundingBox(s.data).width, 0) + ((rowShapes.length - 1) * horSpacing) + boundingBox(shape_row[index + 1].data).width + horSpacing) > container_width)) {
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
        const rowWidth = rowShapes.reduce((sum, s) => sum + boundingBox(s.data).width, 0) + ((rowShapes.length - 1) * horSpacing);

        // 检查是否需要换行
        if (i === shape_row.length - 1 || ((rowWidth + boundingBox(shape_row[i + 1].data).width + horSpacing) > container_width)) {
            container_auto_height += maxHeightInRow + verSpacing;
            // 计算行的总宽度
            let startX = layoutInfo.stackHorizontalPadding;
            let horHeight = 0;
            // 计算左侧边距以居中
            if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
                horHeight = (container_width - rowWidth) / Math.max(1, (rowShapes.length - 1));
                if (rowShapes.length === 1) {
                    startX += (container_width / 2) - (rowWidth / 2);
                }
            } else {
                if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
                    startX += (container_width - rowWidth) / 2;
                } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
                    startX += container_width - rowWidth;
                }
            }

            // 布局当前行的矩形并垂直居中
            rowShapes.forEach((s, i) => {
                const frame = boundingBox(s.data);
                let verticalOffset = 0;
                if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
                    verticalOffset = (maxHeightInRow - frame.height) / 2;
                } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
                    verticalOffset = maxHeightInRow - frame.height;
                }
                const transx = startX - frame.x;
                const transy = topPadding + verticalOffset - frame.y;
                const x = s.data.transform.translateX + transx;
                const y = s.data.transform.translateY + transy;

                api.shapeModifyX(page, adapt2Shape(s), x);
                api.shapeModifyY(page, adapt2Shape(s), y);

                startX += frame.width + horHeight + horSpacing;
            });

            // 准备下一行
            rowShapes = [];
            topPadding += maxHeightInRow + verSpacing; // 换行，增加 y 坐标
            rowIndex++;
        }
    }
    container_auto_height -= verSpacing;
    return container_auto_height;
}

const autoHorizontalLayout = (page: Page, api: Api, layoutInfo: AutoLayout, shape_rows: ShapeView[][], container: { width: number, height: number }) => {
    const shape_row: ShapeView[] = [];
    shape_rows.forEach(item => shape_row.push(...item));
    let horSpacing = layoutInfo.stackSpacing; // 水平间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距

    const maxHeightInRow = Math.max(...shape_row.map(s => boundingBox(s.data).height));

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
    const maxWeightInRow = shape_row.reduce((sum, s) => sum + boundingBox(s.data).width, 0) + ((shape_row.length - 1) * horSpacing);
    let maxHorSpacing = 0;
    // 计算左侧边距以居中
    if (layoutInfo.stackHorizontalGapSizing === StackSizing.Auto) {
        const allShapeWidth = shape_row.reduce((sum, s) => sum + boundingBox(s.data).width, 0);
        const maxShapeWidth = Math.max(...shape_row.map(s => boundingBox(s.data).width));
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
        const frame = boundingBox(shape.data);
        let verticalOffset = 0;
        if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
            verticalOffset = (maxHeightInRow - frame.height) / 2;
        } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
            verticalOffset = maxHeightInRow - frame.height;
        }
        const transx = leftPadding - frame.x;
        const transy = topPadding + verticalOffset - frame.y;

        const x = shape.data.transform.translateX + transx;
        const y = shape.data.transform.translateY + transy;

        api.shapeModifyX(page, adapt2Shape(shape), x);
        api.shapeModifyY(page, adapt2Shape(shape), y);
        // 更新当前行的 x 坐标
        leftPadding += frame.width + maxHorSpacing + horSpacing;
    }
    return container_auto_height;
}

const autoVerticalLayout = (page: Page, api: Api, layoutInfo: AutoLayout, shape_rows: ShapeView[][], container: { width: number, height: number }) => {
    const shape_row: ShapeView[] = [];
    shape_rows.forEach(item => shape_row.push(...item));
    let verSpacing = layoutInfo.stackCounterSpacing; //垂直间距
    let leftPadding = layoutInfo.stackHorizontalPadding; //左边距
    let topPadding = layoutInfo.stackVerticalPadding; //上边距

    const container_width = container.width - layoutInfo.stackPaddingRight - layoutInfo.stackHorizontalPadding;
    const container_height = container.height - layoutInfo.stackPaddingBottom - layoutInfo.stackVerticalPadding;

    if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
        verSpacing = 0;
    }

    const maxHeight = shape_row.reduce((sum, s) => sum + boundingBox(s.data).height, 0) + (shape_row.length - 1) * verSpacing;
    let maxVerSpacing = 0;
    if (layoutInfo.stackCounterSizing === StackSizing.Fixed) {
        if (layoutInfo.stackVerticalGapSizing === StackSizing.Auto) {
            const allShapeHeight = shape_row.reduce((sum, s) => sum + boundingBox(s.data).height, 0);
            const maxShapeHeight = Math.max(...shape_row.map(s => boundingBox(s.data).height));
            maxVerSpacing = Math.max(-maxShapeHeight, (container_height - allShapeHeight) / Math.max(1, (shape_row.length - 1)));
            if (shape_row.length === 1) {
                maxVerSpacing += (container_height / 2) - (allShapeHeight / 2);
            }
        } else {
            if (layoutInfo.stackPrimaryAlignItems === StackAlign.Center) {
                topPadding += (container_height - maxHeight) / 2;
            } else if (layoutInfo.stackPrimaryAlignItems === StackAlign.Max) {
                topPadding += container_height - maxHeight;
            }
        }
    }
    const maxWeight = Math.max(...shape_row.map(s => boundingBox(s.data).width));
    // 计算左侧边距以居中
    if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
        leftPadding += (container_width - maxWeight) / 2;
    } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
        leftPadding += container_width - maxWeight;
    }
    let container_auto_height = layoutInfo.stackPaddingBottom + layoutInfo.stackVerticalPadding;
    for (let i = 0; i < shape_row.length; i++) {
        const shape = shape_row[i];
        const frame = boundingBox(shape.data);
        container_auto_height += frame.height + verSpacing;
        let horizontalOffset = 0;
        if (layoutInfo.stackCounterAlignItems === StackAlign.Center) {
            horizontalOffset = (maxWeight - frame.width) / 2;
        } else if (layoutInfo.stackCounterAlignItems === StackAlign.Max) {
            horizontalOffset = maxWeight - frame.width;
        }

        const transx = leftPadding + horizontalOffset - frame.x;
        const transy = topPadding - frame.y;

        const x = shape.data.transform.translateX + transx;
        const y = shape.data.transform.translateY + transy;
        api.shapeModifyX(page, adapt2Shape(shape), x);
        api.shapeModifyY(page, adapt2Shape(shape), y);
        // 更新当前行的 x 坐标
        topPadding += frame.height + verSpacing + Math.max(maxVerSpacing, 0);
    }
    container_auto_height -= verSpacing;
    return container_auto_height;
}


export const getAutoLayoutShapes = (shapes: ShapeView[]) => {
    const parents: ArtboradView[] = [];
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const parent = shape.parent;
        if (parent && (parent as ArtboradView).autoLayout) {
            const hasP = parents.some(item => item.id === parent.id);
            if (!hasP) parents.push(parent as ArtboradView);
        }
    }
    return parents;
}

function boundingBox(shape: Shape): ShapeFrame {
    const path = shape.getPath().clone();
    if (path.length > 0) {
        const m = shape.matrix2Parent();
        path.transform(m);
        const bounds = path.calcBounds();
        return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    const frame = shape.frame;
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