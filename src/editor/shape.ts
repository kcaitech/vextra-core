import {
    GroupShape,
    PathShape,
    PathShape2,
    RectShape,
    Shape,
    ShapeType,
    SymbolShape,
    TextShape,
    Variable
} from "../data/shape";
import {Border, BorderPosition, BorderStyle, Color, Fill, MarkerType} from "../data/style";
import {expand, expandTo, translate, translateTo} from "./frame";
import {BoolOp, CurvePoint, Point2D} from "../data/baseclasses";
import {Artboard} from "../data/artboard";
import {createHorizontalBox} from "../basic/utils";
import {Page} from "../data/page";
import {CoopRepository} from "./command/cooprepo";
import {ContactForm, CurveMode, OverrideType, VariableType} from "../data/typesdefine";
import {Api} from "./command/recordapi";
import {update_frame_by_points} from "./path";
import {exportCurvePoint} from "../data/baseexport";
import {importBorder, importCurvePoint, importFill} from "../data/baseimport";
import {v4} from "uuid";
import {get_box_pagexy, get_nearest_border_point} from "../data/utils";
import {Matrix} from "../basic/matrix";
import {ContactShape} from "../data/contact";
import {Document, SymbolRefShape} from "../data/classes";
import {uuid} from "../basic/uuid";
import {BasicArray} from "../data/basic";
import {is_default_state, is_part_of_symbol} from "./utils";

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}

export class ShapeEditor {
    protected __shape: Shape;
    protected __repo: CoopRepository;
    protected __page: Page;
    protected __document: Document

    constructor(shape: Shape, page: Page, repo: CoopRepository, document: Document) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    private _repoWrap(name: string, func: (api: Api) => void) {
        const api = this.__repo.start(name, {});
        try {
            func(api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 将当前shape的overridetype对应的属性，override到varid的变量
     * @param varId
     * @param type
     * @param api
     */
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
            } else {
                override_id = ""
            }
        }
        // if (type !== OverrideType.Variable) {
        if (override_id.length > 0) override_id += "/";
        override_id += type;
        // }

        api.shapeAddOverride(this.__page, sym, override_id, type, varId);
    }

    /**
     * 将变量_var override到值为value的新变量
     * 变量_var可能来自symbolref(virtual)或者symbolshape
     * @param _var
     * @param value
     * @param api
     * @returns
     */
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
            } else {
                override_id = ""
            }
        }
        if (override_id.length > 0) override_id += "/";
        override_id += _var.id;

        const _var2 = new Variable(uuid(), _var.type, _var.name, value);
        // _var2.value = value;
        api.shapeAddVariable(this.__page, sym, _var2);
        api.shapeAddOverride(this.__page, sym, _var.id, OverrideType.Variable, _var2.id);

        return sym.getVar(_var2.id)!;
    }

    _overrideVariableName(_var: Variable, name: string, api: Api) {

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
            } else {
                override_id = ""
            }
        }
        if (override_id.length > 0) override_id += "/";
        override_id += _var.id;

        const _var2 = new Variable(uuid(), _var.type, name, _var.value);
        // _var2.value = value;
        api.shapeAddVariable(this.__page, sym, _var2);
        api.shapeAddOverride(this.__page, sym, _var.id, OverrideType.Variable, _var2.id);

        return sym.getVar(_var2.id)!;
    }

    /**
     * 修改_var的值为value，如果_var不可以修改，则override _var到value
     * @param _var
     * @param value
     * @param api
     */
    modifyVariable2(_var: Variable, value: any, api: Api) {
        const p = varParent(_var);
        if (!p) throw new Error();

        const shape = this.__shape;
        if (p.isVirtualShape || (p instanceof SymbolShape && !(shape instanceof SymbolShape))) {
            // override
            // const api = this.__repo.
            this._overrideVariable(_var, value, api);
        } else {
            api.shapeModifyVariable(this.__page, _var, value);
        }
    }

    /**
     * @description 修改实例身上某一个变量的值 --01b627f5b636
     * @param _var
     * @param value
     */
    modifySymbolRefVariable(_var: Variable, value: any) {
        const api = this.__repo.start("modifySymbolRefVariable", {});
        try {
            this.modifyVariable2(_var, value, api);
            this.__repo.commit();
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    resetSymbolRefVariable() {
        const variables = (this.__shape as SymbolRefShape).variables;
        const virbindsEx = (this.__shape as SymbolRefShape).virbindsEx;
        if (!variables || !virbindsEx) return false;
        try {
            const api = this.__repo.start('resetSymbolRefVariable', {});
            variables.forEach((_, k) => {
                api.shapeRemoveVariable(this.__page, this.__shape as SymbolRefShape, k);
            });
            // virbindsEx.forEach((_, k) => virbindsEx.delete(k));
            this.__repo.commit();
            if (variables.size === 0) return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 修改_var的名称为name，如果_var不可以修改，则override _var到name
     */
    modifyVariableName(_var: Variable, name: string) {
        try {
            const p = varParent(_var);
            if (!p) throw new Error('wrong shape type');
            const shape = this.__shape;
            const api = this.__repo.start("modifyVariableName", {});
            if (p.isVirtualShape || (p instanceof SymbolShape && !(shape instanceof SymbolShape))) {
                // override
                this._overrideVariableName(_var, name, api);
            } else {
                api.shapeModifyVariableName(this.__page, _var, name);
            }
            this.__repo.commit();
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
        }
    }

    /**
     * 将变量fromVar override 到id为toVarId的变量
     * */
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
            } else {
                override_id = ""
            }
        }
        override_id += '/' + fromVar.id;

        api.shapeAddOverride(this.__page, sym, override_id, OverrideType.Variable, toVarId);
    }

    /**
     * 检查当前shape的overrideType对应的属性值是否由变量起作用，如果是则判断var是否可以修改，如可以则「返回」var，否则先override再「返回」新的var
     * 适合text这种，value的修改非原子操作的情况
     *
     * @param varType
     * @param overrideType
     * @param valuefun
     * @param api
     * @param shape
     * @returns
     */
    overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, shape?: Shape) {
        shape = shape ?? this.__shape;
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
                    const ret = this._overrideVariable(_var, valuefun(_var), api);
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
                    const ret = this._overrideVariable(_var, valuefun(_var), api);
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
        const _var2 = new Variable(uuid(), varType, "", valuefun(undefined));
        // _var2.value = valuefun(undefined);
        api.shapeAddVariable(this.__page, symRef, _var2);
        api.shapeAddOverride(this.__page, symRef, override_id, overrideType, _var2.id);

        return symRef.getVar(_var2.id)!;
    }

    /**
     * 检查当前shape的overrideType对应的属性值是否由变量起作用，如果是则判断var是否可以修改，如可以则「修改」var，否则先override再「修改」新的var zrx?是否用于修改组件身上的变量
     * @param varType
     * @param overrideType
     * @param valuefun
     * @returns
     */
    modifyVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any): boolean {
        // const _var = this.overrideVariable(slot, varType, ov)
        const shape = this.__shape;
        // symbol shape
        if (!shape.isVirtualShape && shape.varbinds && shape.varbinds.has(overrideType)) {
            const _vars: Variable[] = [];
            shape.findVar(shape.varbinds.get(overrideType)!, _vars);

            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === varType) {
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api);
                });
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
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api)
                });
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
                this._repoWrap('modifyVariable', (api) => {
                    this.modifyVariable2(_var, valuefun(_var), api)
                });
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
        const _symRef = symRef;
        const api = this._repoWrap('addOverrid', (api) => {
            const _var2 = new Variable(uuid(), varType, "", valuefun(undefined));
            // _var2.value = valuefun(undefined);
            api.shapeAddVariable(this.__page, _symRef, _var2);
            api.shapeAddOverride(this.__page, _symRef, override_id, overrideType, _var2.id);
        });
        // symRef.addOverrid(override_id, overrideType, value);

        return true;
    }

    public setName(name: string) {
        const api = this.__repo.start('setName', {});
        api.shapeModifyName(this.__page, this.__shape, name)
        api.shapeModifyNameFixed(this.__page, this.__shape, true);
        this.__repo.commit();
    }

    public toggleVisible() {
        //
        if (this.modifyVariable(VariableType.Visible, OverrideType.Visible, (_var) => {
            return _var ? !_var.value : !this.__shape.isVisible;
        })) {
            return;
        }
        this._repoWrap('toggleVisible', (api) => {
            api.shapeModifyVisible(this.__page, this.__shape, !this.__shape.isVisible)
        })
    }

    public toggleLock() {
        this._repoWrap('toggleLock', (api) => {
            api.shapeModifyLock(this.__page, this.__shape, !this.__shape.isLocked);
        });
    }

    public translate(dx: number, dy: number, round: boolean = true) {
        this._repoWrap("translate", (api) => {
            translate(api, this.__page, this.__shape, dx, dy, round);
        });
    }

    public translateTo(x: number, y: number) {
        this._repoWrap("translateTo", (api) => {
            translateTo(api, this.__page, this.__shape, x, y);
        });
    }

    public expand(dw: number, dh: number) {
        this._repoWrap("expand", (api) => {
            expand(api, this.__page, this.__shape, dw, dh);
        });
    }

    public expandTo(w: number, h: number) {
        this._repoWrap("expandTo", (api) => {
            expandTo(api, this.__page, this.__shape, w, h);
        });
    }

    public setConstrainerProportions(val: boolean) {
        this._repoWrap("setConstrainerProportions", (api) => {
            api.shapeModifyConstrainerProportions(this.__page, this.__shape, val)
        });
    }

    // flip
    public flipH() {
        this._repoWrap("flipHorizontal", (api) => {
            api.shapeModifyHFlip(this.__page, this.__shape, !this.__shape.isFlippedHorizontal)
        });
    }

    public flipV() {
        this._repoWrap("flipVertical", (api) => {
            api.shapeModifyVFlip(this.__page, this.__shape, !this.__shape.isFlippedVertical)
        });
    }

    // resizingConstraint
    public setResizingConstraint(value: number) {
        this._repoWrap("setResizingConstraint", (api) => {
            api.shapeModifyResizingConstraint(this.__page, this.__shape, value);
        });
    }

    // rotation
    public rotate(deg: number) {
        this._repoWrap("rotate", (api) => {
            deg = deg % 360;
            api.shapeModifyRotate(this.__page, this.__shape, deg)
        });
    }

    // radius
    public setRectRadius(lt: number, rt: number, rb: number, lb: number) {
        const shape = this.__shape;
        if (!(shape instanceof RectShape)) return;
        this._repoWrap("setRectRadius", (api) => {
            api.shapeModifyRadius(this.__page, shape, lt, rt, rb, lb);
        });
    }

    public setFixedRadius(fixedRadius: number) {
        if (this.__shape instanceof GroupShape) {
            if (!this.__shape.isBoolOpShape) return;
        } else if (!(this.__shape instanceof PathShape || this.__shape instanceof PathShape2 || this.__shape instanceof TextShape)) {
            return;
        }
        this._repoWrap("setFixedRadius", (api) => {
            api.shapeModifyFixedRadius(this.__page, this.__shape as GroupShape, fixedRadius || undefined);
        });
    }

    public setBoolOp(op: BoolOp, name?: string) {
        if (!(this.__shape instanceof GroupShape)) return;
        this._repoWrap("setBoolOp", (api) => {
            const shape = this.__shape as GroupShape;
            if (name) api.shapeModifyName(this.__page, this.__shape, name);
            shape.childs.forEach((child) => {
                api.shapeModifyBoolOp(this.__page, child, op);
            })
            api.shapeModifyBoolOpShape(this.__page, shape, op !== BoolOp.None);
        });
    }

    public setIsBoolOpShape(isOpShape: boolean) {
        if (!(this.__shape instanceof GroupShape)) return;
        this._repoWrap("setIsBoolOpShape", (api) => {
            api.shapeModifyBoolOpShape(this.__page, this.__shape as GroupShape, isOpShape);
        });
    }

    private shape4fill(api: Api, shape?: Shape) {
        const _shape = shape ?? this.__shape;
        const _var = this.overrideVariable(VariableType.Fills, OverrideType.Fills, (_var) => {
            const fills = _var?.value ?? _shape.style.fills;
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                    const ret = importFill(v);
                    const imgmgr = v.getImageMgr();
                    if (imgmgr) ret.setImageMgr(imgmgr)
                    return ret;
                }
            ))
        }, api, shape)
        return _var || _shape;
    }

    // fill
    public addFill(fill: Fill) {
        this._repoWrap("addFill", (api) => {
            const shape = this.shape4fill(api);
            api.addFillAt(this.__page, shape, fill, shape instanceof Shape ? shape.style.fills.length : shape.value.length);
        });
    }

    public setFillColor(idx: number, color: Color) {
        this._repoWrap("setFillColor", (api) => {
            const shape = this.shape4fill(api);
            api.setFillColor(this.__page, shape, idx, color)
        });
    }

    public setFillEnable(idx: number, value: boolean) {
        if (this.__shape.type !== ShapeType.Artboard) {
            this._repoWrap("setFillEnable", (api) => {
                const shape = this.shape4fill(api);
                api.setFillEnable(this.__page, shape, idx, value);
            });
        }
    }

    public deleteFill(idx: number) {
        this._repoWrap("deleteFill", (api) => {
            const shape = this.shape4fill(api);
            api.deleteFillAt(this.__page, shape, idx);
        });
    }

    private shape4border(api: Api, shape?: Shape) {
        const _shape = shape ?? this.__shape;
        const _var = this.overrideVariable(VariableType.Borders, OverrideType.Borders, (_var) => {
            const fills = _var?.value ?? _shape.style.borders;
            return new BasicArray(...(fills as Array<Border>).map((v) => {
                    const ret = importBorder(v);
                    return ret;
                }
            ))
        }, api, shape)
        return _var || _shape;
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        this._repoWrap("setBorderEnable", (api) => {
            const shape = this.shape4border(api);
            api.setBorderEnable(this.__page, shape, idx, isEnabled);
        });
    }

    public setBorderColor(idx: number, color: Color) {
        this._repoWrap("setBorderColor", (api) => {
            const shape = this.shape4border(api);
            api.setBorderColor(this.__page, shape, idx, color);
        });
    }

    public setBorderThickness(idx: number, thickness: number) {
        this._repoWrap("setBorderThickness", (api) => {
            const shape = this.shape4border(api);
            api.setBorderThickness(this.__page, shape, idx, thickness);
        });
    }

    public setBorderPosition(idx: number, position: BorderPosition) {
        this._repoWrap("setBorderPosition", (api) => {
            const shape = this.shape4border(api);
            api.setBorderPosition(this.__page, shape, idx, position);
        });
    }

    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        this._repoWrap("setBorderStyle", (api) => {
            const shape = this.shape4border(api);
            api.setBorderStyle(this.__page, shape, idx, borderStyle);
        });
    }

    public setMarkerType(mt: MarkerType, isEnd: boolean) {
        this._repoWrap("setMarkerType", (api) => {
            if (isEnd) {
                api.shapeModifyEndMarkerType(this.__page, this.__shape, mt);
            } else {
                api.shapeModifyStartMarkerType(this.__page, this.__shape, mt);
            }
        });
    }

    public exchangeMarkerType() {
        const {endMarkerType, startMarkerType} = this.__shape.style;
        if (endMarkerType !== startMarkerType) {
            this._repoWrap("exchangeMarkerType", (api) => {
                api.shapeModifyEndMarkerType(this.__page, this.__shape, startMarkerType || MarkerType.Line);
                api.shapeModifyStartMarkerType(this.__page, this.__shape, endMarkerType || MarkerType.Line);
            });
        }
    }

    public deleteBorder(idx: number) {

        this._repoWrap("deleteBorder", (api) => {
            const shape = this.shape4border(api);
            api.deleteBorderAt(this.__page, shape, idx)
        });

    }

    public addBorder(border: Border) {
        this._repoWrap("addBorder", (api) => {
            const shape = this.shape4border(api);
            api.addBorderAt(this.__page, shape, border, this.__shape.style.borders.length);
        });
    }

    // points
    public addPointAt(point: CurvePoint, idx: number) {
        this._repoWrap("addPointAt", (api) => {
            api.addPointAt(this.__page, this.__shape as PathShape, idx, point);
        });
    }


    // 容器自适应大小
    public adapt() {
        if (this.__shape.type === ShapeType.Artboard) {
            const childs = (this.__shape as Artboard).childs;
            if (childs.length) {
                const api = this.__repo.start("adapt", {});
                try {
                    const __points: [number, number][] = [];
                    childs.forEach(p => {
                        const {width, height} = p.frame;
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
                        const {x: ox, y: oy} = this.__shape.frame2Root();
                        const {dx, dy} = {dx: ox - box.left, dy: oy - box.top};
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
                    console.log(error);
                    this.__repo.rollback();
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
                const api = this.__repo.start("deleteShape", {});
                try {
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
                    if (this.__shape.type === ShapeType.Symbol) {
                        this.__document.__correspondent.notify('update-symbol-list');
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
                        idx = j;
                        break;
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
        this._repoWrap("modify_edit_state", (api) => {
            api.contactModifyEditState(this.__page, this.__shape, state);
        });
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
            const {xy1, xy2} = xy_result;
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
            const {xy1, xy2} = xy_result;
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
        this._repoWrap("init_points", (api) => {
            const len = this.__shape.points.length;
            api.deletePoints(this.__page, this.__shape as PathShape, 0, len);
            for (let i = 0, len = points.length; i < len; i++) {
                const p = importCurvePoint(exportCurvePoint(points[i]));
                p.id = v4();
                points[i] = p;
            }
            api.addPoints(this.__page, this.__shape as PathShape, points);
        });
    }

    public modify_frame_by_points() {
        this._repoWrap("modify_frame_by_points", (api) => {
            update_frame_by_points(api, this.__page, this.__shape);
        });
    }

    public reset_contact_path() {
        if (this.__shape.type !== ShapeType.Contact) return false;
        this._repoWrap("reset_contact_path", (api) => {
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
        });
    }

    // symbolref
    switchSymRef(refId: string) {
        if (!(this.__shape instanceof SymbolRefShape)) return;
        // check？

        if (this.modifyVariable(VariableType.SymbolRef, OverrideType.SymbolID, (_var) => {
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
    /**
     * @description 是否已经被废弃 zrx?
     */
    switchSymState(varId: string, state: string) {
        if (!(this.__shape instanceof SymbolRefShape)) return;

        const shape: SymbolRefShape = this.__shape;
        const symmgr = shape.getSymbolMgr();
        const sym = symmgr?.getSync(shape.refId);
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
            return console.log('no _var');
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

                const _var2 = new Variable(uuid(), VariableType.Status, "", state);
                // _var2.value = state;
                const api = this.__repo.start('switchSymState', {});
                try {

                    api.shapeAddVariable(this.__page, symRef, _var2);
                    api.shapeAddOverride(this.__page, symRef, override_id, OverrideType.Variable, _var2.id);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            } else {
                const api = this.__repo.start("switchSymState", {});
                try {
                    api.shapeModifyVariable(this.__page, _var, state);
                    this.__repo.commit();
                } catch (e) {
                    console.error(e);
                    this.__repo.rollback();
                }
            }
        } else if (candidateshape.length > 0) {
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
            if (!needModifyVars.find((v) => v.id === varId)) {
                return console.log('wrong vars data', needModifyVars);
            }

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

        } else {
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

    /**
     * @description 修改可变组件的某一个属性var的属性值 --776a0ac3351f
     */
    modifyStateSymTagValue(varId: string, tag: string) {
        if (!this.__shape.parent || !this.__shape.parent.isUnionSymbolShape) return;
        const api = this.__repo.start("modifyStateSymTagValue", {});
        try {
            const is_default = is_default_state(this.__shape as SymbolShape); // 如果修改的可变组件为默认可变组件，则需要更新组件的默认状态
            if (is_default) {
                const variables = (this.__shape.parent as SymbolShape).variables;
                const _var = variables?.get(varId);
                if (!_var) throw new Error('wrong variable');
                api.shapeModifyVariable(this.__page, _var, tag);
            }
            api.shapeModifyVartag(this.__page, this.__shape as SymbolShape, varId, tag);
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

        const _var = new Variable(uuid(), type, name, value);
        // _var.value = value;
        const api = this.__repo.start("createVar", {});
        try {
            api.shapeAddVariable(this.__page, this.__shape, _var);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * @description 给组件移除一个变量
     */
    removeVar(key: string) {
        if (!(this.__shape instanceof SymbolShape) && !(this.__shape instanceof SymbolRefShape)) return;
        if (this.__shape.isVirtualShape) return;

        // virtual? no
        const api = this.__repo.start("removeVar", {});
        try {
            api.shapeRemoveVariable(this.__page, this.__shape, key);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeBinds(type: OverrideType) {
        if (!is_part_of_symbol(this.__shape)) return;
        if (this.__shape instanceof SymbolShape) return;
        const api = this.__repo.start("removeVar", {});
        try {
            api.shapeUnbinVar(this.__page, this.__shape, type);
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
            } else {
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
        } else {
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