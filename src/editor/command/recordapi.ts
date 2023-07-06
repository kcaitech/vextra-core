import {
    Cmd, CmdType,
    PageCmdInsert, PageCmdModify, PageCmdMove, PageCmdDelete,
    ShapeArrayAttrMove, ShapeArrayAttrInsert, ShapeArrayAttrRemove, ShapeArrayAttrModify,
    ShapeCmdInsert, ShapeCmdRemove, ShapeCmdMove, ShapeCmdModify,
    TextCmdInsert, TextCmdRemove, TextCmdModify,
} from "../../coop/data/classes";
import * as basicapi from "../basicapi"
import { Repository } from "../../data/transact";
import { Page } from "../../data/page";
import { Document } from "../../data/document";
import { exportBorder, exportBorderPosition, exportBorderStyle, exportColor, exportFill, exportPage, exportPoint2D, exportRectRadius, exportText } from "../../io/baseexport";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, SHAPE_ATTR_ID, TEXT_ATTR_ID } from "./consts";
import { GroupShape, RectRadius, Shape, TextShape, PathShape } from "../../data/shape";
import { exportShape, updateShapesFrame } from "./utils";
import { Artboard } from "../../data/artboard";
import { Border, BorderPosition, BorderStyle, Color, Fill, MarkerType } from "../../data/style";
import { SpanAttr, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "../../data/text";
import { cmdmerge } from "./merger";
import { RectShape } from "../../data/classes";
import { CmdGroup } from "../../coop/data/cmdgroup";
import { Point2D } from "../../data/typesdefine";

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
            switch (c.type) {
                case CmdType.TextDelete:
                case CmdType.TextInsert:
                case CmdType.TextModify:
                case CmdType.TextMove:
                case CmdType.ShapeDelete:
                case CmdType.ShapeInsert:
                case CmdType.ShapeModify:
                case CmdType.ShapeMove:
                case CmdType.ShapeArrayAttrDelete:
                case CmdType.ShapeArrayAttrInsert:
                case CmdType.ShapeArrayAttrModify:
                case CmdType.ShapeArrayAttrMove:
                    group.cmds.push(c as any);
                    break;
                default: throw new Error("unknow group type:" + c.type)
            }
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
    private checkShapeAtPage(page: Page, obj: Shape) {
        if (!page.getShape(obj.id)) throw new Error("shape not inside page")
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
            this.addCmd(PageCmdDelete.Make(document.id, item.id, index))
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
    pageMove(document: Document, pageId: string, fromIdx: number, toIdx: number) {
        this.__trap(() => {
            basicapi.pageMove(document, fromIdx, toIdx);
        })
        this.addCmd(PageCmdMove.Make(document.id, pageId, fromIdx, toIdx))
    }

    shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number) {
        this.__trap(() => {
            parent.addChildAt(shape, index);
            page.onAddShape(shape);
        })
        this.addCmd(ShapeCmdInsert.Make(page.id, parent.id, shape.id, index, exportShape(shape)))
        this.needUpdateFrame.push({ page, shape });
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
        if (shape) this.addCmd(ShapeCmdRemove.Make(page.id, parent.id, shape.id, index));
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
        this.checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (x !== frame.x) {
            this.__trap(() => {
                const save = frame.x;
                frame.x = x;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.x, x, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyY(page: Page, shape: Shape, y: number) {
        this.checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (y !== frame.y) {
            this.__trap(() => {
                const save = frame.y;
                frame.y = y;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.y, y, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        this.checkShapeAtPage(page, shape);
        const frame = shape.frame;
        if (w !== frame.width || h !== frame.height) {
            this.__trap(() => {
                const save = { w: frame.width, h: frame.height }
                // frame.width = w;
                // frame.height = h;
                shape.setFrameSize(w, h);
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.size, { w, h }, save))
                this.needUpdateFrame.push({ page, shape });
            })
        }
    }
    shapeModifyRotate(page: Page, shape: Shape, rotate: number) {
        this.checkShapeAtPage(page, shape);
        if (rotate !== shape.rotation) {
            this.__trap(() => {
                const save = shape.rotation;
                shape.rotation = rotate;
                this.needUpdateFrame.push({ page, shape });
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.rotate, rotate, save))
            })
        }
    }
    shapeModifyConstrainerProportions(page: Page, shape: Shape, prop: boolean) {
        this.checkShapeAtPage(page, shape);
        if (shape.constrainerProportions !== prop) {
            this.__trap(() => {
                const save = shape.constrainerProportions;
                shape.constrainerProportions = prop;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.constrainerProportions, prop, save))
            })
        }
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.name;
            shape.name = name;
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.name, name, save));
        })
    }
    shapeModifyVisible(page: Page, shape: Shape, isVisible: boolean) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isVisible;
            shape.isVisible = isVisible;
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.visible, isVisible, save));
        })
    }
    shapeModifyLock(page: Page, shape: Shape, isLocked: boolean) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isLocked;
            shape.isLocked = isLocked;
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.lock, isLocked, save));
        })
    }
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isFlippedHorizontal;
            shape.isFlippedHorizontal = hflip;
            this.needUpdateFrame.push({ page, shape });
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.hflip, hflip, save));
        })
    }
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.isFlippedVertical;
            shape.isFlippedVertical = vflip;
            this.needUpdateFrame.push({ page, shape });
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.vflip, vflip, save));
        })
    }
    shapeModifyResizingConstraint(page: Page, shape: Shape, resizingConstraint: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.resizingConstraint;
            shape.setResizingConstraint(resizingConstraint);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.resizingConstraint, resizingConstraint, save))
        })
    }
    shapeModifyRadius(page: Page, shape: RectShape, radius: RectRadius) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.fixedRadius;
            shape.fixedRadius = radius;
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.radius, exportRectRadius(radius), exportRectRadius(save)))
        })
    }
    shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.point);
            p.point.x = point.x;
            p.point.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, POINTS_ID, p.id, POINTS_ATTR_ID.point, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.curveFrom);
            p.curveFrom.x = point.x;
            p.curveFrom.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, POINTS_ID, p.id, POINTS_ATTR_ID.from, exportPoint2D(point), origin))
        })
    }
    shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const p = shape.points[index];
            const origin = exportPoint2D(p.curveTo);
            p.curveTo.x = point.x;
            p.curveTo.y = point.y;
            this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, POINTS_ID, p.id, POINTS_ATTR_ID.to, exportPoint2D(point), origin))
        })
    }
    artboardModifyBackgroundColor(page: Page, shape: Artboard, color: Color) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.backgroundColor;
            shape.setArtboardColor(color);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.backgroundColor, exportColor(color), save && exportColor(save)))
        })
    }
    // 添加一次fill
    addFillAt(page: Page, shape: Shape, fill: Fill, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addFillAt(shape.style, fill, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)))
        })
    }
    // 添加多次fill
    addFills(page: Page, shape: Shape, fills: Fill[]) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < fills.length; i++) {
                const fill = fills[i];
                basicapi.addFillAt(shape.style, fill, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, FILLS_ID, fill.id, i, exportFill(fill)));
            }
        })
    }
    // 添加一条border
    addBorderAt(page: Page, shape: Shape, border: Border, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addBorderAt(shape.style, border, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    // 添加多条border
    addBorders(page: Page, shape: Shape, borders: Border[]) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            for (let i = 0; i < borders.length; i++) {
                const border = borders[i];
                basicapi.addBorderAt(shape.style, border, i);
                this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, BORDER_ID, border.id, i, exportBorder(border)));
            }
        })
    }
    // 删除一次fill
    deleteFillAt(page: Page, shape: Shape, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(shape.style, index);
            if (fill) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    // 批量删除fill
    deleteFills(page: Page, shape: Shape, index: number, strength: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fills = basicapi.deleteFills(shape.style, index, strength);
            if (fills && fills.length) {
                for (let i = 0; i < fills.length; i++) {
                    const fill = fills[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)));
                }
            }
        })
    }
    // 删除一次border
    deleteBorderAt(page: Page, shape: Shape, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(shape.style, index);
            if (border) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)));
        })
    }
    // 批量删除border
    deleteBorders(page: Page, shape: Shape, index: number, strength: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const borders = basicapi.deleteBorders(shape.style, index, strength);
            if (borders && borders.length) {
                for (let i = 0; i < borders.length; i++) {
                    const border = borders[i];
                    this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)));
                }
            }
        })

    }
    setFillColor(page: Page, shape: Shape, idx: number, color: Color) {
        this.checkShapeAtPage(page, shape);
        const fill: Fill = shape.style.fills[idx];
        if (fill) {
            this.__trap(() => {
                const save = fill.color;
                fill.color = color
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, FILLS_ID, fill.id, FILLS_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    setFillEnable(page: Page, shape: Shape, idx: number, isEnable: boolean) {
        this.checkShapeAtPage(page, shape);
        const fill: Fill = shape.style.fills[idx];
        if (fill) {
            this.__trap(() => {
                const save = fill.isEnabled;
                fill.isEnabled = isEnable
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, FILLS_ID, fill.id, FILLS_ATTR_ID.enable, isEnable, save));
            })
        }
    }
    setBorderColor(page: Page, shape: Shape, idx: number, color: Color) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.color;
                border.color = color
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    setBorderEnable(page: Page, shape: Shape, idx: number, isEnable: boolean) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.isEnabled;
                border.isEnabled = isEnable
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.enable, isEnable, save));
            })
        }
    }
    setBorderThickness(page: Page, shape: Shape, idx: number, thickness: number) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.thickness;
                border.thickness = thickness
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.thickness, thickness, save));
            })
        }
    }
    setBorderPosition(page: Page, shape: Shape, idx: number, position: BorderPosition) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.position;
                border.position = position
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.position, exportBorderPosition(position), exportBorderPosition(save)));
            })
        }
    }
    setBorderStyle(page: Page, shape: Shape, idx: number, borderStyle: BorderStyle) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.borderStyle;
                border.borderStyle = borderStyle
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.borderStyle, exportBorderStyle(borderStyle), exportBorderStyle(save)));
            })
        }
    }
    setBorderStartMarkerType(page: Page, shape: Shape, idx: number, type: MarkerType) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.startMarkerType;
                border.startMarkerType = type
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.startMarkerType, type, save));
            })
        }
    }
    setBorderEndMarkerType(page: Page, shape: Shape, idx: number, type: MarkerType) {
        this.checkShapeAtPage(page, shape);
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.endMarkerType;
                border.endMarkerType = type
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.endMarkerType, type, save));
            })
        }
    }
    moveFill(page: Page, shape: Shape, idx: number, idx2: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fill = shape.style.fills.splice(idx, 1)[0];
            if (fill) {
                shape.style.fills.splice(idx2, 0, fill);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, shape.id, FILLS_ID, idx, idx2))
            }
        })
    }
    moveBorder(page: Page, shape: Shape, idx: number, idx2: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const border = shape.style.borders.splice(idx, 1)[0];
            if (border) {
                shape.style.borders.splice(idx2, 0, border);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, shape.id, BORDER_ID, idx, idx2))
            }
        })
    }
    insertSimpleText(page: Page, shape: TextShape, idx: number, text: string, attr?: SpanAttr) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.insertSimpleText(shape, text, idx, { attr })
            this.addCmd(TextCmdInsert.Make(page.id, shape.id, idx, text.length, { type: "simple", text, attr, length: text.length }))
        })
    }
    insertComplexText(page: Page, shape: TextShape, idx: number, text: Text) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.insertComplexText(shape, text, idx)
            this.addCmd(TextCmdInsert.Make(page.id, shape.id, idx, text.length, { type: "complex", text, length: text.length }))
        })
    }
    deleteText(page: Page, shape: TextShape, idx: number, len: number) {
        this.checkShapeAtPage(page, shape);
        let del: Text | undefined;
        this.__trap(() => {
            del = basicapi.deleteText(shape, idx, len)
            if (del && del.length > 0) this.addCmd(TextCmdRemove.Make(page.id, shape.id, idx, del.length, { type: "complex", text: exportText(del), length: del.length }))
        })
        return del;
    }
    textModifyColor(page: Page, shape: TextShape, idx: number, len: number, color: Color) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyColor(shape, idx, len, color);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, idx, m.length, TEXT_ATTR_ID.color, color, m.color));
                idx += m.length;
            })
        })
    }
    textModifyFontName(page: Page, shape: TextShape, idx: number, len: number, fontname: string) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyFontName(shape, idx, len, fontname);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, idx, m.length, TEXT_ATTR_ID.fontName, fontname, m.fontName));
                idx += m.length;
            })
        })
    }
    textModifyFontSize(page: Page, shape: TextShape, idx: number, len: number, fontsize: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.textModifyFontSize(shape, idx, len, fontsize);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, idx, m.length, TEXT_ATTR_ID.fontSize, fontsize, m.fontSize));
                idx += m.length;
            })
        })
    }
    moveText(page: Page, shape: TextShape, idx: number, len: number, idx2: number) {
        this.checkShapeAtPage(page, shape);
        throw new Error("not implemented")
    }
    shapeModifyTextBehaviour(page: Page, shape: TextShape, textBehaviour: TextBehaviour) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextBehaviour(page, shape, textBehaviour);
            if (ret !== textBehaviour) {
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.textBehaviour, textBehaviour, ret));
            }
        })
    }
    shapeModifyTextVerAlign(page: Page, shape: TextShape, verAlign: TextVerAlign) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextVerAlign(shape, verAlign);
            if (ret !== verAlign) {
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.textVerAlign, verAlign, ret));
            }
        })
    }
    textModifyHorAlign(page: Page, shape: TextShape, horAlign: TextHorAlign, index: number, len: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            // fix index
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyHorAlign(shape, horAlign, index, len);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, index, m.length, TEXT_ATTR_ID.textHorAlign, horAlign, m.alignment));
                index += m.length;
            })
        })
    }
    shapeModifyTextDefaultHorAlign(page: Page, shape: TextShape, horAlign: TextHorAlign) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextDefaultHorAlign(shape, horAlign);
            if (ret !== horAlign) {
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.defalutTextHorAlign, horAlign, ret));
            }
        })
    }
    textModifyMinLineHeight(page: Page, shape: TextShape, minLineheight: number, index: number, len: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMinLineHeight(shape, minLineheight, index, len);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, index, m.length, TEXT_ATTR_ID.textMinLineheight, minLineheight, m.minimumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyMaxLineHeight(page: Page, shape: TextShape, maxLineheight: number, index: number, len: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyMaxLineHeight(shape, maxLineheight, index, len);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, index, m.length, TEXT_ATTR_ID.textMaxLineheight, maxLineheight, m.maximumLineHeight));
                index += m.length;
            })
        })
    }
    textModifyKerning(page: Page, shape: TextShape, kerning: number, index: number, len: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyKerning(shape, kerning, index, len);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, index, m.length, TEXT_ATTR_ID.kerning, kerning, m.kerning));
                index += m.length;
            })
        })
    }
    textModifyParaSpacing(page: Page, shape: TextShape, paraSpacing: number, index: number, len: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const alignRange = shape.text.alignParaRange(index, len);
            index = alignRange.index;
            len = alignRange.len;

            const ret = basicapi.textModifyParaSpacing(shape, paraSpacing, index, len);
            ret.forEach((m) => {
                this.addCmd(TextCmdModify.Make(page.id, shape.id, index, m.length, TEXT_ATTR_ID.paraSpacing, paraSpacing, m.paraSpacing));
                index += m.length;
            })
        })
    }
    shapeModifyTextDefaultMinLineHeight(page: Page, shape: TextShape, minLineheight: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextDefaultMinLineHeight(shape, minLineheight);
            if (ret !== minLineheight) {
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.defaultTextMinLineheight, minLineheight, ret));
            }
        })
    }
    shapeModifyTextDefaultMaxLineHeight(page: Page, shape: TextShape, maxLineheight: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const ret = basicapi.shapeModifyTextDefaultMaxLineHeight(shape, maxLineheight);
            if (ret !== maxLineheight) {
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.defaultTextMaxLineheight, maxLineheight, ret));
            }
        })
    }
}