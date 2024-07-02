import { CoopRepository } from "../../coop/cooprepo";
import { AsyncApiCaller } from "../AsyncApiCaller";
import {
    Document, GroupShape,
    Shape,
    SymbolShape,
    SymbolUnionShape, Page, SymbolRefShape, ShapeType, makeShapeTransform2By1, ResizingConstraints2
} from "../../../data";
import { adapt2Shape, PageView, ShapeView } from "../../../dataview";

import { ColVector3D, makeShapeTransform1By2, Transform as Transform2 } from "../../../index";
import { Api } from "../../coop/recordapi";

export type RangeRecorder = Map<string, {
    toRight?: number,
    toBottom?: number,
    centerOffsetLeft?: number,
    centerOffsetTop?: number
}>;

export type SizeRecorder = Map<string, {
    width: number;
    height: number;
}>;

export type TransformRecorder = Map<string, Transform2>;


/**
 * · 入口：Scaler的执行函数、宽高属性设置执行函数；
 *
 * · 都把缩放比例传进来，后续都是基于第一帧的值做变换，不再需要计算当前帧状态；
 * · 编组，按跟随缩放处理；
 * · 靠右边、底边固定的需要记录外接盒子距离对应边的偏移；
 * · 水平居中、垂直居中的需要记录外接盒子对应中点的偏移；
 */

export function reLayoutBySizeChanged(
    api: Api,
    page: Page,
    shape: GroupShape,
    scale: {
        x: number,
        y: number
    },
    rangeRecorder: RangeRecorder, // 三个Recorder记录的都为起始帧状态
    sizeRecorder: SizeRecorder,
    transformRecorder: TransformRecorder
) {
    const children = shape.childs;
    const { x: sx, y: sy } = scale;

    // 编组
    if (shape.type === ShapeType.Group || shape.type === ShapeType.BoolShape) {
        const __p_transform = new Transform2().setScale(ColVector3D.FromXYZ(sx, sy, 1));

        for (const child of children) {
            const transform = getTransform(child).clone();
            transform.addTransform(__p_transform);

            const _s = transform.decomposeScale();
            const _scale = { x: _s.x, y: _s.y };

            const size = getSize(child);
            api.shapeModifyWH(page, child, size.width * Math.abs(_scale.x), size.height * Math.abs(_scale.y));

            transform.clearScaleSize();
            api.shapeModifyTransform(page, child, makeShapeTransform1By2(transform));

            if (child instanceof GroupShape) {
                reLayoutBySizeChanged(api, page, child, _scale, rangeRecorder, sizeRecorder, transformRecorder);
            }
        }
    } else {
        for (const child of children) {
            // 水平
            const resizingConstraint = child.resizingConstraint ?? ResizingConstraints2.Default;
            const transform = getTransform(child).clone();
            const oSize = getSize(child);

            let targetWidth: number = oSize.width;
            let targetHeight: number = oSize.height;

            if (ResizingConstraints2.isHorizontalScale(resizingConstraint)) {
                const __p_transform_hor_scale = new Transform2().setScale(ColVector3D.FromXYZ(sx, 1, 1));

                transform.addTransform(__p_transform_hor_scale);

                targetWidth = oSize.width * Math.abs(transform.decomposeScale().x);

                transform.clearScaleSize();
            } else {

            }

            // 垂直
            if (ResizingConstraints2.isVerticalScale(resizingConstraint)) {
                const __p_transform_ver_scale = new Transform2().setScale(ColVector3D.FromXYZ(1, sy, 1));

                transform.addTransform(__p_transform_ver_scale);

                targetHeight = oSize.height * Math.abs(transform.decomposeScale().y);

                transform.clearScaleSize();
            } else {

            }

            // 垂直
            api.shapeModifyWH(page, child, targetWidth, targetHeight);
            api.shapeModifyTransform(page, child, makeShapeTransform1By2(transform));
        }
    }

    function getSize(s: Shape) {
        let size = sizeRecorder.get(s.id);
        if (!size) {
            size = {
                width: s.size.width,
                height: s.size.height
            };
            sizeRecorder.set(s.id, size);
        }
        return size;
    }

    function getTransform(s: Shape) {
        let transform = transformRecorder.get(s.id);
        if (!transform) {
            transform = makeShapeTransform2By1(s.transform);
            transformRecorder.set(s.id, transform);
        }
        return transform;
    }
}

export class Scaler extends AsyncApiCaller {
    private recorder: RangeRecorder = new Map();
    private sizeRecorder: SizeRecorder = new Map();
    private transformRecorder: TransformRecorder = new Map;
    private needUpdateCustomSizeStatus: Set<Shape> = new Set();

    constructor(repo: CoopRepository, document: Document, page: PageView) {
        super(repo, document, page);
    }

    start() {
        return this.__repo.start('sync-scale')
    }

    private afterShapeSizeChange() {
        if (!this.needUpdateCustomSizeStatus.size) {
            return;
        }

        const document = this.__document;
        const api = this.api;
        const page = this.page;
        this.needUpdateCustomSizeStatus.forEach(shape => {
            if (shape instanceof SymbolShape && !(shape instanceof SymbolUnionShape)) {
                const symId = shape.id;
                const refs = document.symbolsMgr.getRefs(symId);
                if (!refs) return;
                for (let [k, v] of refs) {
                    if (v.isCustomSize) continue;
                    const page = v.getPage();
                    if (!page) throw new Error();
                    api.shapeModifyWH(page as Page, v, shape.frame.width, shape.frame.height);
                }
            } else if (shape instanceof SymbolRefShape) {
                api.shapeModifyIsCustomSize(page, shape, true);
            }
        })
    }

    execute(params: {
        shape: ShapeView;
        size: { width: number, height: number },
        scale: { x: number, y: number },
        transform2: Transform2,
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
                const size = item.size;
                const scale = item.scale;

                api.shapeModifyWH(page, shape, size.width, size.height);
                api.shapeModifyTransform(page, shape, makeShapeTransform1By2(item.transform2));

                if (shape instanceof GroupShape) {
                    reLayoutBySizeChanged(api, page, shape as GroupShape, scale, recorder, sizeRecorder, transformRecorder);
                }
            }

            this.afterShapeSizeChange();
            this.updateView();
        } catch (error) {
            console.log('error:', error);
            this.exception = true;
        }
    }

    commit() {
        // this.afterShapeSizeChange();
        super.commit();
    }
}