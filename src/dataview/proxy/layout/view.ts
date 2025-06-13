/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { fixFrameByConstrain, isDiffScale, isDiffShapeSize, isDiffVarsContainer, ShapeView } from "../../shape";
import { ShapeFrame, ShapeSize, Transform } from "../../../data";
import { isEqual } from "../../../basic/number_utils";
import { PropsType } from "../../viewctx";
import { objectId } from "../../../basic/objectid";

export class ViewLayout {
    constructor(protected view: ShapeView) {
    }

    protected layoutChilds(parentFrame: ShapeSize | undefined, scale?: { x: number, y: number }) {
    }

    protected updateLayoutProps(props: PropsType, needLayout: boolean) {
        const view = this.view;
        if (props.data.id !== view.data.id) throw new Error('id not match');
        const dataChanged = objectId(props.data) !== objectId(view.data);
        if (dataChanged) view.setData(props.data);
        const diffScale = isDiffScale(props.scale, view.props.scale);
        const diffLayoutSize = isDiffShapeSize(props.layoutSize, view.props.layoutSize);
        const diffVars = isDiffVarsContainer(props.varsContainer, view.varsContainer);
        if (!needLayout &&
            !dataChanged &&
            !diffScale &&
            !diffVars &&
            !diffLayoutSize) return false;
        view.props = props;
        view.isVirtual = props.isVirtual;
        if (diffVars) {
            view.ctx.removeDirty(view);
            view.varsContainer = props.varsContainer;
        }
        return true;
    }

    measure(parentFrame: ShapeSize | undefined, scale: { x: number, y: number } | undefined) {
        const view = this.view;
        const shape = view.data;
        const transform = shape.transform.clone();
        if (view.parent && view.parent.autoLayout) {
            transform.translateX = view.transform.translateX;
            transform.translateY = view.transform.translateY;
        }

        // case 1 不需要变形
        if (!scale || isEqual(scale.x, 1) && isEqual(scale.y, 1)) {
            let frame = view.frame;
            if (view.hasSize) frame = view.data.frame;
            this.updateLayoutArgs(transform, frame);
            this.layoutChilds(view.frame);
            this.updateFrames();
            return;
        }

        const skewTransform = (scalex: number, scaley: number) => {
            let t = transform;
            if (scalex !== scaley) {
                t = t.clone();
                t.scale(scalex, scaley);
                // 保留skew去除scale
                t.clearScaleSize();
            }
            return t;
        }

        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        // 当前对象如果没有frame,需要childs layout完成后才有
        // 但如果有constrain,则需要提前计算出frame?当前是直接不需要constrain
        if (!view.hasSize && (resizingConstraint === 0 || !parentFrame)) {
            let frame = view.frame; // 不需要更新
            const t0 = transform.clone();
            t0.scale(scale.x, scale.y);
            const save1 = t0.computeCoord(0, 0);
            const t = skewTransform(scale.x, scale.y).clone();
            const save2 = t.computeCoord(0, 0)
            const dx = save1.x - save2.x;
            const dy = save1.y - save2.y;
            t.trans(dx, dy);
            this.updateLayoutArgs(t, frame);
            this.layoutChilds(undefined, scale);
            this.updateFrames();
            return;
        }

        const size = view.data.size; // 如果是group,实时计算的大小。view中此时可能没有
        const saveW = size.width;
        const saveH = size.height;

        let scaleX = scale.x;
        let scaleY = scale.y;

        if (parentFrame && resizingConstraint !== 0) {
            const { transform, targetWidth, targetHeight } = fixFrameByConstrain(shape, parentFrame, scaleX, scaleY);
            this.updateLayoutArgs((transform), new ShapeFrame(0, 0, targetWidth, targetHeight));
            this.layoutChilds(view.frame, { x: targetWidth / saveW, y: targetHeight / saveH });
        } else {
            const transform = shape.transform.clone();
            transform.scale(scaleX, scaleY);
            const __decompose_scale = transform.clearScaleSize();
            // 这里应该是virtual，是整体缩放，位置是会变化的，不需要trans
            // 保持对象位置不变
            const size = shape.size;
            let layoutSize = new ShapeSize();
            const frame = new ShapeFrame(0, 0, size.width * __decompose_scale.x, size.height * __decompose_scale.y);

            if (view.parent && view.parent.autoLayout) {
                transform.translateX = view.transform.translateX;
                transform.translateY = view.transform.translateY;
            }

            layoutSize.width = frame.width
            layoutSize.height = frame.height
            this.updateLayoutArgs(transform, frame);
            this.layoutChilds(view.frame, { x: frame.width / saveW, y: frame.height / saveH });
        }
        this.updateFrames();
    }

    updateLayoutArgs(trans: Transform, size: ShapeFrame) {
        const view = this.view;
        if (view.frameProxy.updateWHBySize(size)) {
            view.cache.clearCacheByKeys(['m_pathstr', 'm_path'])
        }

        if (!view.transform.equals(trans)) {
            view.transform.reset(trans);
            view.cache.clearCacheByKeys(['m_pathstr', 'm_path'])
        }
    }

    updateFrames() {
        const view = this.view;
        const changed = view.frameProxy.updateFrames();
        if (changed) view.ctx.addNotifyLayout(view);
        return changed;
    }

    // 更新frame, vflip, hflip, rotate, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在data change set)
    // 父级向下更新时带props, 自身更新不带
    layout(props?: PropsType) {
        const view = this.view;
        const needLayout = view.ctx.removeReLayout(view); // remove from changeset
        if (props && !this.updateLayoutProps(props, needLayout)) return;
        view.ctx.setDirty(view);
        this.measure(view.props.layoutSize, view.props.scale);
        view.ctx.addNotifyLayout(view);
    }
}