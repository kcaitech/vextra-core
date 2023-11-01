import {
    Cmd,
    PageCmdInsert, PageCmdModify, PageCmdMove, PageCmdDelete,
    ShapeArrayAttrMove, ShapeArrayAttrInsert, ShapeArrayAttrRemove, ShapeArrayAttrModify,
    ShapeCmdInsert, ShapeCmdRemove, ShapeCmdMove, ShapeCmdModify,
    TextCmdInsert, TextCmdRemove, TextCmdModify,
    TableCmdInsert, TableCmdRemove, TableCmdModify, TableIndex
} from "../../coop/data/classes";
import * as basicapi from "../basicapi"
import { Repository } from "../../data/transact";
import { Page } from "../../data/page";
import { Document } from "../../data/document";
import { exportBorder, exportBorderPosition, exportBorderStyle, exportColor, exportContactForm, exportContactRole, exportCurvePoint, exportFill, exportPage, exportPoint2D, exportTableCell, exportText, exportVariable } from "../../data/baseexport";
import { BORDER_ATTR_ID, BORDER_ID, CONTACTS_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, SHAPE_ATTR_ID, TABLE_ATTR_ID, TEXT_ATTR_ID } from "./consts";
import { GroupShape, Shape, PathShape, PathShape2, TextShape, Variable, SymbolShape } from "../../data/shape";
import { exportShape, updateShapesFrame } from "./utils";
import { Border, BorderPosition, BorderStyle, Color, ContextSettings, Fill, MarkerType, Style } from "../../data/style";
import { BulletNumbers, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import { cmdmerge } from "./merger";
import { RectShape, SymbolRefShape, TableCell, TableCellType, TableShape } from "../../data/classes";
import { CmdGroup } from "../../coop/data/cmdgroup";
import { BlendMode, BoolOp, BulletNumbersBehavior, BulletNumbersType, ContactForm, FillType, OverrideType, Point2D, StrikethroughType, TextTransformType, UnderlineType } from "../../data/typesdefine";
import { _travelTextPara } from "../../data/texttravel";
import { uuid } from "../../basic/uuid";
import { TableOpTarget } from "../../coop/data/classes";
import { ContactRole, CurvePoint } from "../../data/baseclasses";
import { ContactShape } from "../../data/contact"
import { BasicMap } from "../../data/basic";

// 要支持variable的修改
type TextShapeLike = Shape & { text: Text }

function varParent(_var: Variable) {
    let p = _var.parent;
    while (p && !(p instanceof Shape)) p = p.parent;
    return p;
}

function checkShapeAtPage(page: Page, obj: Shape | Variable) {
    // if (obj instanceof VirtualShape) {
    //     const id = obj.getRootId();
    //     if (!page.getShape(id)) throw new Error("shape not inside page")
    //     return;
    // }
    // if (obj instanceof TableCell) {
    //     obj = obj.parent as Shape;
    // }
    obj = obj instanceof Shape ? obj : varParent(obj) as Shape;
    const shapeid = obj.shapeId;
    if (!page.getShape(shapeid[0] as string)) throw new Error("shape not inside page")
}

function genShapeId(shape: Shape | Variable): Array<string | TableIndex> {
    const _shape = shape instanceof Shape ? shape : varParent(shape) as Shape;
    const shapeId = _shape.shapeId.map((v) => {
        if (typeof v === 'string') return v;
        return new TableIndex(v.rowIdx, v.colIdx);
    });
    if (shape instanceof Variable) shapeId.push("varid:" + shape.id); // varid
    return shapeId;
}

export class Api {
    private cmds: Cmd[] = [];
    private needUpdateFrame: { shape: Shape, page: Page }[] = [];
    private repo: Repository;
    constructor(repo: Repository) {
        this.repo = repo;
    }
    start() {
        this.cmds.length = 0;
        this.needUpdateFrame.length = 0;
    }
    isNeedCommit(): boolean {
        return this.cmds.length > 0;
    }
    commit(): Cmd | undefined {
        if (this.needUpdateFrame.length > 0) {
            const update = this.needUpdateFrame.slice(0);
            const page = update[0].page;
            const shapes = update.map((v) => v.shape);
            updateShapesFrame(page, shapes, this)
        }
        this.needUpdateFrame.length = 0;
        if (this.cmds.length <= 1) return this.cmds[0];

        // group cmds
        // check group type
        const first = this.cmds[0];
        return this.groupCmd(first.blockId);
    }
    private groupCmd(blockId: string): Cmd {
        const group = CmdGroup.Make(blockId);
        this.cmds.forEach((c) => {
            if (c.blockId !== blockId) throw new Error("blockid not equal");
            c.unitId = group.unitId;
            group.cmds.push(c as any);
        })
        return group;
    }

    private __trap(f: () => void) {
        const save = this.repo.transactCtx.settrap;
        this.repo.transactCtx.settrap = false;
        try {
            f();
        }
        finally {
            this.repo.transactCtx.settrap = save;
        }
    }
    private addCmd(cmd: Cmd) {
        // 需要做合并
        if (!cmdmerge(this.cmds, cmd)) {
            this.cmds.push(cmd);
        }
    }

    pageInsert(document: Document, page: Page, index: number) {
        this.__trap(() => {
            basicapi.pageInsert(document, page, index);
        })
        this.addCmd(PageCmdInsert.Make(document.id, index, page.id, exportPage(page)))
    }
    pageDelete(document: Document, index: number) {
        const item = document.getPageItemAt(index);
        if (item) {
            this.__trap(() => {
                basicapi.pageDelete(document, index);
            })
            const page = document.pagesMgr.getSync(item.id)
            this.addCmd(PageCmdDelete.Make(document.id, item.id, index, JSON.stringify(exportPage(page!))))
        }
    }
    pageModifyName(document: Document, pageId: string, name: string) {
        const item = document.pagesList.find(p => p.id === pageId);
        if (!item) return;
        const s_name = item.name;
        const save = this.repo.transactCtx.settrap;
        this.repo.transactCtx.settrap = false;
        try {
            item.name = name;
        } finally {
            this.repo.transactCtx.settrap = save;
        }
        this.addCmd(PageCmdModify.Make(document.id, item.id, PAGE_ATTR_ID.name, name, s_name));
    }
    pageModifyBackground(document: Document, pageId: string, color: Color) {
        const item = document.pagesMgr.getSync(pageId);
        if (!item) return;
        const contextSettings = new ContextSettings(BlendMode.Normal, 1);
        const fillColor = new Color(1, 239, 239, 239);
        const fill = new Fill(uuid(), true, FillType.SolidColor, fillColor);
        const pre = item.style.fills[0];
        const save = this.repo.transactCtx.settrap;
        this.repo.transactCtx.settrap = false;
        if (!pre) item.style.fills.push(fill);
        const s = JSON.stringify(exportFill(item.style.fills[0]));
        try {
            item.style.fills[0].color = color;
        } finally {
            this.repo.transactCtx.settrap = save;
        }
        this.addCmd(PageCmdModify.Make(document.id, item.id, PAGE_ATTR_ID.background, JSON.stringify(exportFill(item.style.fills[0])), s));
    }
    pageMove(document: Document, pageId: string, fromIdx: number, toIdx: number) {
        this.__trap(() => {
            basicapi.pageMove(document, fromIdx, toIdx);
        })
        this.addCmd(PageCmdMove.Make(document.id, pageId, fromIdx, toIdx))
    }

    shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number): Shape {
        this.__trap(() => {
            shape = parent.addChildAt(shape, index);
            page.onAddShape(shape);
        })
        this.addCmd(ShapeCmdInsert.Make(page.id, parent.id, shape.id, index, exportShape(shape)))
        this.needUpdateFrame.push({ page, shape });
        return shape;
    }
    shapeDelete(page: Page, parent: GroupShape, index: number) {
        let shape: Shape | undefined;
        this.__trap(() => {
            shape = parent.removeChildAt(index);
            if (shape) {
                page.onRemoveShape(shape);
                if (parent.childs.length > 0) {
                    this.needUpdateFrame.push({ page, shape: parent.childs[0] })
                }
            }
        })
        if (shape) this.addCmd(ShapeCmdRemove.Make(page.id, parent.id, shape.id, index, JSON.stringify(exportShape(shape))));
    }
    shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number) {
        this.__trap(() => {
            const shape = parent.childs.splice(index, 1)[0];
            if (shape) {
                parent2.childs.splice(index2, 0, shape);
                this.needUpdateFrame.push({ page, shape })
                if (parent.id !== parent2.id && parent.childs.length > 0) {
                    this.needUpdateFrame.push({ page, shape: parent.childs[0] })
                }
                this.addCmd(ShapeCmdMove.Make(page.id, parent.id, shape.id, index, parent2.id, index2));
            }
        });
    }
    shapeModifyX(page: Page, shape: Shape, x: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (x !== frame.x) {
            this.__trap(() => {
                const save = frame.x;
                frame.x = x;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.x, x, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyY(page: Page, shape: Shape, y: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (y !== frame.y) {
            this.__trap(() => {
                const save = frame.y;
                frame.y = y;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.y, y, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        this.shapeModifyWidth(page, shape, w);
        this.shapeModifyHeight(page, shape, h);
    }
    shapeModifyWidth(page: Page, shape: Shape, w: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (w !== frame.width) {
            this.__trap(() => {
                const save = frame.width;
                shape.setFrameSize(w, frame.height);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.width, w, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyHeight(page: Page, shape: Shape, h: number) {
        checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (h !== frame.height) {
            this.__trap(() => {
                const save = frame.height;
                shape.setFrameSize(frame.width, h);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.height, h, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyStartMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        const style = shape.style;
        if (mt !== style.startMarkerType) {
            this.__trap(() => {
                const save = style.startMarkerType;
                style.startMarkerType = mt;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.startMarkerType, mt, save))
            })
        }
    }
    shapeModifyEndMarkerType(page: Page, shape: Shape, mt: MarkerType) {
        checkShapeAtPage(page, shape);
        const style = shape.style;
        if (mt !== style.endMarkerType) {
            this.__trap(() => {
                const save = style.endMarkerType;
                style.endMarkerType = mt;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.endMarkerType, mt, save))
            })
        }
    }
    shapeModifyContactFrom(page: Page, shape: ContactShape, from: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.from ? exportContactForm(shape.from) : shape.from;
            shape.from = from;
            let t: undefined | string = undefined;
            if (from) t = JSON.stringify(exportContactForm(from));
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.contactFrom, t, save));
        })
    }
    shapeModifyContactTo(page: Page, shape: ContactShape, to: ContactForm | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.to ? exportContactForm(shape.to) : shape.to;
            shape.to = to;
            let t: undefined | string = undefined;
            if (to) t = JSON.stringify(exportContactForm(to));
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.contactTo, t, save))
        })
    }
    contactModifyEditState(page: Page, shape: Shape, state: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isEdited;
            shape.isEdited = state;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.isEdited, state, save))
        })
    }
    shapeModifyRotate(page: Page, shape: Shape, rotate: number) {
        checkShapeAtPage(page, shape);
        if (rotate !== shape.rotation) {
            this.__trap(() => {
                const save = shape.rotation;
                shape.rotation = rotate % 360;
                this.needUpdateFrame.push({ page, shape });
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.rotate, rotate, save))
            })
        }
    }
    shapeModifyConstrainerProportions(page: Page, shape: Shape, prop: boolean) {
        checkShapeAtPage(page, shape);
        if (shape.constrainerProportions !== prop) {
            this.__trap(() => {
                const save = shape.constrainerProportions;
                shape.constrainerProportions = prop;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.constrainerProportions, prop, save))
            })
        }
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.name;
            shape.name = name;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.name, name, save));
        })
    }
    shapeModifyNameFixed(page: Page, shape: Shape, isFixed: boolean) {
        checkShapeAtPage(page, shape);
        if (shape.nameIsFixed !== isFixed) {
            this.__trap(() => {
                const save = !!shape.nameIsFixed;
                shape.nameIsFixed = isFixed;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.nameIsFixed, isFixed, save));
            })
        }
    }
    shapeModifyVariable(page: Page, _var: Variable, value: any) {
        checkShapeAtPage(page, _var);
        this.__trap(() => {
            const save = exportVariable(_var);
            _var.value = value;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(_var), SHAPE_ATTR_ID.modifyvarValue, exportVariable(_var), save));
        })
    }
    shapeModifyVariableName(page: Page, _var: Variable, name: string) {
        checkShapeAtPage(page, _var);
        this.__trap(() => {
            const save = exportVariable(_var);
            _var.name = name;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(_var), SHAPE_ATTR_ID.modifyvarName, exportVariable(_var), save));
        })
    }
    shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            shape.addVar(_var);
            const shapeId = genShapeId(shape);
            shapeId.push(_var.id);
            const origin = new Variable(_var.id, _var.type, _var.name, undefined);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyvar1, exportVariable(_var), exportVariable(origin)));
        })
    }
    shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _var = shape.getVar(key)!;
            shape.removeVar(key);
            const shapeId = genShapeId(shape);
            shapeId.push(key);
            const cur = new Variable(_var.id, _var.type, _var.name, undefined);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyvar1, exportVariable(cur), exportVariable(_var)));
        })
    }
    shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.varbinds?.get(type);
            if (!shape.varbinds) shape.varbinds = new BasicMap();
            shape.varbinds.set(type, varId);
            const shapeId = genShapeId(shape);
            shapeId.push(type);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.bindvar, { type, varId }, { type, varId: save }));
        })
    }
    shapeUnbinVar(page: Page, shape: Shape, type: OverrideType) {
        checkShapeAtPage(page, shape);
        if (!shape.varbinds?.get(type)) return;
        this.__trap(() => {
            const save = shape.varbinds!.get(type);
            const shapeId = genShapeId(shape);
            shape.varbinds!.delete(type);
            shapeId.push(type);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { type, varId: undefined }, { type, varId: save }));
        })
    }
    // shapeModifyOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
    //     checkShapeAtPage(page, shape);
    //     this.__trap(() => {
    //         const save = shape.getOverrid2(refId, attr);
    //         shape.addOverrid2(refId, attr, value);
    //         const shapeId = genShapeId(shape);
    //         shapeId.push(refId + '/' + attr);
    //         this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { refId, attr, value }, { refId, attr, value: save }));
    //     })
    // }
    shapeAddOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            shape.addOverrid2(refId, attr, value);
            const shapeId = genShapeId(shape);
            shapeId.push(refId + '/' + attr);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.modifyoverride1, { refId, attr, value }, { refId, attr, value: undefined }));
        })
    }

    /**
     * @description 初始化或修改组件的状态属性
     */
    shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.vartag?.get(varId);
            const shapeId = genShapeId(shape);
            shapeId.push(varId);
            if (!shape.vartag) shape.vartag = new BasicMap();
            shape.setTag(varId, tag);
            this.addCmd(ShapeCmdModify.Make(page.id, shapeId, SHAPE_ATTR_ID.vartag, { varId, tag }, { varId, tag: save }));
        })
    }
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isVisible;
            shape.setVisible(isVisible);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.visible, isVisible, save));
        })
    }
    shapeModifySymRef(page: Page, shape: SymbolRefShape, refId: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.refId;
            shape.refId = refId;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.symbolref, refId, save));
        })
    }
    shapeModifyIsUnion(page: Page, shape: Shape, isUnionSymbolShape: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isUnionSymbolShape;
            shape.isUnionSymbolShape = isUnionSymbolShape;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.isUnionSymbolShape, isUnionSymbolShape, save))
        })
    }
    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isLocked;
            shape.isLocked = isLocked;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.lock, isLocked, save));
        })
    }
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isFlippedHorizontal;
            shape.isFlippedHorizontal = hflip;
            this.needUpdateFrame.push({ page, shape });
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.hflip, hflip, save));
        })
    }
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isFlippedVertical;
            shape.isFlippedVertical = vflip;
            this.needUpdateFrame.push({ page, shape });
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.vflip, vflip, save));
        })
    }
    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.resizingConstraint;
            shape.setResizingConstraint(resizingConstraint);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.resizingConstraint, resizingConstraint, save))
        })
    }
    shapeModifyRadius(page: Page, shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.getRectRadius();
            shape.setRectRadius(lt, rt, rb, lb);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.radius, { lt, rt, rb, lb }, save))
        })
    }
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | PathShape2 | TextShape, fixedRadius: number | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.fixedRadius;
            if ((save || 0) !== (fixedRadius || 0)) {
                shape.fixedRadius = fixedRadius;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.fixedRadius, fixedRadius, save))
            }
        })
    }
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.point);
            p.point.x = point.x;
            p.point.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.point, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.curveFrom);
            p.curveFrom.x = point.x;
            p.curveFrom.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.from, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.curveTo);
            p.curveTo.x = point.x;
            p.curveTo.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), POINTS_ID, p.id, POINTS_ATTR_ID.to, exportPoint2D(point), origin))
        })
    }
    shapeModifyBoolOp(page: Page, shape: Shape, op: BoolOp | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const origin = shape.boolOp;
            if ((origin ?? BoolOp.None) !== (op ?? BoolOp.None)) {
                shape.boolOp = op;
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.boolop, op, origin));
            }
        })
    }
    shapeModifyBoolOpShape(page: Page, shape: GroupShape, isOpShape: boolean | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const origin = shape.isBoolOpShape;
            if (!!isOpShape !== !!origin) {
                basicapi.shapeModifyBoolOpShape(shape, isOpShape);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.isboolopshape, isOpShape, origin));
            }
        })
    }

    // 添加一次fill
    addFillAt(page: Page, shape: Shape | Variable, fill: Fill, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            basicapi.addFillAt(fills, fill, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)))
        })
    }
    // 添加多次fill
    addFills(page: Page, shape: Shape | Variable, fills: Fill[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
            for (let i = 0; i < fills.length; i++) {
                const fill = fills[i];
                basicapi.addFillAt(fillsOld, fill, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, i, exportFill(fill)));
            }
        })
    }
    // 添加一条border
    addBorderAt(page: Page, shape: Shape | Variable, border: Border, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            basicapi.addBorderAt(borders, border, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    // 添加多条border
    addBorders(page: Page, shape: Shape | Variable, borders: Border[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
            for (let i = 0; i < borders.length; i++) {
                const border = borders[i];
                basicapi.addBorderAt(bordersOld, border, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, i, exportBorder(border)));
            }
        })
    }
    // 删除一次fill
    deleteFillAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        if (!fills[index]) return;
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(fills, index);
            if (fill) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    // 批量删除fill
    deleteFills(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fillsOld = shape instanceof Shape ? shape.style.fills : shape.value;
            const fills = basicapi.deleteFills(fillsOld, index, strength);
            if (fills && fills.length) {
                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
                }
            }
        })
    }
    // 删除一次border
    deleteBorderAt(page: Page, shape: Shape | Variable, index: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[index]) return;
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(borders, index);
            if (border) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
        })
    }
    // 批量删除border
    deleteBorders(page: Page, shape: Shape | Variable, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const bordersOld = shape instanceof Shape ? shape.style.borders : shape.value;
            const borders = basicapi.deleteBorders(bordersOld, index, strength);
            if (borders && borders.length) {
                for (let i = 0; i < borders.length; i++) {
                    const border = borders[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
                }
            }
        })

    }
    setFillColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        if (!fills[idx]) return;

        this.__trap(() => {
            const fill: Fill = fills[idx];
            const save = fill.color;
            basicapi.setFillColor(fill, color);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, FILLS_ATTR_ID.color, exportColor(color), exportColor(save)));
        })

    }
    setFillEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const fills = shape instanceof Shape ? shape.style.fills : shape.value;
        if (!fills[idx]) return;

        this.__trap(() => {
            const fill: Fill = fills[idx];
            const save = fill.isEnabled;
            basicapi.setFillEnable(fill, isEnable);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, FILLS_ATTR_ID.enable, isEnable, save));
        })

    }
    setBorderColor(page: Page, shape: Shape | Variable, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.__trap(() => {
            const border = borders[idx];
            const save = border.color;
            basicapi.setBorderColor(border, color);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.color, exportColor(color), exportColor(save)));
        })

    }
    setBorderEnable(page: Page, shape: Shape | Variable, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.__trap(() => {
            const border = borders[idx];
            const save = border.isEnabled;
            basicapi.setBorderEnable(border, isEnable);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.enable, isEnable, save));
        })

    }
    setBorderThickness(page: Page, shape: Shape | Variable, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.__trap(() => {
            const border = borders[idx];
            const save = border.thickness;
            basicapi.setBorderThickness(border, thickness);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.thickness, thickness, save));
        })

    }
    setBorderPosition(page: Page, shape: Shape | Variable, idx: number, position: BorderPosition) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.__trap(() => {
            const border = borders[idx];
            const save = border.position;
            basicapi.setBorderPosition(border, position);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.position, exportBorderPosition(position), exportBorderPosition(save)));
        })

    }
    setBorderStyle(page: Page, shape: Shape | Variable, idx: number, borderStyle: BorderStyle) {
        checkShapeAtPage(page, shape);
        const borders = shape instanceof Shape ? shape.style.borders : shape.value;
        if (!borders[idx]) return;
        this.__trap(() => {
            const border = borders[idx];
            const save = border.borderStyle;
            basicapi.setBorderStyle(border, borderStyle);
            this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.borderStyle, exportBorderStyle(borderStyle), exportBorderStyle(save)));
        })

    }
    moveFill(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            const fill = fills.splice(idx, 1)[0];
            if (fill) {
                fills.splice(idx2, 0, fill);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, genShapeId(shape), FILLS_ID, idx, idx2))
            }
        })
    }
    moveBorder(page: Page, shape: Shape | Variable, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;

            const border = borders.splice(idx, 1)[0];
            if (border) {
                borders.splice(idx2, 0, border);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, genShapeId(shape), BORDER_ID, idx, idx2))
            }
        })
    }
    // points
    addPointAt(page: Page, shape: PathShape, idx: number, point: CurvePoint) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addPointAt(shape, point, idx)
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), POINTS_ID, point.id, idx, exportCurvePoint(point)))
        })
    }
    deletePoints(page: Page, shape: PathShape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const points = basicapi.deletePoints(shape, index, strength);
            if (points && points.length) {
                for (let i = 0; i < points.length; i++) {
                    const point = points[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), POINTS_ID, point.id, index, exportCurvePoint(point)));
                }
            }
        })
    }
    addPoints(page: Page, shape: PathShape, points: CurvePoint[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < points.length; i++) {
                const point = points[i];
                basicapi.addPointAt(shape, point, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), POINTS_ID, point.id, i, exportCurvePoint(point)));
            }
        })
    }
    // contacts
    addContactAt(page: Page, shape: Shape, contactRole: ContactRole, idx: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addContactShape(shape.style, contactRole);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), CONTACTS_ID, contactRole.id, idx, exportContactRole(contactRole)))
        })
    }
    removeContactRoleAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        if (!shape.style.contacts || !shape.style.contacts[index]) return;
        this.__trap(() => {
            const contactRole = basicapi.removeContactRoleAt(shape.style, index);
            if (contactRole) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), CONTACTS_ID, contactRole.id, index, exportContactRole(contactRole)));
        })
    }
    // text
    insertSimpleText(page: Page, shape: TextShapeLike | Variable, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            basicapi.insertSimpleText(_text, text, idx, { attr })
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "simple", text, attr, length: text.length }))
        })
    }
    insertComplexText(page: Page, shape: TextShapeLike | Variable, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            basicapi.insertComplexText(_text, text, idx)
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "complex", text: exportText(text), length: text.length }))
        })
    }
    deleteText(page: Page, shape: TextShapeLike | Variable, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        let del: Text | undefined;
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            del = basicapi.deleteText(_text, idx, len)
            if (del && del.length > 0) this.addCmd(TextCmdRemove.Make(page.id, genShapeId(shape), idx, del.length, { type: "complex", text: exportText(del), length: del.length }))
        })
        return del;
    }
    textModifyColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyColor(_text, idx, len, color);
            ret.forEach((m) => {
                const colorEqual = m.color === color || m.color && color && color.equals(m.color);
                if (!colorEqual) {
                    const cmd = TextCmdModify.Make(page.id,
                        genShapeId(shape),
                        idx,
                        m.length,
                        TEXT_ATTR_ID.color,
                        color ? exportColor(color) : undefined,
                        m.color ? exportColor(m.color) : undefined);
                    this.addCmd(cmd);
                }
                idx += m.length;
            })
        })
    }
    textModifyFontName(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyFontName(_text, idx, len, fontname);
            ret.forEach((m) => {
                if (fontname !== m.fontName) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontName, fontname, m.fontName));
                idx += m.length;
            })
        })
    }
    textModifyFontSize(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyFontSize(_text, idx, len, fontsize);
            ret.forEach((m) => {
                if (fontsize !== m.fontSize) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontSize, fontsize, m.fontSize));
                idx += m.length;
            })
        })
    }

    shapeModifyTextBehaviour(page: Page, _text: Text, textBehaviour: TextBehaviour) {
        checkShapeAtPage(page, _text.parent as Shape);
        this.__trap(() => {
            // const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.shapeModifyTextBehaviour(page, _text, textBehaviour);
            if (ret !== textBehaviour) {
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(_text.parent as Shape), SHAPE_ATTR_ID.textBehaviour, textBehaviour, ret));
            }
        })
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShapeLike | Variable, verAlign: TextVerAlign) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.shapeModifyTextVerAlign(_text, verAlign);
            if (ret !== verAlign) {
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.textVerAlign, verAlign, ret));
            }
        })
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike | Variable, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyHighlightColor(_text, idx, len, color);
            ret.forEach((m) => {
                const colorEqual = m.highlight === color || m.highlight && color && color.equals(m.highlight);
                if (!colorEqual) {
                    const cmd = TextCmdModify.Make(page.id,
                        genShapeId(shape),
                        idx,
                        m.length,
                        TEXT_ATTR_ID.highlightColor,
                        color ? exportColor(color) : undefined,
                        m.highlight ? exportColor(m.highlight) : undefined);
                    this.addCmd(cmd);
                }
                idx += m.length;
            })
        });
    }
    textModifyUnderline(page: Page, shape: TextShapeLike | Variable, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyUnderline(_text, underline, index, len);
            ret.forEach((m) => {
                if (underline !== m.underline) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.underline, underline, m.underline));
                index += m.length;
            })
        });
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike | Variable, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyStrikethrough(_text, strikethrough, index, len);
            ret.forEach((m) => {
                if (strikethrough !== m.strikethrough) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.strikethrough, strikethrough, m.strikethrough));
                index += m.length;
            })
        });
    }
    textModifyBold(page: Page, shape: TextShapeLike | Variable, bold: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyBold(_text, bold, index, len);
            ret.forEach((m) => {
                if (bold !== m.bold) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.bold, bold, m.bold));
                index += m.length;
            })
        });
    }
    textModifyItalic(page: Page, shape: TextShapeLike | Variable, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifyItalic(_text, italic, index, len);
            ret.forEach((m) => {
                if (italic !== m.italic) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.italic, italic, m.italic));
                index += m.length;
            })
        });
    }

    private _textModifyRemoveBulletNumbers(page: Page, shape: TextShapeLike | Variable, index: number, len: number) {
        const removeIndexs: number[] = [];
        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        _travelTextPara(_text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
            index -= _index;
            if (para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
                removeIndexs.push(index - _index);
            }
            index += para.length;
        })

        for (let i = 0, len = removeIndexs.length; i < len; i++) {
            const del = basicapi.deleteText(shape.text, removeIndexs[i] - i, 1);
            if (del && del.length > 0) this.addCmd(TextCmdRemove.Make(page.id, genShapeId(shape), removeIndexs[i] - i, del.length, { type: "complex", text: exportText(del), length: del.length }))
        }
        if (removeIndexs.length > 0) shape.text.reLayout();
    }

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType, index: number, len: number) {

        const _text = shape instanceof Shape ? shape.text : shape.value;
        if (!_text || !(_text instanceof Text)) throw Error();
        const modifyeds = _text.setBulletNumbersType(type, index, len);
        modifyeds.forEach((m) => {
            this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersType, type, m.origin));
        })

        const insertIndexs: number[] = [];
        _travelTextPara(_text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
            index -= _index;
            if (para.text[0] === '*' && para.spans[0].bulletNumbers && para.spans[0].length === 1) {
                //
            }
            else {
                // insert with format
                insertIndexs.push(index - _index);
            }
            index += para.length;
        });

        for (let i = 0, len = insertIndexs.length; i < len; i++) {
            const attr = new SpanAttrSetter();
            attr.placeholder = true;
            attr.bulletNumbers = new BulletNumbers(type);
            basicapi.insertSimpleText(_text, '*', insertIndexs[i] + i, { attr });
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), insertIndexs[i] + i, 1, { type: "simple", text: '*', attr, length: 1 }))
        }
        if (insertIndexs.length > 0) _text.reLayout();
    }

    textModifyBulletNumbers(page: Page, shape: TextShapeLike | Variable, type: BulletNumbersType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            if (type === undefined || type === BulletNumbersType.None) {
                this._textModifyRemoveBulletNumbers(page, shape, index, len);
            }
            else {
                this._textModifySetBulletNumbers(page, shape, type, index, len);
            }
        });
    }

    textModifyBulletNumbersStart(page: Page, shape: TextShapeLike | Variable, start: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const modifyeds = _text.setBulletNumbersStart(start, index, len);
            modifyeds.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersStart, start, m.origin));
            })
        });
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike | Variable, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
            const modifyeds = _text.setBulletNumbersBehavior(behavior, index, len);
            modifyeds.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersBehavior, behavior, m.origin));
            })
        });
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike | Variable, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            // fix index
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyHorAlign(_text, horAlign, index, len);
            ret.forEach((m) => {
                if (horAlign !== m.alignment) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textHorAlign, horAlign, m.alignment));
                index += m.length;
            })
        })
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike | Variable, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // fix index
            // const alignRange = shape.text.alignParaRange(index, len);
            // index = alignRange.index;
            // len = alignRange.len;
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = _text.setParaIndent(indent, index, len);
            ret.forEach((m) => {
                if (indent !== m.origin) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.len, TEXT_ATTR_ID.indent, indent, m.origin));
                index += m.len;
            })
        })
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike | Variable, minLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMinLineHeight(shape.text, minLineheight, index, len);
            ret.forEach((m) => {
                if (minLineheight !== m.minimumLineHeight) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMinLineheight, minLineheight, m.minimumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike | Variable, maxLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMaxLineHeight(shape.text, maxLineheight, index, len);
            ret.forEach((m) => {
                if (maxLineheight !== m.maximumLineHeight) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMaxLineheight, maxLineheight, m.maximumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyKerning(page: Page, shape: TextShapeLike | Variable, kerning: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // const alignRange = shape.text.alignParaRange(index, len);
            // index = alignRange.index;
            // len = alignRange.len;

            // const ret1 = basicapi.textModifyParaKerning(shape, kerning, index, len);
            // ret1.forEach((m) => {
            //     this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.paraKerning, kerning, m.kerning));
            //     index += m.length;
            // })

            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();
            const ret = basicapi.textModifySpanKerning(_text, kerning, index, len);
            ret.forEach((m) => {
                if (m.kerning !== kerning) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanKerning, kerning, m.kerning));
                index += m.length;
            })
        })
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike | Variable, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();

            const alignRange = _text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyParaSpacing(_text, paraSpacing, index, len);
            ret.forEach((m) => {
                if (paraSpacing !== m.paraSpacing) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.paraSpacing, paraSpacing, m.paraSpacing));
                index += m.length;
            })
        })
    }
    textModifyTransform(page: Page, shape: TextShapeLike | Variable, transform: TextTransformType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const _text = shape instanceof Shape ? shape.text : shape.value;
            if (!_text || !(_text instanceof Text)) throw Error();

            if (transform === TextTransformType.UppercaseFirst) {
                const alignRange = _text.alignParaRange(index, len);
                index = alignRange.index;
                len = alignRange.len;
            }
            const ret1 = basicapi.textModifySpanTransfrom(_text, transform, index, len);
            ret1.forEach((m) => {
                if (m.transform !== transform) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanTransform, transform, m.transform));
                index += m.length;
            })
        })
    }

    // table
    tableSetCellContentType(page: Page, table: TableShape, rowIdx: number, colIdx: number, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.cellType;
            basicapi.tableSetCellContentType(cell, contentType);
            this.addCmd(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentType, contentType, origin))
        })
    }

    tableSetCellContentText(page: Page, table: TableShape, rowIdx: number, colIdx: number, text: Text | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.text && exportText(cell.text);
            if (origin !== text) { // undefined
                basicapi.tableSetCellContentText(cell, text);
                this.addCmd(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentText, text && exportText(text), origin))
            }
        })
    }

    tableSetCellContentImage(page: Page, table: TableShape, rowIdx: number, colIdx: number, ref: string | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = cell.imageRef;
            if (origin !== ref) {
                basicapi.tableSetCellContentImage(cell, ref);
                this.addCmd(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellContentImage, ref, origin))
            }
        })
    }

    tableModifyColWidth(page: Page, table: TableShape, idx: number, width: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.colWidths[idx];
            basicapi.tableModifyColWidth(page, table, idx, width);
            this.addCmd(TableCmdModify.Make(page.id, table.id, idx, TableOpTarget.Col, TABLE_ATTR_ID.colWidth, width, origin));
        })
    }

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.rowHeights[idx];
            basicapi.tableModifyRowHeight(page, table, idx, height);
            this.addCmd(TableCmdModify.Make(page.id, table.id, idx, TableOpTarget.Row, TABLE_ATTR_ID.rowHeight, height, origin));
        })
    }

    tableInsertRow(page: Page, table: TableShape, idx: number, height: number, data: TableCell[]) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            basicapi.tableInsertRow(page, table, idx, height, data);
            const cells = data.map((cell) => exportTableCell(cell));
            this.addCmd(TableCmdInsert.Make(page.id, table.id, idx, TableOpTarget.Row, cells, height));
        })
    }

    tableRemoveRow(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.rowHeights[idx];
            const del = basicapi.tableRemoveRow(page, table, idx);
            const cells = del.map((cell) => cell && ((cell.cellType ?? TableCellType.None) !== TableCellType.None) && exportTableCell(cell));
            this.addCmd(TableCmdRemove.Make(page.id, table.id, idx, TableOpTarget.Row, cells, origin));
        })
    }

    tableInsertCol(page: Page, table: TableShape, idx: number, width: number, data: TableCell[]) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            basicapi.tableInsertCol(page, table, idx, width, data);
            const cells = data.map((cell) => exportTableCell(cell));
            this.addCmd(TableCmdInsert.Make(page.id, table.id, idx, TableOpTarget.Col, cells, width));
        })
    }

    tableRemoveCol(page: Page, table: TableShape, idx: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.colWidths[idx];
            const del = basicapi.tableRemoveCol(page, table, idx);
            const cells = del.map((cell) => cell && ((cell.cellType ?? TableCellType.None) !== TableCellType.None) && exportTableCell(cell));
            this.addCmd(TableCmdRemove.Make(page.id, table.id, idx, TableOpTarget.Col, cells, origin));
        })
    }

    tableModifyCellSpan(page: Page, table: TableShape, rowIdx: number, colIdx: number, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const cell = table.getCellAt(rowIdx, colIdx, true)!;
            const origin = { rowSpan: cell?.rowSpan, colSpan: cell?.colSpan };
            if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
                basicapi.tableModifyCellSpan(cell, rowSpan, colSpan);
                this.addCmd(ShapeCmdModify.Make(page.id, [table.id, new TableIndex(rowIdx, colIdx)], SHAPE_ATTR_ID.cellSpan, { rowSpan, colSpan }, origin))
            }
        })
    }

    // text
    tableModifyTextColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.color ? exportColor(table.textAttr?.color) : undefined;
            basicapi.tableModifyTextColor(table, color);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextColor, color ? exportColor(color) : undefined, origin));
        })
    }
    tableModifyTextHighlightColor(page: Page, table: TableShape, color: Color | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.highlight ? exportColor(table.textAttr?.highlight) : undefined;
            basicapi.tableModifyTextHighlightColor(table, color);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextHighlight, color ? exportColor(color) : undefined, origin));
        })
    }
    tableModifyTextFontName(page: Page, table: TableShape, fontName: string) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.fontName;
            basicapi.tableModifyTextFontName(table, fontName);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextFontName, fontName, origin));
        })
    }
    tableModifyTextFontSize(page: Page, table: TableShape, fontSize: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.fontSize;
            basicapi.tableModifyTextFontSize(table, fontSize);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextFontSize, fontSize, origin));
        })
    }
    tableModifyTextVerAlign(page: Page, table: TableShape, verAlign: TextVerAlign) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.verAlign;
            basicapi.tableModifyTextVerAlign(table, verAlign);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextVerAlign, verAlign, origin));
        })
    }
    tableModifyTextHorAlign(page: Page, table: TableShape, horAlign: TextHorAlign) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.alignment;
            basicapi.tableModifyTextHorAlign(table, horAlign);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextHorAlign, horAlign, origin));
        })
    }
    tableModifyTextMinLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.minimumLineHeight;
            basicapi.tableModifyTextMinLineHeight(table, lineHeight);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextMinLineHeight, lineHeight, origin));
        })
    }
    tableModifyTextMaxLineHeight(page: Page, table: TableShape, lineHeight: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.maximumLineHeight;
            basicapi.tableModifyTextMaxLineHeight(table, lineHeight);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextMaxLineHeight, lineHeight, origin));
        })
    }
    tableModifyTextKerning(page: Page, table: TableShape, kerning: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.kerning;
            basicapi.tableModifyTextKerning(table, kerning);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextKerning, kerning, origin));
        })
    }
    tableModifyTextParaSpacing(page: Page, table: TableShape, paraSpacing: number) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.paraSpacing;
            basicapi.tableModifyTextParaSpacing(table, paraSpacing);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextParaSpacing, paraSpacing, origin));
        })
    }
    tableModifyTextUnderline(page: Page, table: TableShape, underline: UnderlineType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.underline;
            basicapi.tableModifyTextUnderline(table, underline);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextUnderline, underline, origin));
        })
    }
    tableModifyTextStrikethrough(page: Page, table: TableShape, strikethrough: StrikethroughType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.strikethrough;
            basicapi.tableModifyTextStrikethrough(table, strikethrough);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextStrikethrough, strikethrough, origin));
        })
    }
    tableModifyTextBold(page: Page, table: TableShape, bold: boolean) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.bold;
            basicapi.tableModifyTextBold(table, bold);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextBold, bold, origin));
        })
    }
    tableModifyTextItalic(page: Page, table: TableShape, italic: boolean) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.italic;
            basicapi.tableModifyTextItalic(table, italic);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextItalic, italic, origin));
        })
    }
    tableModifyTextTransform(page: Page, table: TableShape, transform: TextTransformType | undefined) {
        checkShapeAtPage(page, table);
        this.__trap(() => {
            const origin = table.textAttr?.transform;
            basicapi.tableModifyTextTransform(table, transform);
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(table), SHAPE_ATTR_ID.tableTextTransform, transform, origin));
        })
    }
}