import { GroupShape, RectShape, Shape, PathShape, PathShape2, TextShape, Variable, SymbolShape } from "../data/shape";
import { Color, MarkerType } from "../data/style";
import { expand, expandTo, translate, translateTo } from "./frame";
import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { BoolOp, CurvePoint, Point2D, ShapeType } from "../data/baseclasses";
import { Artboard } from "../data/artboard";
import { createHorizontalBox } from "../basic/utils";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { ContactForm, CurveMode, OverrideType, VariableType } from "../data/typesdefine";
import { Api } from "./command/recordapi";
import { update_frame_by_points } from "./path";
import { exportCurvePoint } from "../data/baseexport";
import { importCurvePoint } from "../data/baseimport";
import { v4 } from "uuid";
import { get_box_pagexy, get_nearest_border_point } from "../data/utils";
import { Matrix } from "../basic/matrix";
import { ContactShape } from "../data/contact";
import { SymbolRefShape } from "../data/classes";
import { uuid } from "../basic/uuid";

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}

export class ShapeEditor {
    protected __shape: Shape;
    protected __repo: CoopRepository;
    protected __page: Page;
    constructor(shape: Shape, page: Page, repo: CoopRepository) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
    }

    // 变量修改的情况
    // 1. 修改变量值
    //    是否可以直接修改 是则直接修改，否则先找到host对象，再override到新变量
    // 2. override到另外一个变量
    // override
    //    绑定属性到某个值
    //    绑定属性到某个变量
    // 修改对象属性
    // 1. 原子修改
    //    判断是否bindvar, 如是则findVar, 后修改变量值
    //    判断是否virtual, 如是则走override
    // 2. 非原子修改
    //    

    _override2Variable(varId: string, type: OverrideType, api: Api) {

        const shape: Shape = this.__shape;

        let sym: Shape | undefined = shape;
        while (sym && sym.isVirtualShape) {
            sym = sym.parent;
        }
        if (!sym || !(sym instanceof SymbolRefShape || sym instanceof SymbolShape)) throw new Error();

        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();
        if (!(shape instanceof SymbolRefShape)) {
            const idx = override_id.lastIndexOf('/');
            if (idx > 0) {
                override_id = override_id.substring(0, idx);
            }
            else {
                override_id = ""
            }
        }
        // if (type !== OverrideType.Variable) {
        if (override_id.length > 0) override_id += "/";
        override_id += type;
        // }

        api.shapeAddOverride(this.__page, sym, override_id, type, varId);

    }

    _overrideVariable(_var: Variable, value: any, api: Api) {

        const shape: Shape = this.__shape;

        let p = varParent(_var);
        if (!p) throw new Error();
        if (p instanceof SymbolShape) {
            if (p.isVirtualShape) throw new Error();
            p = shape;
        }
        let sym: Shape | undefined = p;
        while (sym && sym.isVirtualShape) {
            sym = sym.parent;
        }
        if (!sym || !(sym instanceof SymbolRefShape || sym instanceof SymbolShape)) throw new Error();

        let override_id = p.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();
        if (!(p instanceof SymbolRefShape)) {
            const idx = override_id.lastIndexOf('/');
            if (idx > 0) {
                override_id = override_id.substring(0, idx);
            }
            else {
                override_id = ""
            }
        }
        if (override_id.length > 0) override_id += "/";
        override_id += _var.id;

        const _var2 = new Variable(uuid(), _var.type, _var.name);
        _var2.value = value;
        api.shapeAddVariable(this.__page, sym, _var2);
        api.shapeAddOverride(this.__page, sym, _var.id, OverrideType.Variable, _var2.id);

        return sym.getVar(_var2.id)!;
    }

    modifyVariable2(_var: Variable, value: any, api: Api) {
        const p = varParent(_var);
        if (!p) throw new Error();

        const shape = this.__shape;
        if (p.isVirtualShape || (p instanceof SymbolShape && !(shape instanceof SymbolShape))) {
            // override 
            // const api = this.__repo.
            this._overrideVariable(_var, value, api);
        }
        else {
            api.shapeModifyVariable(this.__page, _var, value);
        }
    }

    _overrideVariable2(fromVar: Variable, toVarId: string, api: Api) {
        const shape = this.__shape;

        let p = varParent(fromVar);
        if (!p) throw new Error();
        if (p instanceof SymbolShape) {
            if (p.isVirtualShape) throw new Error();
            p = shape;
        }

        let sym: Shape | undefined = p;
        while (sym && sym.isVirtualShape) {
            sym = sym.parent;
        }
        if (!sym || !(sym instanceof SymbolRefShape || sym instanceof SymbolShape)) throw new Error();

        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();
        if (!(shape instanceof SymbolRefShape)) {
            const idx = override_id.lastIndexOf('/');
            if (idx > 0) {
                override_id = override_id.substring(0, idx);
            }
            else {
                override_id = ""
            }
        }
        override_id += '/' + fromVar.id;

        api.shapeAddOverride(this.__page, sym, override_id, OverrideType.Variable, toVarId);
    }

    // check and override
    // 适合text这种，value的修改非原子操作的情况
    overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api) {
        const shape = this.__shape;
        // symbol shape
        if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                return _var;
            }
        }
        if (!shape.isVirtualShape) return;

        // 先查varbinds
        if (shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            const vars_path: Shape[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);
            if (_vars.length !== vars_path.length) throw new Error();
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {

                let p = varParent(_var);
                if (!p) throw new Error();

                if (p.isVirtualShape || p instanceof SymbolShape) {
                    // override variable
                    const api = this.__repo.start('overrideVariable', {});
                    const ret = this._overrideVariable(_var, valuefun(_var), api);
                    this.__repo.commit();
                    return ret;
                } else {
                    return _var;
                }
            }
        }

        // override
        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();

        const _vars = shape.findOverride(override_id.substring(override_id.lastIndexOf('/') + 1), overrideType);
        if (_vars) {
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                let p = varParent(_var); // 这里会有问题！如果p是symbolshape，往上追溯就错了。
                if (!p) throw new Error();
                if (p.isVirtualShape || p instanceof SymbolShape) {
                    const api = this.__repo.start('overrideVariable', {});
                    const ret = this._overrideVariable(_var, valuefun(_var), api);
                    this.__repo.commit();
                    return ret;
                } else {
                    return _var;
                }
            }
        }

        // get first not virtual
        let symRef = shape.parent;
        while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
        if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

        // add override add variable
        // const api = this.__repo.start('addOverrid', {});
        const _var2 = new Variable(uuid(), varType, "");
        _var2.value = valuefun(undefined);
        api.shapeAddVariable(this.__page, symRef, _var2);
        api.shapeAddOverride(this.__page, symRef, override_id, overrideType, _var2.id);
        // this.__repo.commit();

        return symRef.getVar(_var2.id)!;
    }

    modifyVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any): boolean {
        // const _var = this.overrideVariable(slot, varType, ov)
        const shape = this.__shape;
        // symbol shape
        if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);

            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                const api = this.__repo.start('modifyVariable', {});
                this.modifyVariable2(_var, valuefun(_var), api);
                this.__repo.commit();
                return true;
            }
        }
        if (!shape.isVirtualShape) return false;

        // 先override还是varbinds？？应该是override?

        // 先查varbinds
        if (shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            const vars_path: Shape[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);
            if (_vars.length !== vars_path.length) throw new Error();
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                const api = this.__repo.start('modifyVariable', {});
                this.modifyVariable2(_var, valuefun(_var), api)
                this.__repo.commit();
                return true;
            }
        }

        // override
        let override_id = shape.id;
        override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
        if (override_id.length === 0) throw new Error();

        const _vars = shape.findOverride(override_id.substring(override_id.lastIndexOf('/') + 1), overrideType);
        if (_vars) {
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {

                const api = this.__repo.start('modifyVariable', {});
                this.modifyVariable2(_var, valuefun(_var), api)
                this.__repo.commit();
                return true;
            }
        }
        //
        // symRef.addOverrid(override_id, OverrideType.SymbolID, refId);

        // get first not virtual
        let symRef = shape.parent;
        while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
        if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

        // add override
        // 

        // todo api
        // add override add variable
        const api = this.__repo.start('addOverrid', {});
        const _var2 = new Variable(uuid(), varType, "");
        _var2.value = valuefun(undefined);
        api.shapeAddVariable(this.__page, symRef, _var2);
        api.shapeAddOverride(this.__page, symRef, override_id, overrideType, _var2.id);
        this.__repo.commit();
        // symRef.addOverrid(override_id, overrideType, value);

        return true;
    }


    public setName(name: string) {
        const api = this.__repo.start('setName', {});
        api.shapeModifyName(this.__page, this.__shape, name)
        this.__repo.commit();
    }
    public toggleVisible() {
        //
        if (this.modifyVariable(VariableType.Visible, OverrideType.Visible, (_var) => {
            return _var ? !_var.value : !this.__shape.isVisible;
        })) {
            return;
        }
        const api = this.__repo.start('toggleVisible', {});
        api.shapeModifyVisible(this.__page, this.__shape, !this.__shape.isVisible)
        this.__repo.commit();
    }
    public toggleLock() {
        const api = this.__repo.start('toggleLock', {});
        api.shapeModifyLock(this.__page, this.__shape, !this.__shape.isLocked);
        this.__repo.commit();
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        const api = this.__repo.start("translate", {});
        translate(api, this.__page, this.__shape, dx, dy, round);
        this.__repo.commit();
    }
    public translateTo(x: number, y: number) {
        const api = this.__repo.start("translateTo", {});
        translateTo(api, this.__page, this.__shape, x, y);
        this.__repo.commit();
    }
    public expand(dw: number, dh: number) {
        const api = this.__repo.start("expand", {});
        expand(api, this.__page, this.__shape, dw, dh);
        this.__repo.commit();
    }
    public expandTo(w: number, h: number) {
        const api = this.__repo.start("expandTo", {});
        expandTo(api, this.__page, this.__shape, w, h);
        this.__repo.commit();
    }
    public setConstrainerProportions(val: boolean) {
        const api = this.__repo.start("setConstrainerProportions", {});
        api.shapeModifyConstrainerProportions(this.__page, this.__shape, val)
        this.__repo.commit();
    }
    // flip
    public flipH() {
        const api = this.__repo.start("flipHorizontal", {});
        api.shapeModifyHFlip(this.__page, this.__shape, !this.__shape.isFlippedHorizontal)
        this.__repo.commit();
    }
    public flipV() {
        const api = this.__repo.start("flipVertical", {});
        api.shapeModifyVFlip(this.__page, this.__shape, !this.__shape.isFlippedVertical)
        this.__repo.commit();
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        const api = this.__repo.start("setResizingConstraint", {});
        api.shapeModifyResizingConstraint(this.__page, this.__shape, value);
        this.__repo.commit();
    }
    // rotation
    public rotate(deg: number) {
        const api = this.__repo.start("rotate", {});
        deg = deg % 360;
        api.shapeModifyRotate(this.__page, this.__shape, deg)
        this.__repo.commit();
    }
    // radius
    public setRectRadius(lt: number, rt: number, rb: number, lb: number) {
        if (!(this.__shape instanceof RectShape)) return;
        const api = this.__repo.start("setRectRadius", {});
        api.shapeModifyRadius(this.__page, this.__shape, lt, rt, rb, lb);
        this.__repo.commit();
    }
    public setFixedRadius(fixedRadius: number) {
        if (this.__shape instanceof GroupShape) {
            if (!this.__shape.isBoolOpShape) return;
        }
        else if (!(this.__shape instanceof PathShape || this.__shape instanceof PathShape2 || this.__shape instanceof TextShape)) {
            return;
        }
        const api = this.__repo.start("setFixedRadius", {});
        api.shapeModifyFixedRadius(this.__page, this.__shape, fixedRadius || undefined);
        this.__repo.commit();
    }

    public setBoolOp(op: BoolOp, name?: string) {
        if (!(this.__shape instanceof GroupShape)) return;
        const api = this.__repo.start("setBoolOp", {});
        if (name) api.shapeModifyName(this.__page, this.__shape, name);
        this.__shape.childs.forEach((child) => {
            api.shapeModifyBoolOp(this.__page, child, op);
        })
        api.shapeModifyBoolOpShape(this.__page, this.__shape, op !== BoolOp.None);
        this.__repo.commit();
    }

    public setIsBoolOpShape(isOpShape: boolean) {
        if (!(this.__shape instanceof GroupShape)) return;
        const api = this.__repo.start("setIsBoolOpShape", {});
        api.shapeModifyBoolOpShape(this.__page, this.__shape, isOpShape);
        this.__repo.commit();
    }

    // fill
    public addFill(fill: Fill) {
        const api = this.__repo.start("addFill", {});
        api.addFillAt(this.__page, this.__shape, fill, this.__shape.style.fills.length);
        this.__repo.commit();
    }
    public setFillColor(idx: number, color: Color) {
        const fill: Fill = this.__shape.style.fills[idx];
        if (fill) {
            const api = this.__repo.start("setFillColor", {});
            api.setFillColor(this.__page, this.__shape, idx, color)
            this.__repo.commit();
        }
    }

    public setFillEnable(idx: number, value: boolean) {
        if (this.__shape.type !== ShapeType.Artboard) {
            const api = this.__repo.start("setFillEnable", {});
            api.setFillEnable(this.__page, this.__shape, idx, value);
            this.__repo.commit();
        }
    }
    public deleteFill(idx: number) {
        const fill = this.__shape.style.fills[idx];
        if (fill) {
            const api = this.__repo.start("deleteFill", {});
            api.deleteFillAt(this.__page, this.__shape, idx);
            this.__repo.commit();
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderEnable", {});
            api.setBorderEnable(this.__page, this.__shape, idx, isEnabled);
            this.__repo.commit();
        }
    }
    public setBorderColor(idx: number, color: Color) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderColor", {});
            api.setBorderColor(this.__page, this.__shape, idx, color);
            this.__repo.commit();
        }
    }
    public setBorderThickness(idx: number, thickness: number) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderThickness", {});
            api.setBorderThickness(this.__page, this.__shape, idx, thickness);
            this.__repo.commit();
        }
    }
    public setBorderPosition(idx: number, position: BorderPosition) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderPosition", {});
            api.setBorderPosition(this.__page, this.__shape, idx, position);
            this.__repo.commit();
        }
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderStyle", {});
            api.setBorderStyle(this.__page, this.__shape, idx, borderStyle);
            this.__repo.commit();
        }
    }
    public setMarkerType(mt: MarkerType, isEnd: boolean) {
        const api = this.__repo.start("setMarkerType", {});
        if (isEnd) {
            api.shapeModifyEndMarkerType(this.__page, this.__shape, mt);
        } else {
            api.shapeModifyStartMarkerType(this.__page, this.__shape, mt);
        }
        this.__repo.commit();
    }
    public exchangeMarkerType() {
        const { endMarkerType, startMarkerType } = this.__shape.style;
        if (endMarkerType !== startMarkerType) {
            const api = this.__repo.start("exchangeMarkerType", {});
            api.shapeModifyEndMarkerType(this.__page, this.__shape, startMarkerType || MarkerType.Line);
            api.shapeModifyStartMarkerType(this.__page, this.__shape, endMarkerType || MarkerType.Line);
            this.__repo.commit();
        }
    }
    public deleteBorder(idx: number) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("deleteBorder", {});
            api.deleteBorderAt(this.__page, this.__shape, idx)
            this.__repo.commit();
        }
    }
    public addBorder(border: Border) {
        const api = this.__repo.start("addBorder", {});
        api.addBorderAt(this.__page, this.__shape, border, this.__shape.style.borders.length);
        this.__repo.commit();
    }

    // points
    public addPointAt(point: CurvePoint, idx: number) {
        const api = this.__repo.start("addPointAt", {});
        api.addPointAt(this.__page, this.__shape as PathShape, idx, point);
        this.__repo.commit();
    }


    // 容器自适应大小
    public adapt() {
        if (this.__shape.type === ShapeType.Artboard) {
            const childs = (this.__shape as Artboard).childs;
            if (childs.length) {
                try {
                    const api = this.__repo.start("adapt", {});
                    const __points: [number, number][] = [];
                    childs.forEach(p => {
                        const { width, height } = p.frame;
                        let _ps: [number, number][] = [
                            [0, 0],
                            [width, 0],
                            [width, height],
                            [0, height]
                        ]
                        const m = p.matrix2Root();
                        _ps = _ps.map(p => {
                            const np = m.computeCoord(p[0], p[1]);
                            return [np.x, np.y];
                        })
                        __points.push(..._ps);
                    })
                    const box = createHorizontalBox(__points);
                    if (box) {
                        const { x: ox, y: oy } = this.__shape.frame2Root();
                        const { dx, dy } = { dx: ox - box.left, dy: oy - box.top };
                        for (let i = 0; i < childs.length; i++) {
                            translate(api, this.__page, childs[i], dx, dy);
                        }
                        expandTo(api, this.__page, this.__shape, box.right - box.left, box.bottom - box.top);
                        translateTo(api, this.__page, this.__shape, box.left, box.top);
                        this.__repo.commit();
                    } else {
                        this.__repo.rollback();
                    }
                } catch (error) {
                    this.__repo.rollback();
                    throw new Error(`${error}`);
                }
            }
        }
    }
    // 删除图层
    public delete() {
        const parent = this.__shape.parent as GroupShape;
        if (parent) {
            const childs = (parent as GroupShape).childs;
            const index = childs.findIndex(s => s.id === this.__shape.id);
            if (index >= 0) {
                try {
                    const api = this.__repo.start("deleteShape", {});
                    if (this.__shape.type === ShapeType.Contact) {
                        this.removeContactSides(api, this.__page, this.__shape as unknown as ContactShape);
                    } else {
                        this.removeContact(api, this.__page, this.__shape);
                    }
                    api.shapeDelete(this.__page, parent, index);
                    // 当所删除元素为某一个编组的最后一个子元素时，需要把这个编组也删掉
                    if (!parent.childs.length && parent.type === ShapeType.Group) {
                        const _p = parent.parent;
                        const _idx = (_p as GroupShape).childs.findIndex(c => c.id === parent.id);
                        api.shapeDelete(this.__page, (_p as GroupShape), _idx);
                    }
                    this.__repo.commit();
                } catch (error) {
                    this.__repo.rollback();
                    throw new Error(`${error}`);
                }
            }
        }
    }
    private removeContactSides(api: Api, page: Page, shape: ContactShape) {
        if (shape.from) {
            const fromShape = page.getShape(shape.from.shapeId);
            const contacts = fromShape?.style.contacts;
            if (fromShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, fromShape, idx);
                }
            }
        }
        if (shape.to) {
            const toShape = page.getShape(shape.to.shapeId);
            const contacts = toShape?.style.contacts;
            if (toShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, toShape, idx);
                }
            }
        }
    }
    private removeContact(api: Api, page: Page, shape: Shape) {
        const contacts = shape.style.contacts;
        if (contacts && contacts.length) {
            for (let i = 0, len = contacts.length; i < len; i++) {
                const shape = page.getShape(contacts[i].shapeId);
                if (!shape) continue;
                const p = shape.parent;
                if (!p) continue;
                let idx = -1;
                for (let j = 0, len = p.childs.length; j < len; j++) {
                    if (p.childs[j].id === shape.id) {
                        idx = j; break;
                    }
                }
                if (idx > -1) api.shapeDelete(page, p as GroupShape, idx);
            }
        }
    }
    public isDeleted() {
        return !this.__page.getShape(this.__shape.id);
    }

    // contact
    /**
     * @description 修改连接线的编辑状态，如果一条连接线的状态为被用户手动编辑过，
     * 则在生成路径的时候应该以用户手动确认的点为主体，让两端去连接这些用户手动确认的点。
     */
    public modify_edit_state(state: boolean) {
        if (this.__shape.type !== ShapeType.Contact) return false;
        const api = this.__repo.start("modify_edit_state", {});
        api.contactModifyEditState(this.__page, this.__shape, state);
        this.__repo.commit();
    }
    /**
     * @description 寻找可能需要产生的新点
     */
    private get_points_for_init(index: number, points: CurvePoint[]) {
        let len = points.length;
        let result = [...points];
        if (index === 0) { // 如果编辑的线为第一根线；
            const from = this.__shape.from;
            if (!from) return result;
            const fromShape = this.__page.getShape((from as ContactForm).shapeId);
            if (!fromShape) return result;
            const xy_result = get_box_pagexy(fromShape);
            if (!xy_result) return result;
            const { xy1, xy2 } = xy_result;
            let p = get_nearest_border_point(fromShape, from.contactType, fromShape.matrix2Root(), xy1, xy2);
            if (!p) return result

            const m1 = this.__shape.matrix2Root();
            const f = this.__shape.frame;
            m1.preScale(f.width, f.height);
            const m2 = new Matrix(m1.inverse);

            p = m2.computeCoord3(p);
            const cp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y));
            const cp2 = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y));
            result.splice(1, 0, cp, cp2);
        }
        if (index === len - 2) { // 编辑的线为最后一根线；
            len = result.length; // 更新一下长度，因为部分场景下，编辑的线会同时为第一根线和最后一根线，若是第一根线的话，原数据已经更改，需要在下次更改数据前并判定为最后一根线后去更新result长度。
            const to = this.__shape.to;
            if (!to) return result;
            const toShape = this.__page.getShape((to as ContactForm).shapeId);
            if (!toShape) return result;
            const xy_result = get_box_pagexy(toShape);
            if (!xy_result) return result;
            const { xy1, xy2 } = xy_result;
            let p = get_nearest_border_point(toShape, to.contactType, toShape.matrix2Root(), xy1, xy2);
            if (!p) return result

            const m1 = this.__shape.matrix2Root();
            const f = this.__shape.frame;
            m1.preScale(f.width, f.height);
            const m2 = new Matrix(m1.inverse);

            p = m2.computeCoord3(p);
            const cp = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y));
            const cp2 = new CurvePoint(v4(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(p.x, p.y));
            result.splice(len - 1, 0, cp, cp2)
        }
        return result;
    }
    /**
     * @description 编辑路径之前，初始化点 —— 在编辑路径之前，渲染的点也许并不存在于连接线的数据上(points)，另外，编辑的预期效果可能需要产生新的点才可能实现。
     * 这个方法的目的就是把可能需要产生的新点、已经渲染的点全部更新到连接线的数据上以支持后续操作；
     */
    public pre_modify_side(index: number) {
        if (this.__shape.type !== ShapeType.Contact) return false;
        const points = this.get_points_for_init(index, this.__shape.getPoints());
        const api = this.__repo.start("init_points", {});
        const len = this.__shape.points.length;
        api.deletePoints(this.__page, this.__shape as PathShape, 0, len);
        for (let i = 0, len = points.length; i < len; i++) {
            const p = importCurvePoint(exportCurvePoint(points[i]));
            p.id = v4();
            points[i] = p;
        }
        api.addPoints(this.__page, this.__shape as PathShape, points);
        this.__repo.commit();
    }
    public modify_frame_by_points() {
        const api = this.__repo.start("modify_frame_by_points", {});
        update_frame_by_points(api, this.__page, this.__shape);
        this.__repo.commit();
    }
    public reset_contact_path() {
        if (this.__shape.type !== ShapeType.Contact) return false;
        const api = this.__repo.start("reset_contact_path", {});
        api.contactModifyEditState(this.__page, this.__shape, false);
        const points = this.get_points_for_init(1, this.__shape.getPoints());
        const len = this.__shape.points.length;
        api.deletePoints(this.__page, this.__shape as PathShape, 0, len);
        for (let i = 0, len = points.length; i < len; i++) {
            const p = importCurvePoint(exportCurvePoint(points[i]));
            p.id = v4();
            points[i] = p;
        }
        api.addPoints(this.__page, this.__shape as PathShape, points);
        update_frame_by_points(api, this.__page, this.__shape);
        this.__repo.commit();
    }

    // symbolref
    switchSymRef(refId: string) {
        if (!(this.__shape instanceof SymbolRefShape)) return;
        // check？

        if (this.modifyVariable(VariableType.Instance, OverrideType.SymbolID, (_var) => {
            return refId;
        })) return;

        const api = this.__repo.start("switchSymRef", {});
        try {
            api.shapeModifySymRef(this.__page, this.__shape, refId);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // symbolref
    switchSymState(varId: string, state: string) {
        if (!(this.__shape instanceof SymbolRefShape)) return;

        const shape: SymbolRefShape = this.__shape;
        const sym: SymbolShape | undefined = shape.peekSymbol();
        if (!sym) return;

        if (!sym.isUnionSymbolShape) return;

        const symbols: SymbolShape[] = sym.childs as any as SymbolShape[];

        const curVars = new Map<string, Variable>();
        const curState = new Map<string, string>();
        let originVarId = varId;
        let _var: Variable | undefined;
        sym.variables?.forEach((v) => {
            if (v.type === VariableType.Status) {
                const overrides = shape.findOverride(v.id, OverrideType.Variable);
                const _v = overrides ? overrides[overrides.length - 1] : v;
                if (_v.id === varId) {
                    originVarId = v.id;
                    _var = _v;
                }
                curState.set(v.id, _v.id === varId ? state : _v.value);
                curVars.set(v.id, _v);
            }
        })

        if (!_var) {
            throw new Error();
        }

        // 找到对应的shape
        const candidateshape: SymbolShape[] = []
        const matchshapes: SymbolShape[] = [];
        symbols.forEach((s) => {
            const vartag = s.vartag;

            let match = true;
            curState.forEach((v, k) => {
                const tag = vartag ? vartag.get(k) : s.name;
                if (match) match = v === tag;
                if (k === originVarId && v === state) candidateshape.push(s);
            });
            if (match) {
                matchshapes.push(s);
            }
        })
        // 
        if (matchshapes.length > 0) {
            // 可以修改

            const host = varParent(_var);
            if (!host) throw new Error();
            if (host.isVirtualShape || host instanceof SymbolShape) {

                // todo host is symbolshape
                let override_id = host.id;
                override_id = override_id.substring(override_id.indexOf('/') + 1); // 需要截掉第一个
                if (override_id.length === 0) throw new Error();

                // override
                // get first not virtual
                let symRef = host.parent;
                while (symRef && symRef.isVirtualShape) symRef = symRef.parent;
                if (!symRef || !(symRef instanceof SymbolRefShape)) throw new Error();

                const _var2 = new Variable(uuid(), VariableType.Status, "");
                _var2.value = state;
                const api = this.__repo.start('switchSymState', {});
                try {

                    api.shapeAddVariable(this.__page, symRef, _var2);
                    api.shapeAddOverride(this.__page, symRef, override_id, OverrideType.Variable, _var2.id);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
            else {
                const api = this.__repo.start("switchSymState", {});
                try {
                    api.shapeModifyVariable(this.__page, _var, state);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
        }
        else if (candidateshape.length > 0) {
            // 需要同步修改其它变量

            // 取第一个
            const candidate = candidateshape[0];
            const vartag = candidate.vartag;

            // 收集要同步修改的变量
            const needModifyVars: Variable[] = [];
            curState.forEach((v, k) => {
                const tag = vartag ? vartag.get(k) : candidate.name;
                if (tag !== v) {
                    needModifyVars.push(curVars.get(k)!);
                }
            })

            // check varId inside
            if (!needModifyVars.find((v) => v.id === varId)) throw new Error();

            const api = this.__repo.start("switchSymState", {});
            try {
                // todo 要判断var是否可修改！
                needModifyVars.forEach((v) => {
                    this.modifyVariable2(v, state, api);
                })
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }

        }
        else {
            // 
            throw new Error();
        }
    }

    // symbol
    modifySymTag(varId: string, tag: string) {
        if (!(this.__shape instanceof SymbolShape)) return;
        if (this.__shape.isVirtualShape) return;

        const shape = this.__shape;


        const sym = this.__shape.parent;
        if (!sym || !(sym instanceof SymbolShape) || !sym.isUnionSymbolShape) return;

        const symbols: SymbolShape[] = sym.childs as any as SymbolShape[];

        const curVars = new Map<string, Variable>();
        const curState = new Map<string, string>();
        let _var: Variable | undefined;
        sym.variables?.forEach((v) => {
            if (v.type === VariableType.Status) {
                const overrides = shape.findOverride(v.id, OverrideType.Variable);
                const _v = overrides ? overrides[overrides.length - 1] : v;
                curState.set(v.id, _v.value);
                curVars.set(v.id, _v);
            }
        })

        if (!_var) { // 不存在了？
            throw new Error();
        }

        // 找到对应的shape
        const matchshapes: SymbolShape[] = [];
        symbols.forEach((s) => {
            const vartag = s.vartag;

            let match = true;
            curState.forEach((v, k) => {
                const tag = vartag ? vartag.get(k) : s.name;
                if (match) match = v === tag;
            });
            if (match) {
                matchshapes.push(s);
            }
        })

        const matchshape = matchshapes[0];
        // 同步修改当前var的值，判断下是不是选择了这个sym?

        // 检查重复值，这个无法避免完全不重复，还是有可能同步修改过来的
        // 

        const api = this.__repo.start("modifySymTag", {});
        try {
            if (shape.id === matchshape.id) {
                // todo
                // 同步修改对应的变量值
                const _var = curVars.get(varId);
                if (!_var) throw new Error();
                this.modifyVariable2(_var, tag, api);
            }

            // todo 判断shape是否是virtual? 不能是
            // 修改vartag
            api.shapeModifyVartag(this.__page, shape, varId, tag);

            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // symbol symbolref
    createVar(type: VariableType, name: string, value: any) {
        if (!(this.__shape instanceof SymbolShape) && !(this.__shape instanceof SymbolRefShape)) return;
        if (this.__shape.isVirtualShape) return;

        // virtual? no

        const _var = new Variable(uuid(), type, name);
        _var.value = value;
        const api = this.__repo.start("createVar", {});
        try {
            api.shapeAddVariable(this.__page, this.__shape, _var);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // shape
    bindVar(slot: OverrideType, varId: string) {
        // check varId
        const _vars: Variable[] = [];
        this.__shape.findVar(varId, _vars);
        if (_vars.length === 0) throw new Error();

        const _var = _vars[_vars.length - 1];

        const shape = this.__shape;
        // check virtual
        if (shape.isVirtualShape) {
            // override 
            if (shape.varbinds && shape.varbinds.has(slot)) {
                // override variable
                // this.modifyVariable(VariableType., slot, () => varId)
                const ret: Variable[] = [];
                shape.findVar(shape.varbinds.get(slot)!, ret);

                const api = this.__repo.start("bindVar", {});
                try {
                    this._overrideVariable2(_var, varId, api);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
            else {
                // override to variable // todo slot要与override相同！
                const api = this.__repo.start("bindVar", {});
                try {
                    this._override2Variable(varId, slot, api);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
        }
        else {
            const api = this.__repo.start("bindVar", {});
            try {
                api.shapeBindVar(this.__page, this.__shape, slot, varId);
                this.__repo.commit();
            } catch (e) {
                console.error(e);
                this.__repo.rollback();
            }
        }

    }
}