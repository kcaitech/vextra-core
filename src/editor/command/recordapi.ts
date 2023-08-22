import {
    Cmd, CmdType,
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
import { exportBorder, exportBorderPosition, exportBorderStyle, exportColor, exportFill, exportPage, exportPoint2D, exportShadow, exportTableCell, exportText } from "../../io/baseexport";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, SHAPE_ATTR_ID, TABLE_ATTR_ID, TEXT_ATTR_ID, SHADOW_ID } from "./consts";
import { GroupShape, Shape, PathShape, PathShape2 } from "../../data/shape";
import { exportShape, updateShapesFrame } from "./utils";
import { Border, BorderPosition, BorderStyle, Color, ContextSettings, Fill, MarkerType } from "../../data/style";
import { BulletNumbers, SpanAttr, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import { cmdmerge } from "./merger";
import { RectShape, TableCell, TableCellType, TableShape } from "../../data/classes";
import { CmdGroup } from "../../coop/data/cmdgroup";
import { BlendMode, BoolOp, BulletNumbersBehavior, BulletNumbersType, FillType, Point2D, StrikethroughType, TextTransformType, UnderlineType } from "../../data/typesdefine";
import { _travelTextPara } from "../../data/texttravel";
import { uuid } from "../../basic/uuid";
import { TableOpTarget } from "../../coop/data/classes";

type TextShapeLike = Shape & { text: Text }

function checkShapeAtPage(page: Page, obj: Shape) {
    if (obj instanceof TableCell) {
        const table = obj.parent as TableShape;
        if (!page.getShape(table.id)) throw new Error("shape not inside page")
    }
    if (!page.getShape(obj.id)) throw new Error("shape not inside page")
}

function genShapeId(shape: Shape): Array<string | TableIndex> {
    if (shape instanceof TableCell) {
        const table = shape.parent as TableShape;
        const index = table.indexOfCell(shape);
        if (!index) throw new Error("Cant find cell");
        return [table.id, new TableIndex(index.rowIdx, index.colIdx)]
    }
    return [shape.id]
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
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isVisible;
            shape.isVisible = isVisible;
            this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.visible, isVisible, save));
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
    shapeModifyFixedRadius(page: Page, shape: GroupShape | PathShape | PathShape2, fixedRadius: number | undefined) {
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
    addFillAt(page: Page, shape: Shape, fill: Fill, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addFillAt(shape.style, fill, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)))
        })
    }
    // 添加多次fill
    addFills(page: Page, shape: Shape, fills: Fill[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < fills.length; i++) {
                const fill = fills[i];
                basicapi.addFillAt(shape.style, fill, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, i, exportFill(fill)));
            }
        })
    }
    // 添加一条border
    addBorderAt(page: Page, shape: Shape, border: Border, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addBorderAt(shape.style, border, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    // 添加多条border
    addBorders(page: Page, shape: Shape, borders: Border[]) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < borders.length; i++) {
                const border = borders[i];
                basicapi.addBorderAt(shape.style, border, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), BORDER_ID, border.id, i, exportBorder(border)));
            }
        })
    }
    // 删除一次fill
    deleteFillAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(shape.style, index);
            if (fill) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    // 批量删除fill
    deleteFills(page: Page, shape: Shape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fills = basicapi.deleteFills(shape.style, index, strength);
            if (fills && fills.length) {
                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, index, exportFill(fill)));
                }
            }
        })
    }
    // 删除一次border
    deleteBorderAt(page: Page, shape: Shape, index: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(shape.style, index);
            if (border) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
        })
    }
    // 批量删除border
    deleteBorders(page: Page, shape: Shape, index: number, strength: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = basicapi.deleteBorders(shape.style, index, strength);
            if (borders && borders.length) {
                for (let i = 0; i < borders.length; i++) {
                    const border = borders[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), BORDER_ID, border.id, index, exportBorder(border)));
                }
            }
        })

    }
    setFillColor(page: Page, shape: Shape, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const fill: Fill = shape.style.fills[idx];
        if (fill) {
            this.__trap(() => {
                const save = fill.color;
                fill.color = color
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, FILLS_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    setFillEnable(page: Page, shape: Shape, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const fill: Fill = shape.style.fills[idx];
        if (fill) {
            this.__trap(() => {
                const save = fill.isEnabled;
                fill.isEnabled = isEnable
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), FILLS_ID, fill.id, FILLS_ATTR_ID.enable, isEnable, save));
            })
        }
    }
    setBorderColor(page: Page, shape: Shape, idx: number, color: Color) {
        checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.color;
                border.color = color
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    setBorderEnable(page: Page, shape: Shape, idx: number, isEnable: boolean) {
        checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.isEnabled;
                border.isEnabled = isEnable
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.enable, isEnable, save));
            })
        }
    }
    setBorderThickness(page: Page, shape: Shape, idx: number, thickness: number) {
        checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.thickness;
                border.thickness = thickness
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.thickness, thickness, save));
            })
        }
    }
    setBorderPosition(page: Page, shape: Shape, idx: number, position: BorderPosition) {
        checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.position;
                border.position = position
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.position, exportBorderPosition(position), exportBorderPosition(save)));
            })
        }
    }
    setBorderStyle(page: Page, shape: Shape, idx: number, borderStyle: BorderStyle) {
        checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.borderStyle;
                border.borderStyle = borderStyle
                this.addCmd(ShapeArrayAttrModify.Make(page.id, genShapeId(shape), BORDER_ID, border.id, BORDER_ATTR_ID.borderStyle, exportBorderStyle(borderStyle), exportBorderStyle(save)));
            })
        }
    }
    moveFill(page: Page, shape: Shape, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fill = shape.style.fills.splice(idx, 1)[0];
            if (fill) {
                shape.style.fills.splice(idx2, 0, fill);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, genShapeId(shape), FILLS_ID, idx, idx2))
            }
        })
    }
    moveBorder(page: Page, shape: Shape, idx: number, idx2: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const border = shape.style.borders.splice(idx, 1)[0];
            if (border) {
                shape.style.borders.splice(idx2, 0, border);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, genShapeId(shape), BORDER_ID, idx, idx2))
            }
        })
    }
    addShadow(page: Page, shape: Shape) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const shadow = basicapi.addShadow(shape.style);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, shape.style.shadows.length, exportShadow(shadow)))
        })
    }
    deleteShadowAt(page: Page, shape: Shape, idx: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const shadow = basicapi.deleteShadowAt(shape.style, idx);
            if (shadow) this.addCmd(ShapeArrayAttrRemove.Make(page.id, genShapeId(shape), SHADOW_ID, shadow.id, idx, exportShadow(shadow)));
        })
    }
    insertSimpleText(page: Page, shape: TextShapeLike, idx: number, text: string, attr?: SpanAttr) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.insertSimpleText(shape.text, text, idx, { attr })
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "simple", text, attr, length: text.length }))
        })
    }
    insertComplexText(page: Page, shape: TextShapeLike, idx: number, text: Text) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.insertComplexText(shape.text, text, idx)
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), idx, text.length, { type: "complex", text: exportText(text), length: text.length }))
        })
    }
    deleteText(page: Page, shape: TextShapeLike, idx: number, len: number) {
        checkShapeAtPage(page, shape);
        let del: Text | undefined;
        this.__trap(() => {
            del = basicapi.deleteText(shape.text, idx, len)
            if (del && del.length > 0) this.addCmd(TextCmdRemove.Make(page.id, genShapeId(shape), idx, del.length, { type: "complex", text: exportText(del), length: del.length }))
        })
        return del;
    }
    textModifyColor(page: Page, shape: TextShapeLike, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyColor(shape.text, idx, len, color);
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
    textModifyFontName(page: Page, shape: TextShapeLike, idx: number, len: number, fontname: string) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyFontName(shape.text, idx, len, fontname);
            ret.forEach((m) => {
                if (fontname !== m.fontName) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontName, fontname, m.fontName));
                idx += m.length;
            })
        })
    }
    textModifyFontSize(page: Page, shape: TextShapeLike, idx: number, len: number, fontsize: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyFontSize(shape.text, idx, len, fontsize);
            ret.forEach((m) => {
                if (fontsize !== m.fontSize) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), idx, m.length, TEXT_ATTR_ID.fontSize, fontsize, m.fontSize));
                idx += m.length;
            })
        })
    }

    shapeModifyTextBehaviour(page: Page, shape: TextShapeLike, textBehaviour: TextBehaviour) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextBehaviour(page, shape, textBehaviour);
            if (ret !== textBehaviour) {
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.textBehaviour, textBehaviour, ret));
            }
        })
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShapeLike, verAlign: TextVerAlign) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextVerAlign(shape.text, verAlign);
            if (ret !== verAlign) {
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(shape), SHAPE_ATTR_ID.textVerAlign, verAlign, ret));
            }
        })
    }

    textModifyHighlightColor(page: Page, shape: TextShapeLike, idx: number, len: number, color: Color | undefined) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyHighlightColor(shape.text, idx, len, color);
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
    textModifyUnderline(page: Page, shape: TextShapeLike, underline: UnderlineType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyUnderline(shape.text, underline, index, len);
            ret.forEach((m) => {
                if (underline !== m.underline) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.underline, underline, m.underline));
                index += m.length;
            })
        });
    }
    textModifyStrikethrough(page: Page, shape: TextShapeLike, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyStrikethrough(shape.text, strikethrough, index, len);
            ret.forEach((m) => {
                if (strikethrough !== m.strikethrough) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.strikethrough, strikethrough, m.strikethrough));
                index += m.length;
            })
        });
    }
    textModifyBold(page: Page, shape: TextShapeLike, bold: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyBold(shape.text, bold, index, len);
            ret.forEach((m) => {
                if (bold !== m.bold) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.bold, bold, m.bold));
                index += m.length;
            })
        });
    }
    textModifyItalic(page: Page, shape: TextShapeLike, italic: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyItalic(shape.text, italic, index, len);
            ret.forEach((m) => {
                if (italic !== m.italic) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.italic, italic, m.italic));
                index += m.length;
            })
        });
    }

    private _textModifyRemoveBulletNumbers(page: Page, shape: TextShapeLike, index: number, len: number) {
        const removeIndexs: number[] = [];
        _travelTextPara(shape.text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
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

    private _textModifySetBulletNumbers(page: Page, shape: TextShapeLike, type: BulletNumbersType, index: number, len: number) {

        const modifyeds = shape.text.setBulletNumbersType(type, index, len);
        modifyeds.forEach((m) => {
            this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersType, type, m.origin));
        })

        const insertIndexs: number[] = [];
        _travelTextPara(shape.text.paras, index, len, (paraArray, paraIndex, para, _index, length) => {
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
            basicapi.insertSimpleText(shape.text, '*', insertIndexs[i] + i, { attr });
            this.addCmd(TextCmdInsert.Make(page.id, genShapeId(shape), insertIndexs[i] + i, 1, { type: "simple", text: '*', attr, length: 1 }))
        }
        if (insertIndexs.length > 0) shape.text.reLayout();
    }

    textModifyBulletNumbers(page: Page, shape: TextShapeLike, type: BulletNumbersType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
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

    textModifyBulletNumbersStart(page: Page, shape: TextShapeLike, start: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const modifyeds = shape.text.setBulletNumbersStart(start, index, len);
            modifyeds.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersStart, start, m.origin));
            })
        });
    }
    textModifyBulletNumbersInherit(page: Page, shape: TextShapeLike, inherit: boolean, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const behavior = inherit ? BulletNumbersBehavior.Inherit : BulletNumbersBehavior.Renew;
            const modifyeds = shape.text.setBulletNumbersBehavior(behavior, index, len);
            modifyeds.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), m.index, 1, TEXT_ATTR_ID.bulletNumbersBehavior, behavior, m.origin));
            })
        });
    }

    textModifyHorAlign(page: Page, shape: TextShapeLike, horAlign: TextHorAlign, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // fix index
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyHorAlign(shape.text, horAlign, index, len);
            ret.forEach((m) => {
                if (horAlign !== m.alignment) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textHorAlign, horAlign, m.alignment));
                index += m.length;
            })
        })
    }

    textModifyParaIndent(page: Page, shape: TextShapeLike, indent: number | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            // fix index
            // const alignRange = shape.text.alignParaRange(index, len);
            // index = alignRange.index;
            // len = alignRange.len;

            const ret = shape.text.setParaIndent(indent, index, len);
            ret.forEach((m) => {
                if (indent !== m.origin) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.len, TEXT_ATTR_ID.indent, indent, m.origin));
                index += m.len;
            })
        })
    }
    textModifyMinLineHeight(page: Page, shape: TextShapeLike, minLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMinLineHeight(shape.text, minLineheight, index, len);
            ret.forEach((m) => {
                if (minLineheight !== m.minimumLineHeight) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMinLineheight, minLineheight, m.minimumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyMaxLineHeight(page: Page, shape: TextShapeLike, maxLineheight: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMaxLineHeight(shape.text, maxLineheight, index, len);
            ret.forEach((m) => {
                if (maxLineheight !== m.maximumLineHeight) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.textMaxLineheight, maxLineheight, m.maximumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyKerning(page: Page, shape: TextShapeLike, kerning: number, index: number, len: number) {
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

            const ret = basicapi.textModifySpanKerning(shape.text, kerning, index, len);
            ret.forEach((m) => {
                if (m.kerning !== kerning) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanKerning, kerning, m.kerning));
                index += m.length;
            })
        })
    }
    textModifyParaSpacing(page: Page, shape: TextShapeLike, paraSpacing: number, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyParaSpacing(shape.text, paraSpacing, index, len);
            ret.forEach((m) => {
                if (paraSpacing !== m.paraSpacing) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.paraSpacing, paraSpacing, m.paraSpacing));
                index += m.length;
            })
        })
    }
    textModifyTransform(page: Page, shape: TextShapeLike, transform: TextTransformType | undefined, index: number, len: number) {
        checkShapeAtPage(page, shape);
        this.__trap(() => {
            if (transform === TextTransformType.UppercaseFirst) {
                const alignRange = shape.text.alignParaRange(index, len);
                index = alignRange.index;
                len = alignRange.len;
            }
            const ret1 = basicapi.textModifySpanTransfrom(shape.text, transform, index, len);
            ret1.forEach((m) => {
                if (m.transform !== transform) this.addCmd(TextCmdModify.Make(page.id, genShapeId(shape), index, m.length, TEXT_ATTR_ID.spanTransform, transform, m.transform));
                index += m.length;
            })
        })
    }

    // table
    tableSetCellContentType(page: Page, cell: TableCell, contentType: TableCellType | undefined) {
        checkShapeAtPage(page, cell);
        this.__trap(() => {
            const origin = cell.cellType;
            if (origin !== contentType && (origin ?? TableCellType.None) !== (contentType ?? TableCellType.None)) {
                basicapi.tableSetCellContentType(cell, contentType);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(cell), SHAPE_ATTR_ID.cellContentType, contentType, origin))
            }
        })
    }

    tableSetCellContentText(page: Page, cell: TableCell, text: Text | undefined) {
        checkShapeAtPage(page, cell);
        this.__trap(() => {
            const origin = cell.text && exportText(cell.text);
            if (origin !== text) { // undefined
                basicapi.tableSetCellContentText(cell, text);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(cell), SHAPE_ATTR_ID.cellContentText, text && exportText(text), origin))
            }
        })
    }

    tableSetCellContentImage(page: Page, cell: TableCell, ref: string | undefined) {
        checkShapeAtPage(page, cell);
        this.__trap(() => {
            const origin = cell.imageRef;
            if (origin !== ref) {
                basicapi.tableSetCellContentImage(cell, ref);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(cell), SHAPE_ATTR_ID.cellContentImage, ref, origin))
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

    tableModifyCellSpan(page: Page, cell: TableCell, rowSpan: number, colSpan: number) {
        checkShapeAtPage(page, cell);
        this.__trap(() => {
            const origin = { rowSpan: cell.rowSpan, colSpan: cell.colSpan };
            if ((origin.rowSpan ?? 1) !== rowSpan || (origin.colSpan ?? 1) !== colSpan) {
                basicapi.tableModifyCellSpan(cell, rowSpan, colSpan);
                this.addCmd(ShapeCmdModify.Make(page.id, genShapeId(cell), SHAPE_ATTR_ID.cellSpan, { rowSpan, colSpan }, origin))
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