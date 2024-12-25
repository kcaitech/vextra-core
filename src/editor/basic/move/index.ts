import { ShapeView, GroupShapeView, adapt2Shape, TextShapeView, SymbolRefView, ArtboradView } from "../../../dataview";
import { Api } from "../../../coop";
import { GroupShape, Page, SymbolShape, MarkerType, BlendMode, Artboard, ShapeType, TextShape, Shape, makeShapeTransform1By2 } from "../../../data";
import { importFill, importBorder, importShadow, importExportOptions, importBlur, importPrototypeInterAction, importAutoLayout } from "../../../data/baseimport";
import { exportFill, exportBorder, exportShadow, exportExportOptions, exportBlur, exportPrototypeInterAction, exportAutoLayout } from "../../../data/baseexport";
import { CircleChecker } from "./circle";
import { modifyAutoLayout } from "../../utils/auto_layout";

/**
 * @description 调整图层的层级，调整层级的动作涉及多方面协调，不可以直接使用api进行调整
 */
export class ShapePorter {
    private readonly api: Api;
    private readonly page: Page;

    private fromSet: Set<GroupShapeView>;
    private toSet: Set<GroupShapeView>;
    private envSet: Set<GroupShapeView>;

    constructor(api: Api, page: Page) {
        this.api = api;
        this.page = page;
        this.fromSet = new Set();
        this.toSet = new Set();
        this.envSet = new Set();
    }

    private isVirtualShape(view: ShapeView | Shape, target: GroupShapeView | GroupShape) {
        return !!(view.isVirtualShape || target.isVirtualShape)
    }

    /**
     * @description 检查是否可以进行层级调整
     */
    private check(view: ShapeView, target: GroupShapeView) {
        if (this.isVirtualShape(view, target)) return false;
        if (target.type === ShapeType.SymbolUnion) return false;
        return !this.circle(view, target);
    }

    /**
     * @description 固定变量： 组件中view的渲染依赖组件，离开组件后，渲染结果将受到影响，需要在离开之前将渲染结果携带在自己身上
     */
    private solidifyVar(view: ShapeView, target: GroupShapeView) {
        if (!view.varsContainer) return;
        const symbol = view.varsContainer[0];
        if (!(symbol instanceof SymbolShape)) return;
        if (target.varsContainer?.find(v => v.id === symbol.id)) return;

        // view 将要离开绑定变量所在的组件
        const api = this.api;
        const page = this.page;
        const shape = adapt2Shape(view);
        const name = view.name;
        if (name === shape.name) api.shapeModifyName(page, shape, name);
        const fills = view.getFills().map(i => importFill(exportFill(i)));
        {
            if (shape.style.fills.length) api.deleteFills(page, shape, 0, shape.style.fills.length);
            api.addFills(page, shape, fills); // 填入新的值
        }
        let borders = view.getBorders();
        {
            if(borders) importBorder(exportBorder(borders))
            if (shape.style.borders?.strokePaints.length) api.deleteStrokePaints(page, shape, 0, shape.style.borders.strokePaints.length);
            api.addStrokePaints(page, shape, borders.strokePaints);
        }
        const shadows = view.getShadows().map(i => importShadow(exportShadow(i)));
        {
            if (shape.style.shadows.length) api.deleteShadows(page, shape, 0, shape.style.shadows.length);
            api.addShadows(page, shape, shadows);
        }
        const visible = view.isVisible;
        if (visible !== shape.isVisible) {
            api.shapeModifyVisible(page, shape, visible);
        }
        const lock = view.isLocked;
        if (lock !== shape.isLocked) api.shapeModifyLock(page, shape, lock);
        const contextSettings = view.contextSettings;
        {
            if (contextSettings?.opacity !== shape.style.contextSettings?.opacity) {
                api.shapeModifyContextSettingsOpacity(page, shape, contextSettings?.opacity ?? 1);
            }
            if (contextSettings?.blenMode !== shape.style.contextSettings?.blenMode) {
                api.shapeModifyContextSettingsBlendMode(page, shape, contextSettings?.blenMode ?? BlendMode.Normal);
            }
        }
        const startMarkerType = view.startMarkerType;
        if (startMarkerType !== shape.style.startMarkerType) api.shapeModifyStartMarkerType(page, shape, startMarkerType ?? MarkerType.Line);
        const endMarkerType = view.endMarkerType;
        if (endMarkerType !== shape.style.endMarkerType) api.shapeModifyEndMarkerType(page, shape, endMarkerType ?? MarkerType.Line);
        const exportOptions = view.exportOptions ? importExportOptions(exportExportOptions(view.exportOptions)) : undefined;
        {
            if (shape.exportOptions?.exportFormats.length) api.deleteExportFormats(page, shape, 0, shape.exportOptions.exportFormats.length);
            if (exportOptions?.exportFormats.length) api.addExportFormats(page, shape, exportOptions.exportFormats);
        }
        const cornerRadius = view.cornerRadius;
        {
            if (cornerRadius) api.shapeModifyRadius2(page, (shape as Artboard), cornerRadius.lt, cornerRadius.rt, cornerRadius.rb, cornerRadius.lb);
        }
        const blur = view.blur ? importBlur(exportBlur(view.blur)) : undefined;
        {
            if (shape.style.blur) api.deleteBlur(page, shape);
            if (blur) api.addBlur(page, shape, blur);
        }
        const protoInteractions = view.prototypeInterActions
            ? view.prototypeInterActions.map(i => importPrototypeInterAction(exportPrototypeInterAction(i)))
            : undefined;
        {
            if (shape.prototypeInteractions?.length) shape.prototypeInteractions.forEach(i => api.deleteShapePrototypeInteractions(page, shape, i.id));
            if (protoInteractions?.length) protoInteractions.forEach(i => api.insertShapeprototypeInteractions(page, shape, i));
        }

        if (view instanceof TextShapeView) {
            const text = view.getText();
            const textShape = shape as TextShape;
            api.deleteText2(page, textShape, 0, textShape.text.length);
            api.insertComplexText(page, view, 0, text);
        }
        if (view instanceof SymbolRefView) {
            const refId = view.refId;
        }
        if (view instanceof ArtboradView) {
            const autoLayout = view.autoLayout ? importAutoLayout(exportAutoLayout(view.autoLayout)) : undefined;
            autoLayout && api.shapeAutoLayout(page, shape, autoLayout);
        }
    }

    /**
     * @description 更新自动布局
     * @private
     */
    private autolayout() {
        if (this.envSet.size) this.envSet.forEach(e => {
            if ((e as ArtboradView).autoLayout) modifyAutoLayout(this.page, this.api, adapt2Shape(e));
        })
    }

    /**
     * @description 更新原型交互
     */
    private react() {
    }

    /**
     * @description 清理空的编组
     */
    private clearNullGroup() {
        if (this.fromSet.size) this.fromSet.forEach(e => {
            if ((e.type === ShapeType.Group || e.type === ShapeType.BoolShape) && !e.childs.length) {
            }
        })
    }

    // todo
    private clearBindsEffect(view: ShapeView) {
    }

    transform(view: ShapeView, target: GroupShapeView, shape?: Shape) {
        const transform = view.transform2FromRoot;
        const parent2root = target.transform2FromRoot;
        transform.addTransform(parent2root.getInverse());
        this.api.shapeModifyTransform(this.page, shape ?? adapt2Shape(view), makeShapeTransform1By2(transform));
    }

    /**
     * @description 循环检查
     */
    circle(view: ShapeView, target: GroupShapeView) {
        return CircleChecker.assert4view(target, view);
    }

    beforeMove(view: ShapeView, target: GroupShapeView) {
        this.solidifyVar(view, target);
        this.transform(view, target)
    }

    move(view: ShapeView, origin: GroupShapeView, target: GroupShapeView, toIndex: number) {
        if (!this.check(view, target)) return;
        this.beforeMove(view, target);
        const shape = adapt2Shape(view);
        const originData = adapt2Shape(origin) as GroupShape;
        const targetData = adapt2Shape(target) as GroupShape;
        const index = originData.indexOfChild(shape);
        if (originData.id === targetData.id && index < toIndex) toIndex--;
        this.api.shapeMove(this.page, originData, index, targetData, toIndex);
        this.fromSet.add(origin);
        this.toSet.add(origin);
        this.envSet.add(origin);
    }

    afterMove() {
        this.autolayout();
        this.react();
        this.clearNullGroup();
    }
}
