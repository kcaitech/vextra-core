import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { Document, GroupShape, Shape } from "../data/classes";
import { ResizingConstraints } from "../data/consts";
import { Artboard, SymbolShape } from "../data/baseclasses";

export class resizingConstraintEditor {
    protected __repo: CoopRepository;
    protected __page: Page;
    protected __document: Document;

    constructor(page: Page, repo: CoopRepository, document: Document) {
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    /**
     * @description 目标图层是否禁止修改约束状态
     */
    disabled(shape: Shape) {
        return shape.isVirtualShape // 图形是实例子元素
            || ( // 图形不是以下类型图层的子元素
                !(shape.parent instanceof Artboard)
                && !(shape.parent instanceof GroupShape)
                && !(shape.parent instanceof SymbolShape)
            )
    }

    isCheckHorizontal(value: number) {
        let newvalue = value
        if (ResizingConstraints.hasLeft(newvalue)) {
            newvalue = ResizingConstraints.setLeft(newvalue, false)
        }
        if (ResizingConstraints.hasRight(newvalue)) {
            newvalue = ResizingConstraints.setRight(newvalue, false)
        }

        return newvalue
    }

    isCheckVertical(value: number) {
        if (ResizingConstraints.hasTop(value)) {
            return ResizingConstraints.setTop(value, false)
        }
        if (ResizingConstraints.hasBottom(value)) {
            return ResizingConstraints.setBottom(value, false)
        }

        return value
    }

    isCheckWidth(value: number) {
        let newvalue = value
        if (ResizingConstraints.hasWidth(newvalue)) {
            newvalue = ResizingConstraints.setTop(newvalue, false)
        }
        return newvalue
    }

    isCheckHeight(value: number) {

        if (ResizingConstraints.hasHeight(value)) {
            return ResizingConstraints.setHeight(value, false)
        }
    }

    /**
     * @description 设置选中的图层是否表现靠左固定的约束状态
     * @param { Shape[] } shapes 选中的图层
     * @param { boolean } value 期望状态
     */
    fixedToLeft(shapes: Shape[], value: boolean) { // 调整选中图层靠左固定的值（靠左固定、取消靠左固定）
        try {
            const api = this.__repo.start("fixedToLeft", {}); // start 修改数据必须通过api去修改

            for (let i = 0, l = shapes.length; i < l; i++) { // 对选中的图层挨个设置
                const shape = shapes[i];

                // 修改前的校验
                if (this.disabled(shape)) { // 在不影响太多性能的前提下修改数据前应该设置一些防线，尽管view层已有防线
                    continue;
                }
                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask; // 默认值是Unset
                const new_rc = ResizingConstraints.setLeft(this.isCheckHorizontal(old_rc), value);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc); // modify 修改数据

            }

            this.__repo.commit(); // success 修改数据成功；start和success正常情况下一定是成对出现
        } catch (error) {
            console.log(error);
            this.__repo.rollback(); // 回滚：在修改数据的过程中产生了错误，需要把数据回滚到start之前的状态
        }
    }

    fixedToRight(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToRight", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                const new_rc = ResizingConstraints.setRight(this.isCheckWidth(old_rc), value);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToLR(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToLR", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                const new_rc = ResizingConstraints.setLR(this.isCheckHorizontal(old_rc), value);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToWidth(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToWidth", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];


                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                const new_rc = ResizingConstraints.setWidth(this.isCheckHorizontal(old_rc), value);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToTop(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToTop", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];


                if (this.disabled(shape)) {
                    continue;
                }

                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                this.isCheckVertical(old_rc)
                const new_rc = ResizingConstraints.setTop(this.isCheckVertical(old_rc), value);
                console.log(new_rc);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToBottom(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToBottom", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];


                if (this.disabled(shape)) {
                    continue;
                }

                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                this.isCheckVertical(old_rc)

                const new_rc = ResizingConstraints.setBottom(this.isCheckVertical(old_rc), value);
                console.log(new_rc);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedToTB(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedToTB", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];


                if (this.disabled(shape)) {
                    continue;
                }

                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                this.isCheckVertical(old_rc)

                const new_rc = ResizingConstraints.setTB(this.isCheckVertical(old_rc), value);
                console.log(new_rc);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    fixedTHeight(shapes: Shape[], value: boolean) {
        try {
            const api = this.__repo.start("fixedTHeight", {});

            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];


                if (this.disabled(shape)) {
                    continue;
                }
                const old_rc = shape.resizingConstraint || ResizingConstraints.Mask;
                this.isCheckVertical(old_rc)
                const new_rc = ResizingConstraints.setHeight(this.isCheckVertical(old_rc), value);
                console.log(new_rc);
                api.shapeModifyResizingConstraint(this.__page, shape, new_rc);
            }

            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    // todo...
}