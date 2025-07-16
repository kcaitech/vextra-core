/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewLayout } from "./view";
import { AutoLayout, Shape, ShapeFrame, ShapeSize, ShapeType, SymbolRefShape, SymbolUnionShape } from "../../../data";
import { DataView, RootView } from "../../view";
import { PropsType, VarsContainer } from "../../viewctx";
import { getShapeViewId } from "../../basic";
import { SymbolRefView } from "../../symbolref";
import { ArtboardView } from "../../artboard";
import { isEqual } from "../../../basic/number_utils";
import { fixFrameByConstrain } from "../../shape";
import { updateAutoLayout } from "./auto_layout2";

export class RefLayout extends ViewLayout {
    constructor(protected view: SymbolRefView) {
        super(view);
    }

    private _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
        const view = this.view;
        if (!view.symData?.autoLayout) return;
        const childs = view.childs.filter(c => c.isVisible);
        const layout = updateAutoLayout(childs, autoLayout, layoutSize);
        let hidden = 0;
        for (let i = 0, len = view.childs.length; i < len; i++) {
            const cc = view.childs[i];
            const newTransform = cc.transform.clone();
            const index = Math.min(i - hidden, layout.length - 1);
            newTransform.translateX = layout[index].x;
            newTransform.translateY = layout[index].y;
            if (!cc.isVisible) {
                hidden += 1;
            }
            cc.ctx.setDirty(cc);
            cc.layoutProxy.updateLayoutArgs(newTransform, cc.frame);
            cc.layoutProxy.updateFrames();
        }
        const selfframe = new ShapeFrame(0, 0, layoutSize.width, layoutSize.height);
        this.updateLayoutArgs(view.transform, selfframe);
    }

    protected layoutChild(
        parentFrame: ShapeSize | undefined,
        child: Shape,
        idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined
    ) {
        const view = this.view;
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, scale, varsContainer, isVirtual: true, layoutSize: parentFrame };

        if (cdom) {
            const changed = view.moveChild(cdom, idx);
            cdom.layout(props);
            return changed;
        }

        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            view.addChild(cdom, idx);
            cdom.layout(props);
            return true;
        }

        const comsMap = view.ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(view.ctx, props) as DataView;
        view.addChild(cdom, idx);
        return true;
    }

    protected layoutChilds(parentFrame: ShapeSize, scale?: { x: number, y: number }) {
        const view = this.view;
        const varsContainer = (view.varsContainer || []).concat(view.data as SymbolRefShape);
        if (view.m_sym!.parent instanceof SymbolUnionShape) {
            varsContainer.push(view.m_sym!.parent);
        }
        varsContainer.push(view.m_sym!);

        const childs = view.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        view.children.forEach((c) => resue.set(c.data.id, c));
        const rootView = view.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i];
            // update childs
            if (this.layoutChild(parentFrame, cc, i, scale, varsContainer, resue, rootView)) changed = true;
        }

        // 删除多余的
        if (view.children.length > childs.length) {
            const removes = view.removeChilds(childs.length, Number.MAX_VALUE);
            if (rootView) rootView.addDelayDestroy(removes);
            else removes.forEach((c => c.destroy()));
            changed = true;
        }

        if (changed) view.notify("childs");
    }

    measure(parentFrame: ShapeSize | undefined, _scale: { x: number; y: number; } | undefined) {
        const view = this.view;
        const shape = view.data as SymbolRefShape;
        const transform = shape.transform.clone();
        if ((view.parent as ArtboardView)?.autoLayout) {
            transform.translateX = view.transform.translateX;
            transform.translateY = view.transform.translateY;
        }
        if (!view.m_sym) {
            this.updateLayoutArgs(transform, shape.frame);
            view.removeChilds(0, view.children.length).forEach((c) => c.destroy());
            this.updateFrames();
            return;
        }
        const prescale = { x: _scale?.x ?? 1, y: _scale?.y ?? 1 }
        const scale = { x: prescale.x, y: prescale.y }

        const isCustomSize = view.isCustomSize
        const uniformScale = view.uniformScale
        // 计算自身大小
        let size = new ShapeSize();

        // 计算排版空间大小
        let layoutSize = new ShapeSize();
        // 调整过大小的，使用用户调整的大小，否则跟随symbol大小
        if (isCustomSize) {
            size.width = view.data.size.width
            size.height = view.data.size.height
        } else {
            size.width = view.m_sym.size.width
            size.height = view.m_sym.size.height
            if (uniformScale) {
                size.width *= uniformScale
                size.height *= uniformScale
            }
        }

        const autoLayout = view.autoLayout
        const selfframe = new ShapeFrame(0, 0, size.width, size.height)
        const childscale = { x: scale.x, y: scale.y } // 传递给子对象的缩放值
        // case 1 不需要变形
        if (isEqual(scale.x, 1) && isEqual(scale.y, 1)) {
            layoutSize.width = size.width
            layoutSize.height = size.height
            if (uniformScale) {
                // 放大layoutSize
                layoutSize.width /= uniformScale
                layoutSize.height /= uniformScale
            }
            childscale.x = layoutSize.width / view.m_sym.size.width;
            childscale.y = layoutSize.height / view.m_sym.size.height;
            // let frame = this.m_data.frame;
            this.updateLayoutArgs(transform, selfframe);
            this.layoutChilds(layoutSize, childscale);
            if (autoLayout) this._autoLayout(autoLayout, layoutSize)
            this.updateFrames();
            return;
        }

        let scaleX = scale.x;
        let scaleY = scale.y;
        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        if (parentFrame && resizingConstraint !== 0 && !autoLayout) {
            // 要调整下scale
            const _size = shape.size
            scaleX *= size.width / _size.width
            scaleY *= size.height / _size.height
            // 在parentFrame的排版空间内,根据缩放后的大小布局自己
            const { transform, targetWidth, targetHeight } = fixFrameByConstrain(shape, parentFrame, scaleX, scaleY);
            // 计算出自身大小
            selfframe.width = targetWidth
            selfframe.height = targetHeight
            this.updateLayoutArgs((transform), selfframe);
        } else { // 没有约束
            const transform = shape.transform.clone();
            transform.scale(scaleX, scaleY);
            const __decompose_scale = transform.clearScaleSize();
            // 保持对象位置不变
            // virtual是整体缩放，位置是会变化的，不需要trans
            if (!view.isVirtual) transform.trans(transform.translateX - shape.transform.translateX, transform.translateY - shape.transform.translateY);

            if (view.parent && (view.parent as ArtboardView).autoLayout) {
                transform.translateX = view.transform.translateX;
                transform.translateY = view.transform.translateY;
            }

            selfframe.width = size.width * __decompose_scale.x
            selfframe.height = size.height * __decompose_scale.y

            this.updateLayoutArgs((transform), selfframe);
        }
        layoutSize.width = selfframe.width
        layoutSize.height = selfframe.height
        if (uniformScale) {
            // 放大layoutSize
            layoutSize.width /= uniformScale
            layoutSize.height /= uniformScale
        }
        // 不对的
        // 重新计算 childscale
        childscale.x = layoutSize.width / view.m_sym.size.width;
        childscale.y = layoutSize.height / view.m_sym.size.height;
        this.layoutChilds(layoutSize, childscale);
        const childs = view.childs.filter(c => c.isVisible);
        if (autoLayout && childs.length && view.m_sym.autoLayout) this._autoLayout(autoLayout, layoutSize);
        this.updateFrames();
    }

    layout(props?: PropsType | undefined): void {
        const view = this.view;
        const needLayout = view.ctx.removeReLayout(view); // remove from changeset
        if (props && !this.updateLayoutProps(props, needLayout)) return;

        view.ctx.setDirty(view);
        view.ctx.addNotifyLayout(view);

        this.measure(view.props.layoutSize, view.props.scale)
    }
}