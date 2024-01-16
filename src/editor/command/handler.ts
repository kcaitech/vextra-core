import { Cmd, CmdType, OpType, ShapeCmdModify } from "../../coop"
import { Document, GroupShape, Page, RectShape, Shape, Text, TextTransformType, TableShape, TableCell, SymbolRefShape, ContactShape } from "../../data/classes"
import { SHAPE_ATTR_ID } from "./consts";
import * as api from "../basicapi"
import { importColor, importText, importVariable } from "../../data/baseimport";
import * as types from "../../data/typesdefine"
import { PathShape, SymbolShape, Variable } from "../../data/shape";
import { BasicMap } from "../../data/basic";
import { IdOpSet } from "../../coop/data/basictypes";
import { shapeModifyContextSettingOpacity, shapeModifyNameFixed } from "../basicapi";

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
        const shape = (op.targetId[0] === page.id) ? page : page.getOpTarget(op.targetId);
        if (!shape) {
            console.log("shape not find", op.targetId)
            return;
        }

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

export type ShapeModifyHandler = (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => void;

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
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableSetCellContentType(shape as TableCell, value as types.TableCellType);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellContentText,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const text = value ? importText(JSON.parse(value)) : undefined;
                    api.tableSetCellContentText(shape as TableCell, text);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellContentImage,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableSetCellContentImage(shape as TableCell, value);
                }
            },
            {
                opId: SHAPE_ATTR_ID.cellSpan,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const val = value && JSON.parse(value);
                    const rowSpan = val?.rowSpan;
                    const colSpan = val?.colSpan;
                    api.tableModifyCellSpan(shape as TableCell, rowSpan ?? 1, colSpan ?? 1);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextColor,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const color = value ? importColor(JSON.parse(value)) : undefined;
                    api.tableModifyTextColor(shape as TableShape, color);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextHighlight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const color = value ? importColor(JSON.parse(value)) : undefined;
                    api.tableModifyTextHighlightColor(shape as TableShape, color);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextFontName,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextFontName(shape as TableShape, value);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextFontSize,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const fontSize = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextFontSize(shape as TableShape, fontSize);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextVerAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextVerAlign(shape as TableShape, value as types.TextVerAlign);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextHorAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextHorAlign(shape as TableShape, value as types.TextHorAlign);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextMinLineHeight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const lineHeight = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextMinLineHeight(shape as TableShape, lineHeight);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextMaxLineHeight,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const lineHeight = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextMaxLineHeight(shape as TableShape, lineHeight);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextKerning,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const kerning = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextKerning(shape as TableShape, kerning);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextParaSpacing,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const spacing = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextParaSpacing(shape as TableShape, spacing);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextUnderline,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const underline = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextUnderline(shape as TableShape, underline);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextStrikethrough,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const striketrouth = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextStrikethrough(shape as TableShape, striketrouth);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextBold,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const bold = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextBold(shape as TableShape, bold);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextItalic,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const italic = value ? JSON.parse(value) : undefined;
                    api.tableModifyTextItalic(shape as TableShape, italic);
                }
            },
            {
                opId: SHAPE_ATTR_ID.tableTextTransform,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.tableModifyTextTransform(shape as TableShape, value as TextTransformType);
                }
            }
        ]
    }
]

export const shape_handler: (ShapeModifyHandlerArray)[] = [
    {
        cmdType: CmdType.ShapeModify,
        handlers: [
            {
                opId: SHAPE_ATTR_ID.x,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const x = JSON.parse(value)
                        api.shapeModifyX(page, shape as Shape, x, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.y,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const y = JSON.parse(value)
                        api.shapeModifyY(page, shape as Shape, y, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.width,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyWidth(page, shape as Shape, wh, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.height,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyHeight(page, shape as Shape, wh, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.size,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const wh = JSON.parse(value)
                        api.shapeModifyWH(page, shape as Shape, wh.w, wh.h, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.rotate,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const rotate = JSON.parse(value)
                        api.shapeModifyRotate(page, shape as Shape, rotate, needUpdateFrame)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.name,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const name = value;
                        api.shapeModifyName(shape as Shape, name)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.hflip,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const hflip = value && JSON.parse(value)
                    api.shapeModifyHFlip(page, shape as Shape, !!hflip, needUpdateFrame)
                }
            },
            {
                opId: SHAPE_ATTR_ID.vflip,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const vflip = value && JSON.parse(value)
                    api.shapeModifyVFlip(page, shape as Shape, !!vflip, needUpdateFrame)
                }
            },
            {
                opId: SHAPE_ATTR_ID.visible,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isVisible = value && JSON.parse(value)
                    api.shapeModifyVisible(shape, !!isVisible);
                }
            },
            {
                opId: SHAPE_ATTR_ID.lock,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isLock = value && JSON.parse(value)
                    api.shapeModifyLock(shape as Shape, !!isLock);
                }
            },
            {
                opId: SHAPE_ATTR_ID.resizingConstraint,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const v = JSON.parse(value);
                        api.shapeModifyResizingConstraint(shape as Shape, v)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.contextSettingsOpacity,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const v = JSON.parse(value);
                        api.shapeModifyContextSettingOpacity(shape as Shape, v)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.radius,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const v = (JSON.parse(value) as { lt: number, rt: number, rb: number, lb: number });
                        api.shapeModifyRadius(shape as RectShape, v.lt, v.rt, v.rb, v.lb)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.constrainerProportions,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isLock = value && JSON.parse(value) || false;
                    api.shapeModifyConstrainerProportions(shape as Shape, !!isLock);
                }
            },
            {
                opId: SHAPE_ATTR_ID.nameIsFixed,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isFixed = value && JSON.parse(value) || false;
                    api.shapeModifyNameFixed(shape as Shape, !!isFixed);
                }
            },
            {
                opId: SHAPE_ATTR_ID.startMarkerType,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        api.shapeModifyStartMarkerType(shape as Shape, value as types.MarkerType)
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.endMarkerType,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        api.shapeModifyEndMarkerType(shape as Shape, value as types.MarkerType)
                    }
                }
            },

            {
                opId: SHAPE_ATTR_ID.boolop,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    api.shapeModifyBoolOp(shape as Shape, value as types.BoolOp);
                }
            },
            {
                opId: SHAPE_ATTR_ID.isboolopshape,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const isOpShape = value && JSON.parse(value);
                    api.shapeModifyBoolOpShape(shape as GroupShape, !!isOpShape);
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
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const fixedRadius = value && JSON.parse(value);
                    api.shapeModifyFixedRadius(shape as GroupShape, fixedRadius);
                }
            },
            {
                opId: SHAPE_ATTR_ID.contactFrom,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const from = value && JSON.parse(value);
                    api.shapeModifyContactFrom(shape as ContactShape, from);
                }
            },
            {
                opId: SHAPE_ATTR_ID.contactTo,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const to = value && JSON.parse(value);
                    api.shapeModifyContactTo(shape as ContactShape, to);
                }
            },
            {
                opId: SHAPE_ATTR_ID.isEdited,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const state = value && JSON.parse(value)
                    api.shapeModifyEditedState(shape as ContactShape, !!state);
                }
            },
            {
                opId: SHAPE_ATTR_ID.isClosed,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const state = value && JSON.parse(value)
                    api.shapeModifyPathShapeClosedStatus(shape as PathShape, !!state);
                }
            },
            // {
            //     opId: SHAPE_ATTR_ID.addvar,
            //     handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
            //         if (value) {
            //             const _var = importVariable(JSON.parse(value));
            //             // if (!_var.value) {
            //             //     console.log(_var)
            //             //     throw new Error();
            //             // }
            //             shape.addVar(_var);
            //         }
            //     }
            // },
            {
                opId: SHAPE_ATTR_ID.modifyoverride1,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const _shape = shape as SymbolRefShape | SymbolShape;
                        const overrid = JSON.parse(value);
                        if (overrid.value == undefined) {
                            _shape.removeOverrid2(overrid.refId, overrid.attr)
                        }
                        else {
                            _shape.addOverrid2(overrid.refId, overrid.attr, overrid.value);
                        }
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.modifyvar1,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const _shape = shape as SymbolRefShape | SymbolShape;
                        const _var = importVariable(JSON.parse(value));
                        // if (!_var.value) {
                        //     console.log(_var)
                        //     throw new Error();
                        // }
                        if (_var.value == undefined) {
                            _shape.deleteVar(_var.id);
                        }
                        else {
                            _shape.addVar(_var);
                        }
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.modifyvarValue,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const _var = importVariable(JSON.parse(value));
                        if (!(shape instanceof Variable)) throw new Error();
                        api.shapeModifyVariable(page, shape as Variable, _var.value);
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.modifyvarName,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        if (!(shape instanceof Variable)) throw new Error();
                        shape.name = value;
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.symbolref,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        if (!(shape instanceof SymbolRefShape)) throw new Error();
                        shape.refId = value;
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.symtags,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const _shape = shape as SymbolShape;
                        let { varId, tag } = JSON.parse(value);
                        if (tag == undefined) {
                            if (_shape.symtags) _shape.symtags.delete(varId);
                        } else {
                            if (!_shape.symtags) _shape.symtags = new BasicMap();
                            _shape.symtags.set(varId, tag);
                        }
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.bindvar,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        if (!(shape instanceof Shape)) throw new Error("variable can't bind variable");
                        let { type, varId } = JSON.parse(value);
                        if (varId == undefined) {
                            if (shape.varbinds) shape.varbinds.delete(type);
                        }
                        else {
                            if (!shape.varbinds) shape.varbinds = new BasicMap();
                            shape.varbinds.set(type, varId);
                        }
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.overrides,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value) {
                        const _shape = shape as SymbolRefShape;
                        let { type, varId } = JSON.parse(value);
                        if (varId == undefined) {
                            if (_shape.overrides) _shape.overrides.delete(type);
                        }
                        else {
                            if (!_shape.overrides) _shape.overrides = new BasicMap();
                            _shape.overrides.set(type, varId);
                        }
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.trimTransparent,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value && shape instanceof Shape && shape.exportOptions) {
                        const trim = value && JSON.parse(value);
                        api.setExportTrimTransparent(shape.exportOptions, trim);
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.canvasBackground,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value && shape instanceof Shape && shape.exportOptions) {
                        const background = value && JSON.parse(value);
                        api.setExportCanvasBackground(shape.exportOptions, background);
                    }
                }
            },
            {
                opId: SHAPE_ATTR_ID.previewUnfold,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    if (value && shape instanceof Shape && shape.exportOptions) {
                        const unfold = value && JSON.parse(value);
                        api.setExportPreviewUnfold(shape.exportOptions, unfold);
                    }
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
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const textBehaviour = value as types.TextBehaviour
                    const text = (shape instanceof Shape) ? (shape as TextShapeLike).text : shape.value;
                    api.shapeModifyTextBehaviour(page, text, textBehaviour ?? types.TextBehaviour.Flexible);
                }
            },
            {
                opId: SHAPE_ATTR_ID.textVerAlign,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const textVerAlign = value as types.TextVerAlign
                    const text = (shape instanceof Shape) ? (shape as TextShapeLike).text : shape.value;
                    api.shapeModifyTextVerAlign(text, textVerAlign ?? types.TextVerAlign.Top);
                }
            },
            {
                opId: SHAPE_ATTR_ID.textTransform,
                handler: (cmd: ShapeCmdModify, page: Page, shape: Shape | Variable, value: string | undefined, needUpdateFrame: UpdateFrameArray) => {
                    const text = (shape instanceof Shape) ? (shape as TextShapeLike).text : shape.value;
                    api.shapeModifyTextTransform(text, value as TextTransformType);
                }
            },
        ]
    }
]