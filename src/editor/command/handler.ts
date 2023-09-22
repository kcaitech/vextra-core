import { Cmd, CmdType, OpType, ShapeCmdModify, TableIndex } from "../../coop"
import { Document, GroupShape, Page, RectShape, Shape, Text, TextTransformType, TableShape, TableCell, OverrideShape } from "../../data/classes"
import { SHAPE_ATTR_ID } from "./consts";
import * as api from "../basicapi"
import { importColor, importText } from "../../data/baseimport";
import * as types from "../../data/typesdefine"
import { IdOpSet } from "coop/data/basictypes";

export type TextShapeLike = Shape & { text: Text }
export type UpdateFrameArray = { shape: Shape, page: Page }[];
export type Handler = (...args: any[]) => void;

export class CMDHandler {
    private _handlers: Map<CmdType, Map<string, Handler>> = new Map();
    constructor() {
        this.regist(shape_handler);
        this.regist(table_handler);
        this.regist(text_handler);
    }

    handle(document: Document, cmd: Cmd, needUpdateFrame: UpdateFrameArray) {
        switch (cmd.type) {
            case CmdType.ShapeModify:
                this.handleShapeModify(document, cmd as ShapeCmdModify, needUpdateFrame);
                break;
            default: throw new Error("not handled cmdType " + cmd.type);
        }
    }

    private handleShapeModify(document: Document, cmd: ShapeCmdModify, needUpdateFrame: UpdateFrameArray) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        if ((op.type !== OpType.IdSet)) return;
        const page = document.pagesMgr.getSync(pageId)
        if (!page) return;

        const shape: Shape = page.getTarget(op.targetId)

        const _op = op as IdOpSet;
        const value = cmd.value;
        const handlerMap = this._handlers.get(cmd.type) as Map<string, ShapeModifyHandler>;
        const handler = handlerMap.get(_op.opId);
        if (!handler) throw new Error("unknow opId " + _op.opId);
        handler(cmd, page, shape, value, needUpdateFrame);
    }

    private regist(handlers: (ShapeModifyHandlerArray)[]) {
        handlers.forEach((handlers) => {
            switch (handlers.cmdType) {
                case CmdType.ShapeModify:
                    this.registShapeModify(handlers);
                    break;
                default: throw new Error("not handled cmdType " + handlers.cmdType);
            }
        })
    }
    private registShapeModify(handlers: ShapeModifyHandlerArray) {
        if (handlers.cmdType !== CmdType.ShapeModify) throw new Error("wrong cmd type " + handlers.cmdType);
        let handlerMap = this._handlers.get(handlers.cmdType) as Map<string, ShapeModifyHandler>;
        if (!handlerMap) {
            handlerMap = new Map<string, ShapeModifyHandler>();
            this._handlers.set(handlers.cmdType, handlerMap);
        }
        handlers.handlers.forEach((h) => {
            if (handlerMap.get(h.opId)) throw new Error("multiple registration opid: " + h.opId);
            handlerMap.set(h.opId, h.handler);
        })
    }
}

export type ShapeModifyHandler = (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => void;

export type ShapeModifyHandlerArray = {
    cmdType: CmdType.ShapeModify,
    handlers: {
        opId: string,
        handler: ShapeModifyHandler
    }[]
}

export const table_handler: (ShapeModifyHandlerArray)[] = [
    {
        cmdType: CmdType.ShapeModify,
        handlers: [
            {
                opId: SHAPE_ATTR_ID.cellContentType,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableSetCellContentType(shape as TableCell, value as types.TableCellType);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellContentText,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const text = value ? importText(JSON.parse(value)) : undefined;
                    api.tableSetCellContentText(shape as TableCell, text);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellContentImage,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableSetCellContentImage(shape as TableCell, value);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellSpan,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    const rowSpan = val?.rowSpan;
                    const colSpan = val?.colSpan;
                    api.tableModifyCellSpan(shape as TableCell, rowSpan ?? 1, colSpan ?? 1);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextColor,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const color = value ? importColor(JSON.parse(value)) : undefined;
                    api.tableModifyTextColor(shape as TableShape, color);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextHighlight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const color = value ? importColor(JSON.parse(value)) : undefined;
                    api.tableModifyTextHighlightColor(shape as TableShape, color);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextFontName,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextFontName(shape as TableShape, value);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextFontSize,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const fontSize = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextFontSize(shape as TableShape, fontSize);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextVerAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextVerAlign(shape as TableShape, value as types.TextVerAlign);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextHorAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextHorAlign(shape as TableShape, value as types.TextHorAlign);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextMinLineHeight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const lineHeight = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextMinLineHeight(shape as TableShape, lineHeight);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextMaxLineHeight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const lineHeight = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextMaxLineHeight(shape as TableShape, lineHeight);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextKerning,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const kerning = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextKerning(shape as TableShape, kerning);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextParaSpacing,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const spacing = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextParaSpacing(shape as TableShape, spacing);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextUnderline,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const underline = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextUnderline(shape as TableShape, underline);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextStrikethrough,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const striketrouth = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextStrikethrough(shape as TableShape, striketrouth);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextBold,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const bold = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextBold(shape as TableShape, bold);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextItalic,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const italic = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextItalic(shape as TableShape, italic);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextTransform,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextTransform(shape as TableShape, value as TextTransformType);
                }
            },
        ]
    }
]

export const shape_handler: (ShapeModifyHandlerArray)[] = [
    {
        cmdType: CmdType.ShapeModify,
        handlers: [
            {
                opId: SHAPE_ATTR_ID.x,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const x = JSON.parse(value)
                        api.shapeModifyX(page, shape, x, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.y,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const y = JSON.parse(value)
                        api.shapeModifyY(page, shape, y, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.width,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyWidth(page, shape, wh, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.height,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyHeight(page, shape, wh, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.size,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyWH(page, shape, wh.w, wh.h, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.rotate,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const rotate = JSON.parse(value)
                        api.shapeModifyRotate(page, shape, rotate, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.name,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const name = value;
                        api.shapeModifyName(shape, name)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.hflip,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const hflip = value && JSON.parse(value)
                    api.shapeModifyHFlip(page, shape, hflip, needUpdateFrame)
                }
            },
            {
                opId: SHAPE_ATTR_ID.vflip,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const vflip = value && JSON.parse(value)
                    api.shapeModifyVFlip(page, shape, vflip, needUpdateFrame)
                }
            },
            {
                opId: SHAPE_ATTR_ID.visible,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isVisible = value && JSON.parse(value)
                    api.shapeModifyVisible(shape, isVisible ?? false);
                }
            },
            {
                opId: SHAPE_ATTR_ID.lock,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isLock = value && JSON.parse(value)
                    api.shapeModifyLock(shape, isLock ?? false);
                }
            },
            {
                opId: SHAPE_ATTR_ID.resizingConstraint,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const v = JSON.parse(value);
                        api.shapeModifyResizingConstraint(shape, v)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.radius,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const v = (JSON.parse(value) as { lt: number, rt: number, rb: number, lb: number });
                        api.shapeModifyRadius(shape as RectShape, v.lt, v.rt, v.rb, v.lb)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.constrainerProportions,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isLock = value && JSON.parse(value) || false;
                    api.shapeModifyConstrainerProportions(shape, isLock);
                }
            },
            {
                opId: SHAPE_ATTR_ID.startMarkerType,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        api.shapeModifyStartMarkerType(shape, value as types.MarkerType)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.endMarkerType,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        api.shapeModifyEndMarkerType(shape, value as types.MarkerType)
                    }
                }
            },

            {
                opId: SHAPE_ATTR_ID.boolop,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.shapeModifyBoolOp(shape, value as types.BoolOp);
                }
            },
            {
                opId: SHAPE_ATTR_ID.isboolopshape,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isOpShape = value && JSON.parse(value);
                    api.shapeModifyBoolOpShape(shape as GroupShape, isOpShape);
                }
            },
            // {
            //     opId: SHAPE_ATTR_ID.issymbolshape,
            //     handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
            //         const isSymShape = value && JSON.parse(value);
            //         api.shapeModifySymbolShape(shape as GroupShape, isSymShape);
            //     }
            // },
            {
                opId: SHAPE_ATTR_ID.fixedRadius,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const fixedRadius = value && JSON.parse(value);
                    api.shapeModifyFixedRadius(shape as GroupShape, fixedRadius);
                }
            },
            {
                opId: SHAPE_ATTR_ID.contactFrom,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const from = value && JSON.parse(value);
                    api.shapeModifyContactFrom(shape as GroupShape, from);
                }
            },
            {
                opId: SHAPE_ATTR_ID.contactTo,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const to = value && JSON.parse(value);
                    api.shapeModifyContactTo(shape as GroupShape, to);
                }
            },
            {
                opId: SHAPE_ATTR_ID.isEdited,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const state = value && JSON.parse(value)
                    api.shapeModifyEditedState(shape as GroupShape, state ?? false);
                }
            },
            {
                opId: SHAPE_ATTR_ID.override_borders,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    (shape as OverrideShape).override_borders = val;
                }
            },
            {
                opId: SHAPE_ATTR_ID.override_fills,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    (shape as OverrideShape).override_fills = val;
                }
            },
            {
                opId: SHAPE_ATTR_ID.override_text,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    (shape as OverrideShape).override_text = val;
                }
            },
            {
                opId: SHAPE_ATTR_ID.override_image,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    (shape as OverrideShape).override_image = val;
                }
            },
            {
                opId: SHAPE_ATTR_ID.override_visible,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    (shape as OverrideShape).override_visible = val;
                }
            },
        ]
    }
]

export const text_handler: (ShapeModifyHandlerArray)[] = [
    {
        cmdType: CmdType.ShapeModify,
        handlers: [
            {
                opId: SHAPE_ATTR_ID.textBehaviour,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const textBehaviour = value as types.TextBehaviour
                    api.shapeModifyTextBehaviour(page, shape as TextShapeLike, textBehaviour ?? types.TextBehaviour.Flexible);
                }
            },
            {
                opId: SHAPE_ATTR_ID.textVerAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const textVerAlign = value as types.TextVerAlign
                    const text = (shape as TextShapeLike).text;
                    api.shapeModifyTextVerAlign(text, textVerAlign ?? types.TextVerAlign.Top);
                }
            },
            {
                opId: SHAPE_ATTR_ID.textTransform,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const text = (shape as TextShapeLike).text;
                    api.shapeModifyTextTransform(text, value as TextTransformType);
                }
            },
        ]
    }
]