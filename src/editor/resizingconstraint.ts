/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { IRepository } from "../repo";
import { Document, Shape, ShapeType, Page, ResizingConstraints2 } from "../data";

export class ResizingConstraintEditor {
    protected __repo: IRepository;
    protected __page: Page;
    protected __document: Document;

    constructor(page: Page, repo: IRepository, document: Document) {
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    resizingConstraint(shape: Shape) {
        return shape.resizingConstraint === undefined
            ? ResizingConstraints2.Mask
            : shape.resizingConstraint
    }

    /**
     * @description 目标图层是否禁止修改约束状态
     */
    disabled(shape: Shape) {
        return shape.isVirtualShape // 图形是实例子元素
            || ( // 图形不是以下类型图层的子元素
                shape.parent?.type !== ShapeType.Artboard
                && shape.parent?.type !== ShapeType.Symbol
            )
    }

    /**
     * @description 设置选中的图层是否表现靠左固定的约束状态
     * @param { Shape[] } shapes 选中的图层
     */
    fixedToLeft(shapes: Shape[]) { // 调整选中图层靠左固定的值（靠左固定、取消靠左固定）
        try {
            const op = this.__repo.start("fixedToLeft"); // start 修改数据必须通过operator去修改
            for (let i = 0, l = shapes.length; i < l; i++) { // 对选中的图层挨个设置
                const shape = shapes[i];
                // 修改前的校验
                if (this.disabled(shape)) { // 在不影响太多性能的前提下修改数据前应该设置一些防线，尽管view层已有防线
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedLeft(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc); // modify 修改数据
            }

            this.__repo.commit(); // success 修改数据成功；start和success正常情况下一定是成对出现
        } catch (error) {
            console.log(error);
            this.__repo.rollback(); // 回滚：在修改数据的过程中产生了错误，需要把数据回滚到start之前的状态
        }
    }

    fixedToRight(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToRight");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedRight(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToLR(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToLR");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedLeftAndRight(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    HorizontaljustifyCenter(shapes: Shape[]) {
        try {
            const op = this.__repo.start("HorizontaljustifyCenter");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToHorizontalJustifyCenter(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    scaleByWidth(shapes: Shape[]) {
        try {
            const op = this.__repo.start("scaleByWidth");

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToScaleByWidth(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToWidth(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToWidth");

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToWidthFixed(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    flexWidth(shapes: Shape[]) {
        try {
            const op = this.__repo.start("flexWidth");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToWidthFlex(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    // vertical
    fixedToTop(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToTop");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedTop(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToBottom(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToBottom");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedBottom(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToTB(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToTB");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToFixedTopAndBottom(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    VerticaljustifyCenter(shapes: Shape[]) {
        try {
            const op = this.__repo.start("VerticaljustifyCenter");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToVerticalJustifyCenter(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    scaleByHeight(shapes: Shape[]) {
        try {
            const op = this.__repo.start("VerticaljustifyCenter");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToScaleByHeight(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToHeight(shapes: Shape[]) {
        try {
            const op = this.__repo.start("fixedToHeight");

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToHeightFixed(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    flexHeight(shapes: Shape[]) {
        try {
            const op = this.__repo.start("flexHeight");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = this.resizingConstraint(shape);
                const new_rc = ResizingConstraints2.setToHeightFlex(old_rc);
                op.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }
}