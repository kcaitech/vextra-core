/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { CoopRepository } from "../../../coop";
import { AsyncApiCaller } from "../basic/asyncapi";
import {
    Artboard,
    BorderSideSetting,
    Document,
    StackSizing,
    Page,
    ResizingConstraints2,
    ShapeFrame,
    ShapeSize,
    ShapeType,
    SideType,
    SymbolRefShape,
    TextBehaviour,
    TextShape,
    Transform,
    PathShape,
} from "../../../data";
import {
    ArtboardView,
    adapt2Shape,
    GroupShapeView,
    PageView,
    PathShapeView,
    ShapeView,
    SymbolRefView,
    TextShapeView
} from "../../../dataview";
import { Operator, TextShapeLike } from "../../../coop/recordop";
import { fixTextShapeFrameByLayout } from "../../utils/other";
import { ColVector3D } from "../../../basic/matrix2";
import { XYsBounding } from "../../../io/cilpboard";
import { shape4Autolayout } from "../../symbol";

export type RangeRecorder = Map<string, {
    toRight?: number,
    toBottom?: number,
    centerOffsetLeft?: number,
    centerOffsetTop?: number,
    box?: ShapeFrame
}>;

export type SizeRecorder = Map<string, {
    x: number;
    y: number;
    width: number;
    height: number;
}>;

export type TransformRecorder = Map<string, Transform>;

/**
 * @description shape为父级图层，size发生变化后，子元素需要根据约束条件重新布局(先父级变化再子级重排)
 *
 * · 入口：Scaler的执行函数、宽高属性设置执行函数；
 * · 都把缩放比例传进来，后续都是基于第一帧的值做变换，不再需要计算当前帧状态；
 * · 编组，按跟随缩放处理；
 * · 靠右边、底边固定的需要记录外接盒子距离对应边的偏移；
 * · 水平居中、垂直居中的需要记录外接盒子对应中点的偏移；
 *
 * @param api
 * @param page
 * @param shape
 * @param scale X、Y轴缩放值
 * @param _rangeRecorder 三个Recorder记录的都是起始帧下child的部分属性状态
 * @param _sizeRecorder
 * @param _transformRecorder
 */
export function reLayoutBySizeChanged(
    api: Operator,
    page: Page,
    shape: GroupShapeView,
    scale: { x: number, y: number },
    _rangeRecorder?: RangeRecorder,
    _sizeRecorder?: SizeRecorder,
    _transformRecorder?: TransformRecorder
) {
    const rangeRecorder: RangeRecorder = _rangeRecorder ?? new Map();
    const sizeRecorder: SizeRecorder = _sizeRecorder ?? new Map();
    const transformRecorder: TransformRecorder = _transformRecorder ?? new Map();

    const children = shape.childs;
    // shape收到的两轴缩放值
    const { x: SX, y: SY } = scale;

    if (shape.type === ShapeType.Group || shape.type === ShapeType.BoolShape) {
        // 编组
        const __p_transform = new Transform().scale(SX, SY);
        for (const child of children) {
            const data = adapt2Shape(child);
            const transform = getTransform(child).clone();
            transform.addTransform(__p_transform);
            const _s = transform.decomposeScale();
            const _scale = { x: Math.abs(_s.x), y: Math.abs(_s.y) };
            const oSize = getSize(child);
            const width = oSize.width * Math.abs(_scale.x);
            const height = oSize.height * Math.abs(_scale.y);
            if (child instanceof TextShapeView) {
                fixTextLayout(data as TextShape, oSize, width, height);
            } else {
                api.shapeModifyWH(page, data, width, height)
            }

            transform.clearScaleSize();
            api.shapeModifyTransform(page, data, (transform));

            if (child instanceof GroupShapeView) {
                reLayoutBySizeChanged(api, page, child, _scale, rangeRecorder, sizeRecorder, transformRecorder);
            }
        }
    } else if (!(shape as ArtboardView).autoLayout) {
        // 除去编组，其他容器级别的图层需要根据具体是约束状态进行重新布局
        for (const child of children) {
            const resizingConstraint = child.resizingConstraint ?? 0;

            const oSize = getSize(child);

            const __scale = { x: 1, y: 1 };

            // 预备修改的值
            let targetWidth: number = oSize.width;  // 初始化为固定宽高，下面会根据约束计算最终值
            let targetHeight: number = oSize.height;
            const transform = getTransform(child).clone();

            // 水平
            if (ResizingConstraints2.isHorizontalScale(resizingConstraint)) {
                // 跟随缩放
                const __p_transform_hor_scale = new Transform().scale(SX, 1);

                transform.addTransform(__p_transform_hor_scale);

                const _s = transform.decomposeScale();
                __scale.x *= Math.abs(_s.x);
                __scale.y *= Math.abs(_s.y);

                targetWidth = oSize.width * __scale.x;
                targetHeight = oSize.height * __scale.y;
                transform.clearScaleSize();
            } else if (ResizingConstraints2.isFixedLeftAndRight(resizingConstraint)) {
                // 两边固定，两边固定最难搞了

                // · 保持距离两边的数值不变的情况下，shape宽变化，将对child的width造成影响(注意bounding位置是不受影响的)
                // 比对前后child的width得到ScaleX，根据该值调整水平缩放，实现两边的固定
                const bounding = getBox(child);
                const __to_right = toRight(child);

                const envSize = getSize(shape);

                const __target_width = envSize.width * SX - bounding.x - __to_right;
                const __target_sx = __target_width / bounding.width;

                // 确定一个缩放区域(BSS)：以bounding左上角为原点的一个坐标系
                const __sec_transform = new Transform()
                    .setTranslate(ColVector3D.FromXY(bounding.x, bounding.y));

                // 让图层进入缩放区域(BSS)
                transform.addTransform(__sec_transform.getInverse());

                // 缩放区域(BSS)进行缩放
                const __scale_trans = __sec_transform.setScale(ColVector3D.FromXYZ(__target_sx, 1, 1));

                // 将缩放结果传递到图层身上
                transform.addTransform(__scale_trans);

                // 结算到size上
                const _s = transform.decomposeScale();
                __scale.x *= Math.abs(_s.x);
                __scale.y *= Math.abs(_s.y);

                targetWidth = oSize.width * __scale.x;
                targetHeight = oSize.height * __scale.y;

                transform.clearScaleSize();
            } else {
                // 剩下靠左、靠右、居中，这三个场景都需要分别考虑宽度是否固定，其中如果满足靠左固定并且宽度固定，则不需要重新布局
                if (ResizingConstraints2.isFlexWidth(resizingConstraint)) {
                    // 宽度不固定
                    const __p_transform_hor_scale = new Transform().setScale(ColVector3D.FromXYZ(SX, 1, 1));

                    transform.addTransform(__p_transform_hor_scale);

                    const _s = transform.decomposeScale();
                    __scale.x *= Math.abs(_s.x);
                    __scale.y *= Math.abs(_s.y);

                    targetWidth = oSize.width * __scale.x;
                    targetHeight = oSize.height * __scale.y;

                    transform.clearScaleSize();

                    if (ResizingConstraints2.isFixedToLeft(resizingConstraint)) {
                        // 靠左固定
                        const bounding = getBox(child);
                        transform.translate(ColVector3D.FromXY(-(bounding.x * SX - bounding.x), 0));
                    } else if (ResizingConstraints2.isFixedToRight(resizingConstraint)) {
                        // 靠右固定
                        const __to_right = toRight(child);
                        transform.translate(ColVector3D.FromXY(__to_right * SX - __to_right, 0));
                    } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) {
                        // 居中
                        const __center_offset_left = centerOffsetLeft(child);
                        transform.translate(ColVector3D.FromXY(-(__center_offset_left * SX - __center_offset_left), 0));
                    }
                } else {
                    // 宽度固定
                    if (ResizingConstraints2.isFixedToRight(resizingConstraint)) {
                        const envSize = getSize(shape);
                        // 靠右固定
                        transform.translate(ColVector3D.FromXY((SX - 1) * envSize.width, 0));
                    } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) {
                        const envSize = getSize(shape);
                        // 居中
                        const delta = (envSize.width * SX) / 2 - envSize.width / 2;
                        transform.translate(ColVector3D.FromXY(delta, 0));
                    }
                }
            }

            // 垂直
            if (ResizingConstraints2.isVerticalScale(resizingConstraint)) {
                // 跟随缩放
                const __p_transform_ver_scale = new Transform().setScale(ColVector3D.FromXYZ(1, SY, 1));
                transform.addTransform(__p_transform_ver_scale);

                const _s = transform.decomposeScale();
                __scale.x *= Math.abs(_s.x);
                __scale.y *= Math.abs(_s.y);

                targetWidth = oSize.width * __scale.x;
                targetHeight = oSize.height * __scale.y;
                transform.clearScaleSize();
            } else if (ResizingConstraints2.isFixedTopAndBottom(resizingConstraint)) {
                // 上下固定
                const bounding = getBox(child);
                const __to_bottom = toBottom(child);
                const envSize = getSize(shape);
                const __target_height = envSize.height * SY - bounding.y - __to_bottom;
                const __target_sy = __target_height / bounding.height;

                const __sec_transform = new Transform()
                    .setTranslate(ColVector3D.FromXY(bounding.x, bounding.y));

                transform.addTransform(__sec_transform.getInverse());

                const __scale_trans = __sec_transform.setScale(ColVector3D.FromXYZ(1, __target_sy, 1));

                transform.addTransform(__scale_trans);

                const _s = transform.decomposeScale();
                __scale.x *= Math.abs(_s.x);
                __scale.y *= Math.abs(_s.y);

                targetWidth = oSize.width * __scale.x;
                targetHeight = oSize.height * __scale.y;

                transform.clearScaleSize();
            } else {
                if (ResizingConstraints2.isFlexHeight(resizingConstraint)) {
                    // 高度不固定
                    const __p_transform_ver_scale = new Transform().setScale(ColVector3D.FromXYZ(1, SY, 1));

                    transform.addTransform(__p_transform_ver_scale);

                    const _s = transform.decomposeScale();
                    __scale.x *= Math.abs(_s.x);
                    __scale.y *= Math.abs(_s.y);

                    targetWidth = oSize.width * __scale.x;
                    targetHeight = oSize.height * __scale.y;

                    transform.clearScaleSize();

                    if (ResizingConstraints2.isFixedToTop(resizingConstraint)) {
                        // 靠顶部固定
                        const bounding = getBox(child);
                        transform.translate(ColVector3D.FromXY(0, -(bounding.y * SY - bounding.y)));
                    } else if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                        // 靠底边固定
                        const __to_bottom = toBottom(child);
                        transform.translate(ColVector3D.FromXY(0, __to_bottom * SY - __to_bottom));
                    } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                        // 居中
                        const __center_offset_top = centerOffsetTop(child);
                        transform.translate(ColVector3D.FromXY(0, -(__center_offset_top * SY - __center_offset_top)));
                    }
                } else {
                    // 高度固定
                    if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                        // 靠底边固定
                        const envSize = getSize(shape);
                        transform.translate(ColVector3D.FromXY(0, (SY - 1) * envSize.height));
                    } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                        // 居中
                        const envSize = getSize(shape);
                        const delta = (envSize.height * SY) / 2 - envSize.height / 2;
                        transform.translate(ColVector3D.FromXY(0, delta));
                    }
                }
            }

            const data = adapt2Shape(child);
            // 执行计算结果
            if (child instanceof TextShapeView) {
                fixTextLayout(data as TextShape, oSize, targetWidth, targetHeight)
            } else {
                api.shapeModifyWH(page, data, targetWidth, targetHeight)
            }
            if ((oSize.width !== targetWidth || oSize.height !== targetHeight) && child instanceof SymbolRefView && !child.isCustomSize) {
                api.shapeModifyIsCustomSize(page, data as SymbolRefShape, true)
            }

            api.shapeModifyTransform(page, data, (transform));

            if ((oSize.width !== targetWidth || oSize.height !== targetHeight) && child instanceof GroupShapeView) {
                reLayoutBySizeChanged(api, page, child, __scale, rangeRecorder, sizeRecorder, transformRecorder);
            }
        }
    }

    // utils
    function fixTextLayout(data: TextShape, oSize: {
        width: number,
        height: number
    }, targetWidth: number, targetHeight: number) {
        const isWidthChange = oSize.width !== targetWidth;
        const isHeightChange = oSize.height !== targetHeight;
        const textShape = data as TextShape;
        const behaviour = textShape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        if (isWidthChange && isHeightChange) {
            if (behaviour !== TextBehaviour.FixWidthAndHeight) {
                api.shapeModifyTextBehaviour(page, textShape.text, TextBehaviour.FixWidthAndHeight);
            }
            api.shapeModifyWH(page, textShape, targetWidth, targetHeight);
        } else if (isWidthChange) {
            if (behaviour !== TextBehaviour.Fixed) {
                api.shapeModifyTextBehaviour(page, textShape.text, TextBehaviour.Fixed);
            }
            api.shapeModifyWidth(page, textShape, targetWidth);
        } else if (isHeightChange) {
            if (behaviour !== TextBehaviour.FixWidthAndHeight) {
                api.shapeModifyTextBehaviour(page, textShape.text, TextBehaviour.FixWidthAndHeight);
            }
            api.shapeModifyHeight(page, textShape, targetHeight);
        }
        fixTextShapeFrameByLayout(api, page, textShape);
    }

    function getBox(s: ShapeView) {
        let RR = rangeRecorder.get(s.id);

        if (!RR) {
            RR = {};
            rangeRecorder.set(s.id, RR);
        }

        if (RR.box === undefined) {
            const transform = getTransform(s);

            const size = getSize(s);
            const x = size.x;
            const y = size.y;
            const r = x + size.width;
            const b = y + size.height;
            const box = XYsBounding(transform.transform([
                ColVector3D.FromXY(x, y),
                ColVector3D.FromXY(r, y),
                ColVector3D.FromXY(r, b),
                ColVector3D.FromXY(x, b)
            ]));

            // const box = XYsBounding([cols.col0, cols.col1, cols.col2, cols.col3]);
            RR.box = {
                x: box.left,
                y: box.top,
                width: box.right - box.left,
                height: box.bottom - box.top
            } as ShapeFrame;
        }

        return RR.box;
    }

    function getSize(s: ShapeView) {
        let size = sizeRecorder.get(s.id);
        if (!size) {
            const f = s.frame;
            size = {
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height
            };
            sizeRecorder.set(s.id, size);
        }
        return size;
    }

    function getTransform(s: ShapeView) {
        let transform = transformRecorder.get(s.id);
        if (!transform) {
            transform = (s.transform.clone());
            transformRecorder.set(s.id, transform);
        }
        return transform;
    }

    function toRight(s: ShapeView) {
        let RR = rangeRecorder.get(s.id);
        if (!RR) {
            RR = {};
            rangeRecorder.set(s.id, RR);
        }
        if (RR.toRight === undefined) {
            const bounding = getBox(s);
            RR.toRight = s.parent!.size.width - bounding.x - bounding.width;
        }

        return RR.toRight;
    }

    function centerOffsetLeft(s: ShapeView) {
        let RR = rangeRecorder.get(s.id);
        if (!RR) {
            RR = {};
            rangeRecorder.set(s.id, RR);
        }
        if (RR.centerOffsetLeft === undefined) {
            const bounding = getBox(s);
            RR.centerOffsetLeft = (bounding.x + bounding.width / 2) - shape.size.width / 2;
        }

        return RR.centerOffsetLeft;
    }

    function toBottom(s: ShapeView) {
        let RR = rangeRecorder.get(s.id);
        if (!RR) {
            RR = {};
            rangeRecorder.set(s.id, RR);
        }
        if (RR.toBottom === undefined) {
            const bounding = getBox(s);
            RR.toBottom = s.parent!.size.height - bounding.y - bounding.height;
        }

        return RR.toBottom;
    }

    function centerOffsetTop(s: ShapeView) {
        let RR = rangeRecorder.get(s.id);
        if (!RR) {
            RR = {};
            rangeRecorder.set(s.id, RR);
        }
        if (RR.centerOffsetTop === undefined) {
            const bounding = getBox(s);
            RR.centerOffsetTop = (bounding.y + bounding.height / 2) - shape.size.height / 2;
        }

        return RR.centerOffsetTop;
    }
}

export interface UniformScaleUnit {
    shape: ShapeView;
    transform: Transform;
    size: { width: number, height: number };
    decomposeScale: { x: number, y: number };
}

export function reLayoutByUniformScale(
    api: Operator,
    page: Page,
    shape: GroupShapeView,
    scale: { x: number, y: number },
    container: ShapeView[],
    _rangeRecorder?: RangeRecorder,
    _sizeRecorder?: SizeRecorder,
    _transformRecorder?: TransformRecorder,
    _valueRecorder?: Map<string, number>
) {
    const rangeRecorder: RangeRecorder = _rangeRecorder ?? new Map();
    const sizeRecorder: SizeRecorder = _sizeRecorder ?? new Map();
    const transformRecorder: TransformRecorder = _transformRecorder ?? new Map();
    const valueRecorder: Map<string, number> = _valueRecorder ?? new Map();
    const children = shape.childs;
    const { x: SX, y: SY } = scale;

    const __p_transform = new Transform().setScale(ColVector3D.FromXYZ(SX, SY, 1));

    for (const child of children) {
        container.push(child);
        const data = adapt2Shape(child);
        const transform = getTransform(child).clone();
        transform.addTransform(__p_transform);

        const _s = transform.decomposeScale();
        const _scale = { x: _s.x, y: _s.y };
        const oSize = getSize(child);
        const width = oSize.width * Math.abs(_scale.x);
        const height = oSize.height * Math.abs(_scale.y);
        // if (child instanceof TextShapeView) {
        //     if (width !== child.size.width || height !== child.size.height) {
        //         const textBehaviour = child.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        //         if (height !== child.size.height) {
        //             if (textBehaviour !== TextBehaviour.FixWidthAndHeight) {
        //                 api.shapeModifyTextBehaviour(page, child.text, TextBehaviour.FixWidthAndHeight);
        //             }
        //         } else {
        //             if (textBehaviour === TextBehaviour.Flexible) {
        //                 api.shapeModifyTextBehaviour(page, child.text, TextBehaviour.Fixed);
        //             }
        //         }
        //         api.shapeModifyWH(page, data, width, height)
        //         fixTextShapeFrameByLayout(api, page, child);
        //     }
        // } else {
        //     api.shapeModifyWH(page, data, width, height)
        // }
        api.shapeModifyWH(page, data, width, height)

        transform.clearScaleSize();
        api.shapeModifyTransform(page, data, (transform));

        if (child instanceof GroupShapeView) {
            reLayoutByUniformScale(api, page, child, _scale, container, rangeRecorder, sizeRecorder, transformRecorder, valueRecorder);
        }

        function getSize(s: ShapeView) {
            let size = sizeRecorder.get(s.id);
            if (!size) {
                const f = s.frame;
                size = {
                    x: f.x,
                    y: f.y,
                    width: f.width,
                    height: f.height
                };
                sizeRecorder.set(s.id, size);
            }
            return size;
        }

        function getTransform(s: ShapeView) {
            let transform = transformRecorder.get(s.id);
            if (!transform) {
                transform = (s.transform.clone());
                transformRecorder.set(s.id, transform);
            }
            return transform;
        }
    }
}

export function uniformScale(
    api: Operator,
    page: Page,
    units: UniformScaleUnit[],
    ratio: number,
    _rangeRecorder?: RangeRecorder,
    _sizeRecorder?: SizeRecorder,
    _transformRecorder?: TransformRecorder,
    _valueRecorder?: Map<string, number>
) {
    const rangeRecorder: RangeRecorder = _rangeRecorder ?? new Map();
    const sizeRecorder: SizeRecorder = _sizeRecorder ?? new Map();
    const transformRecorder: TransformRecorder = _transformRecorder ?? new Map();
    const valueRecorder: Map<string, number> = _valueRecorder ?? new Map();
    const container4modifyStyle: ShapeView[] = [];
    const absRatio = Math.abs(ratio);

    for (const unit of units) {
        const { transform, shape: view, size, decomposeScale } = unit;
        const shape = adapt2Shape(view);

        api.shapeModifyTransform(page, shape, transform.clone());
        if (shape.hasSize()) api.shapeModifyWH(page, shape, size.width, size.height);

        if (shape instanceof SymbolRefShape) {
            const scale = getScale(view);
            api.modifyShapeScale(page, shape, scale * absRatio);
            continue;
        }

        container4modifyStyle.push(view);

        if (view instanceof GroupShapeView) reLayoutByUniformScale(api, page, view, decomposeScale, container4modifyStyle, rangeRecorder, sizeRecorder, transformRecorder);
    }
    const textSet: TextShapeLike[] = [];
    for (const view of container4modifyStyle) {
        const shape = adapt2Shape(view);
        const borders = shape.getBorders();
        const bId = shape.id;
        const thicknessTop = getBaseValue(bId, 'thicknessTop', borders.sideSetting.thicknessTop);
        const thicknessLeft = getBaseValue(bId, 'thicknessLeft', borders.sideSetting.thicknessLeft);
        const thicknessBottom = getBaseValue(bId, 'thicknessBottom', borders.sideSetting.thicknessBottom);
        const thicknessRight = getBaseValue(bId, 'thicknessRight', borders.sideSetting.thicknessRight);
        const setting = new BorderSideSetting(
            SideType.Normal,
            thicknessTop * absRatio,
            thicknessLeft * absRatio,
            thicknessBottom * absRatio,
            thicknessRight * absRatio
        );

        api.setBorderSide(shape.getBorders(), setting);
        const shadows = shape.getShadows();
        shadows.forEach(s => {
            const sId = s.id + shape.id;
            const blurRadius = getBaseValue(sId, 'blurRadius', s.blurRadius);
            api.setShadowBlur(s, blurRadius * absRatio);
            const offsetX = getBaseValue(sId, 'offsetX', s.offsetX);
            api.setShadowOffsetX(s, offsetX * absRatio);
            const offsetY = getBaseValue(sId, 'offsetY', s.offsetY);
            api.setShadowOffsetY(s, offsetY * absRatio);
            const spread = getBaseValue(sId, 'spread', s.spread);
            api.setShadowSpread(s, spread * absRatio)
        });
        const blur = view.blur;
        if (blur?.saturation) api.shapeModifyBlurSaturation(blur, blur.saturation * absRatio);

        if (view instanceof TextShapeView) textSet.push(view);
        if (view instanceof SymbolRefView) {
            const scale = getScale(view);
            api.modifyShapeScale(page, shape, scale * absRatio);
        }
        if (view instanceof PathShapeView) {
            const segments = view.segments;
            segments.forEach((segment, i) => {
                const sid = view.id + '-segment-' + segment;
                segment.points.forEach((point, j) => {
                    const pid = sid + '-point-' + j;
                    const corner = getBaseValue(pid, 'radius', point.radius ?? 0);
                    corner && api.modifyPointCornerRadius(page, shape as PathShape, j, corner * absRatio, i);
                });
            });
        }
        if (view.cornerRadius) {
            const cornerId = view.id + 'cornerRadius';
            const lt = getBaseValue(cornerId, 'lt', view.cornerRadius.lt);
            const rt = getBaseValue(cornerId, 'rt', view.cornerRadius.rt);
            const rb = getBaseValue(cornerId, 'rb', view.cornerRadius.rb);
            const lb = getBaseValue(cornerId, 'lb', view.cornerRadius.lb);
            if (lt || rt || rb || lb) api.shapeModifyRadius2(page, shape as Artboard, lt * absRatio, rt * absRatio, rb * absRatio, lb * absRatio);
        }
    }
    for (const textLike of textSet) scale4text(textLike);

    function scale4text(text: TextShapeLike) {
        const paraSpacing = getBaseValue(text.id, 'paraSpacing', text.text.attr?.paraSpacing || 0);
        if (paraSpacing) {
            api.textModifyParaSpacing(page, text, paraSpacing * absRatio, 0, text.text.length);
        }
        const paddingLeft = getBaseValue(text.id, 'paddingLeft', text.text.attr?.padding?.left || 0);
        const paddingRight = getBaseValue(text.id, 'paddingRight', text.text.attr?.padding?.right || 0);

        if (paddingLeft || paddingRight) {
            api.textModifyPaddingHor(page, text, {
                left: (paddingLeft || 0) * absRatio,
                right: (paddingRight || 0) * absRatio
            }, 0, text.text.length);
        }
        let index = 0;
        for (let j = 0; j < text.text.paras.length; j++) {
            const para = text.text.paras[j];
            const pId = text.id + j;
            const minimumLineHeight = getBaseValue(pId, 'minimumLineHeight', para.attr?.minimumLineHeight || 121);
            if (minimumLineHeight) {
                api.textModifyMinLineHeight(page, text, minimumLineHeight * absRatio, index, para.length);
            }
            const maximumLineHeight = getBaseValue(pId, 'maximumLineHeight', para.attr?.maximumLineHeight || 121);
            if (maximumLineHeight) {
                api.textModifyMaxLineHeight(page, text, maximumLineHeight * absRatio, index, para.length);
            }
            let __index = index;
            const spans = para.spans;
            for (let i = 0; i < spans.length; i++) {
                const span = spans[i];
                const sId = text.id + i + j;
                const spanFontSize = getBaseValue(sId, 'spanFontSize', span.fontSize || 0);
                if (spanFontSize) {
                    api.textModifyFontSize(page, text, __index, span.length, spanFontSize * absRatio);
                }
                const spanKerning = getBaseValue(sId, 'spanKerning', span.kerning || 0);
                if (spanKerning) {
                    api.textModifyKerning(page, text, __index, span.length, spanKerning * absRatio);
                }
                __index += span.length;
            }
            index += para.length;
        }
    }

    function getBaseValue(id: string, key: string, current: number) {
        const dKey = id + key;
        let value = valueRecorder.get(dKey)!;
        if (value === undefined) {
            value = current;
            valueRecorder.set(dKey, value);
        }
        return value;
    }

    function getScale(s: ShapeView) {
        let scale = valueRecorder.get(s.id);
        if (scale === undefined) {
            scale = s.uniformScale ?? 1;
            valueRecorder.set(s.id, scale);
        }
        return scale;
    }
}

export class Scaler extends AsyncApiCaller {
    private recorder: RangeRecorder = new Map();
    private sizeRecorder: SizeRecorder = new Map();
    private transformRecorder: TransformRecorder = new Map();
    private valueRecorder: Map<string, number> = new Map();
    protected _page: PageView;

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
        this._page = page;
    }

    start() {
        return this.__repo.start('sync-scale')
    }

    execute(params: {
        shape: ShapeView;
        size: { width: number, height: number },
        scale: { x: number, y: number },
        transform2: Transform,
        w_change: boolean,
        h_change: boolean
    }[]) {
        try {
            const api = this.api;
            const page = this.page;

            const recorder = this.recorder;
            const sizeRecorder = this.sizeRecorder;
            const transformRecorder = this.transformRecorder;
            for (let i = 0; i < params.length; i++) {
                const item = params[i];
                const shape = adapt2Shape(item.shape);
                if (shape instanceof TextShape) {
                    this.fixTextSize(item.shape as TextShapeView, item.size as ShapeSize);
                } else if (shape.hasSize()) {
                    const size = item.size;
                    api.shapeModifyWH(page, shape, size.width, size.height)
                }
                api.shapeModifyTransform(page, shape, item.transform2.clone());
                if (item.shape.autoLayout) {
                    const _shape = shape4Autolayout(api, item.shape, this._page);
                    if (item.w_change) {
                        api.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'hor');
                    }
                    if (item.h_change) {
                        api.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'ver');
                    }
                }
                if (item.shape instanceof GroupShapeView) {
                    const scale = item.scale;
                    reLayoutBySizeChanged(api, page, item.shape, scale, recorder, sizeRecorder, transformRecorder);
                }

                if (shape instanceof SymbolRefShape && !shape.isCustomSize) {
                    api.shapeModifyIsCustomSize(page, shape, true);
                }
            }
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    fixTextSize(view: TextShapeView, targetSize: ShapeSize) {
        const api = this.api;
        const page = this.page;

        const shape = adapt2Shape(view) as TextShape;
        const originSize = this.getSize(view);
        const isWidthChange = targetSize.width !== originSize.width;
        const isHeightChange = targetSize.height !== originSize.height;
        const behaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;

        if (isWidthChange && isHeightChange) {
            if (behaviour !== TextBehaviour.FixWidthAndHeight) {
                api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.FixWidthAndHeight);
            }
            api.shapeModifyWH(page, shape, targetSize.width, targetSize.height);
        } else if (isWidthChange) {
            if (behaviour !== TextBehaviour.Fixed) {
                api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.Fixed);
            }
            api.shapeModifyWidth(page, shape, targetSize.width);
        } else if (isHeightChange) {
            if (behaviour !== TextBehaviour.FixWidthAndHeight) {
                api.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.FixWidthAndHeight);
            }
            api.shapeModifyHeight(page, shape, targetSize.height);
        }
        fixTextShapeFrameByLayout(api, page, shape);
    }

    getSize(view: TextShapeView) {
        let size = this.sizeRecorder.get(view.id);
        if (!size) {
            const f = view.frame;
            size = {
                x: f.x,
                y: f.y,
                width: f.width,
                height: f.height
            };
            this.sizeRecorder.set(view.id, size);
        }
        return size;
    }

    executeUniform(units: UniformScaleUnit[], ratio: number) {
        try {
            uniformScale(this.api, this.page, units, ratio, this.recorder, this.sizeRecorder, this.transformRecorder, this.valueRecorder);
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    commit() {
        super.commit();
    }
}