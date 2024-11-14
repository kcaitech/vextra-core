import { ShapeView, GroupShapeView, adapt2Shape, TextShapeView, SymbolRefView, ArtboradView } from "../../dataview";
import { Api } from "../../coop";
import { GroupShape, Page, SymbolShape, MarkerType, BlendMode, Artboard, ShapeType } from "../../data";
import { importFill, importBorder, importShadow, importExportOptions, importBlur, importPrototypeInterAction, importAutoLayout } from "../../data/baseimport";
import { exportFill, exportBorder, exportShadow, exportExportOptions, exportBlur, exportPrototypeInterAction, exportAutoLayout } from "../../data/baseexport";

/**
 * @description 调整图层的层级，调整层级的动作涉及多方面协调，不可以直接使用api进行调整
 */
export class ShapePorter {
    private readonly api: Api;
    private readonly page: Page;

    constructor(api: Api, page: Page) {
        this.api = api;
        this.page = page;
    }

    /**
     * @description 循环检查
     */
    private circle(view: ShapeView, target: GroupShapeView) {
        return false; // todo
    }

    /**
     * @description 检查是否可以进行层级调整
     */
    private check(view: ShapeView, target: GroupShapeView) {
        if (view.isVirtualShape || target.isVirtualShape) return false;
        if (target.type === ShapeType.SymbolUnion) return false;
        if (this.circle(view, target)) return false;

        return false;
    }

    /**
     * @description 固定变量： 组件中view的渲染依赖组件，离开组件后，渲染结果将受到影响，需要在离开之前将渲染结果携带在自己身上
     */
    private solidifyVar(view: ShapeView, origin: GroupShapeView, target: GroupShapeView) {
        if (!view.varsContainer) return;
        const symbol = view.varsContainer[0];
        if (!(symbol instanceof SymbolShape)) return;
        if (!target.varsContainer?.find(v => v.id === symbol.id) && target.id !== symbol.id) return;

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
        const borders = view.getBorders().map(i => importBorder(exportBorder(i)));
        {
            if (shape.style.borders.length) api.deleteBorders(page, shape, 0, shape.style.borders.length);
            api.addBorders(page, shape, borders);
        }
        const shadows = view.getShadows().map(i => importShadow(exportShadow(i)));
        {
            if (shape.style.shadows.length) api.deleteShadows(page, shape, 0, shape.style.shadows.length);
            api.addShadows(page, shape, shadows);
        }
        const visible = view.isVisible;
        if (visible !== shape.isVisible) api.shapeModifyVisible(page, shape, visible);
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
            // const text = view.getText();
            // api.deleteText()
            // api.insertComplexText(page, view, 0, text);
        }
        if (view instanceof SymbolRefView) {
            const refId = view.refId;
        }
        if (view instanceof ArtboradView) {
            const autoLayout = view.autoLayout ? importAutoLayout(exportAutoLayout(view.autoLayout)) : undefined;
            autoLayout && api.shapeAutoLayout(page, shape, autoLayout);
        }
    }

    private beforeMove(view: ShapeView, origin: GroupShapeView, target: GroupShapeView) {
        // 固定组件组成元素的变量属性
        this.solidifyVar(view, origin, target);
    }

    private afterMove(view: ShapeView, origin: GroupShapeView, target: GroupShapeView) {
        // 自动布局
        // 整理原型交互
        // 整理编组
    }

    move(api: Api, page: Page, view: ShapeView, origin: GroupShapeView, target: GroupShapeView, toIndex: number) {
        if (this.check(view, target)) return;
        this.beforeMove(view, origin, target);
        const shape = adapt2Shape(view);
        const originData = adapt2Shape(origin) as GroupShape;
        const targetData = adapt2Shape(target) as GroupShape;
        const index = originData.indexOfChild(shape);
        if (originData.id === targetData.id && index < toIndex) toIndex--;
        api.shapeMove(page, originData, index, targetData, toIndex);
        this.afterMove(view, origin, target);
    }
}
