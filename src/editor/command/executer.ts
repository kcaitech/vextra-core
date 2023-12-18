import {
    PageCmdDelete,
    PageCmdInsert,
    PageCmdModify,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdMove,
    TextCmdModify,
    TextCmdRemove,
    TextCmdInsert,
    ShapeArrayAttrInsert,
    ShapeArrayAttrRemove,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    PageCmdMove,
    ShapeOpMove,
    IdOpSet,
    ShapeOpRemove,
    TableCmdInsert,
    TableCmdRemove,
    TableOpInsert,
    TableCmdModify,
    TableOpRemove,
    TableOpModify
} from "../../coop/data/classes";
import { Document } from "../../data/document";
import {
    IImportContext,
    importPage,
    importFill,
    importBorder,
    importColor,
    importBorderPosition,
    importBorderStyle,
    importText,
    importSpanAttr,
    importPoint2D,
    importTableCell,
    importContactRole,
    importCurvePoint,
    importVariable,
    importShadow,
    importShadowPosition,
    importCurveMode,
    importCutoutShape,
    importExportFormat,
    importExportFileFormat,
    importExportFormatNameingScheme
} from "../../data/baseimport";
import * as types from "../../data/typesdefine"
import {
    GroupShape,
    Page,
    Shape,
    Color,
    PathShape,
    TextHorAlign,
    UnderlineType,
    StrikethroughType,
    BulletNumbersType,
    TextTransformType,
    BulletNumbersBehavior,
    Text,
    TableShape,
    Variable,
    Fill,
    Border,
    ExportFormat,
    Shadow,
    TextShape,
    CurveMode
} from "../../data/classes";

import * as api from "../basicapi"
import { BORDER_ATTR_ID, BORDER_ID, CONTACTS_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, TEXT_ATTR_ID, TABLE_ATTR_ID, SHADOW_ID, SHAPE_ATTR_ID, SHADOW_ATTR_ID, CUTOUT_ID, CUTOUT_ATTR_ID, } from "./consts";
import { Repository } from "../../data/transact";
import { Cmd, CmdType, OpType } from "../../coop/data/classes";
import { ArrayOpRemove, TableOpTarget, ArrayOpAttr, ArrayOpInsert, ShapeOpInsert } from "../../coop/data/classes";
import { importShape, updateShapesFrame } from "./utils";
import { CmdGroup } from "../../coop/data/cmdgroup";
import { CMDHandler } from "./handler";
import { shapeModifyCurveMode } from "../basicapi";

export class CMDExecuter {
    private __document: Document;
    private __repo: Repository;
    private __handler: CMDHandler;

    constructor(document: Document, repo: Repository) {
        this.__document = document;
        this.__repo = repo;
        this.__handler = new CMDHandler();
    }

    exec(cmd: Cmd): boolean {
        this.__repo.start("", {});
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            const needUpdateFrame: { shape: Shape, page: Page }[] = [];
            this._exec(cmd, needUpdateFrame);
            if (needUpdateFrame.length > 0) {
                const page = needUpdateFrame[0].page;
                const shapes = needUpdateFrame.map((v) => v.shape);
                updateShapesFrame(page, shapes, api)
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.error("exec error:", e)
            console.error("error cmd:", cmd)
            this.__repo.rollback();
            return false;
        } finally {
            this.__repo.transactCtx.settrap = save;
        }
    }

    private _exec(cmd: Cmd, needUpdateFrame: { shape: Shape, page: Page }[]) {
        switch (cmd.type) {
            case CmdType.PageInsert:
                this.pageInsert(cmd as PageCmdInsert);
                break;
            case CmdType.PageDelete:
                this.pageDelete(cmd as PageCmdDelete);
                break;
            case CmdType.PageModify:
                this.pageModify(cmd as PageCmdModify);
                break;
            case CmdType.PageMove:
                this.pageMove(cmd as PageCmdMove);
                break;
            case CmdType.ShapeArrayAttrInsert:
                this.shapeArrAttrInsert(cmd as ShapeArrayAttrInsert);
                break;
            case CmdType.ShapeArrayAttrModify:
                this.shapeArrAttrModify(cmd as ShapeArrayAttrModify);
                break;
            case CmdType.ShapeArrayAttrMove:
                this.shapeArrAttrMove(cmd as ShapeArrayAttrMove);
                break;
            case CmdType.ShapeArrayAttrDelete:
                this.shapeArrAttrDelete(cmd as ShapeArrayAttrRemove);
                break;
            case CmdType.TextDelete:
                this.textDelete(cmd as TextCmdRemove);
                break;
            case CmdType.TextInsert:
                this.textInsert(cmd as TextCmdInsert);
                break;
            case CmdType.TextModify:
                this.textModify(cmd as TextCmdModify);
                break;
            case CmdType.ShapeDelete:
                this.shapeDelete(cmd as ShapeCmdRemove, needUpdateFrame);
                break;
            case CmdType.ShapeInsert:
                this.shapeInsert(cmd as ShapeCmdInsert, needUpdateFrame);
                break;
            case CmdType.ShapeModify:
                // this.shapeModify(cmd as ShapeCmdModify, needUpdateFrame);
                this.__handler.handle(this.__document, cmd, needUpdateFrame);
                break;
            case CmdType.ShapeMove:
                this.shapeMove(cmd as ShapeCmdMove, needUpdateFrame);
                break;
            case CmdType.Group:
                this.cmdGroup(cmd as CmdGroup, needUpdateFrame);
                break;
            case CmdType.TableInsert:
                this.tableInsert(cmd as TableCmdInsert);
                break;
            case CmdType.TableDelete:
                this.tableDelete(cmd as TableCmdRemove);
                break;
            case CmdType.TableModify:
                this.tableModify(cmd as TableCmdModify);
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    cmdGroup(cmdGroup: CmdGroup, needUpdateFrame: { shape: Shape, page: Page }[]) {
        cmdGroup.cmds.forEach((cmd) => {
            this._exec(cmd, needUpdateFrame);
        })
    }

    pageInsert(cmd: PageCmdInsert) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeInsert) {
            const _op = op as ShapeOpInsert;
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, _op.index)
        }
    }

    pageDelete(cmd: PageCmdDelete) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeRemove) { // oss需要保存历史版本以undo
            const _op = op as ShapeOpRemove;
            const page = this.__document.pagesList[_op.index];
            if (!page) throw new Error(`page not find: (index)${_op.index} (cmdPageId)${_op.shapeId}`);
            if (page.id !== _op.shapeId) throw new Error(`page id not equals: (cmdPageId)${_op.shapeId} (localPageId)${page.id}`);
            api.pageDelete(this.__document, _op.index);
        }
    }

    pageModify(cmd: PageCmdModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const op = cmd.ops[0];
        if (op.type === OpType.IdSet) {// 以pagelist为准
            const pageId = op.targetId[0] as string;
            const opId = (op as IdOpSet).opId;
            if (opId === PAGE_ATTR_ID.name) {
                if (cmd.value) api.pageModifyName(this.__document, pageId, cmd.value);
            } else if (opId === PAGE_ATTR_ID.previewUnfold) {
                const page = this.__document.pagesMgr.getSync(pageId)
                if (!page) throw new Error(`page not find: (index)${opId} (cmdPageId)${op.targetId[0]}`);
                const options = page.exportOptions!
                const unfold = cmd.value && JSON.parse(cmd.value) || false;
                api.setPageExportPreviewUnfold(options, JSON.parse(unfold));
            }
        }
    }

    pageMove(cmd: PageCmdMove) {
        const op = cmd.ops[0] as ShapeOpMove;
        if (op && op.type === OpType.ShapeMove) {
            const _op = op as ShapeOpMove;
            const page = this.__document.pagesList[_op.index];
            if (!page) throw new Error(`page not find: (index)${_op.index} (cmdPageId)${_op.shapeId}`);
            if (page.id !== _op.shapeId) throw new Error(`page id not equals: (cmdPageId)${_op.shapeId} (localPageId)${page.id}`);
            api.pageMove(this.__document, op.index, op.index2);
        }
    }

    shapeInsert(cmd: ShapeCmdInsert, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = cmd.ops[0];
        if (page && op.type === OpType.ShapeInsert) { // 后续page加载后需要更新！
            const parent = page.getTarget(op.targetId);
            if (!parent || !(parent instanceof GroupShape)) {
                throw new Error("shape insert, parent error")
            }
            const _op = op as ShapeOpInsert;
            const shape = importShape(cmd.data, this.__document)
            api.shapeInsert(page, parent, shape, _op.index, needUpdateFrame)
        }
    }

    shapeDelete(cmd: ShapeCmdRemove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const parentId = op.targetId;
        const page = this.__document.pagesMgr.getSync(pageId);
        if (!page) return;
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getTarget(parentId) as GroupShape;
            if (!parent) throw new Error(`parent not find: ${parentId}`);
            const _op = op as ShapeOpRemove;
            const shape = parent.childs[_op.index];
            if (!shape) throw new Error(`shape not find: (index)${_op.index} (cmdShapeId)${_op.shapeId}`);
            if (shape.id !== _op.shapeId) throw new Error(`shape id not equals: (cmdShapeId)${_op.shapeId} (localPageId)${shape.id}`);
            api.shapeDelete(page, parent as GroupShape, _op.index, needUpdateFrame);
        }
    }

    shapeMove(cmd: ShapeCmdMove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (!page) return;
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeMove) {
            const _op = op as ShapeOpMove;
            const parentId = _op.targetId;
            const parentId2 = _op.targetId2;
            const parent = page.getTarget(parentId) as GroupShape;
            if (!parent) throw new Error(`parent not find: ${parentId}`);
            const parent2 = page.getTarget(parentId2);
            if (!parent2) throw new Error(`parent2 not find: ${parentId2}`);
            const shape = parent.childs[_op.index];
            if (!shape) throw new Error(`shape not find: (index)${_op.index} (cmdShapeId)${_op.shapeId}`);
            if (shape.id !== _op.shapeId) throw new Error(`shape id not equals: (cmdShapeId)${_op.shapeId} (localShapeId)${shape.id}`);
            api.shapeMove(page, parent as GroupShape, _op.index, parent2 as GroupShape, _op.index2, needUpdateFrame)
        }
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        if (op.type !== OpType.ArrayInsert) return;
        const shapeId = op.targetId;
        const shape = (shapeId[0] === page.id) ? page : page.getTarget(shapeId);
        if (!shape) {
            console.log("shape not find", shapeId)
            return;
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fill = importFill(JSON.parse(cmd.data))
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            api.addFillAt(fills, fill, (op as ArrayOpInsert).start);
        } else if (arrayAttr === BORDER_ID) {
            const border = importBorder(JSON.parse(cmd.data))
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            api.addBorderAt(borders, border, (op as ArrayOpInsert).start);
        } else if (arrayAttr === SHADOW_ID) {
            const shadow = importShadow(JSON.parse(cmd.data))
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            api.addShadow(shadows, shadow, (op as ArrayOpInsert).start);
        }
        else if (arrayAttr === CONTACTS_ID) {
            if (!(shape instanceof Shape)) throw new Error('shape is not a shape');
            const contact_role = importContactRole(JSON.parse(cmd.data));
            api.addContactShape(shape.style, contact_role);
        } else if (arrayAttr === POINTS_ID) {
            const point = importCurvePoint(JSON.parse(cmd.data));
            api.addPointAt(shape as PathShape, point, (op as ArrayOpInsert).start);
        } else if (arrayAttr === CUTOUT_ID) {
            const format = importExportFormat(JSON.parse(cmd.data));
            api.addExportFormat(shape as Shape, format, (op as ArrayOpInsert).start);
        } else {
            console.error("not implemented ", arrayAttr)
        }
    }

    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        if (op.type !== OpType.ArrayRemove) return;
        const shape = (op.targetId[0] === page.id) ? page : page.getTarget(op.targetId);
        if (!shape) {
            console.log("shape not find", op.targetId)
            return;
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            api.deleteFillAt(fills, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === BORDER_ID) {
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            api.deleteBorderAt(borders, (op as ArrayOpRemove).start)
        } else if (arrayAttr === SHADOW_ID) {
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            api.deleteShadowAt(shadows, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === CONTACTS_ID) {
            if (!(shape instanceof Shape)) throw new Error('shape is not a shape');
            api.removeContactRoleAt(shape.style, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === POINTS_ID) {
            api.deletePointAt(shape as PathShape, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === CUTOUT_ID) {
            if (op.type === OpType.ArrayRemove) {
                if (!(shape instanceof Shape)) throw new Error('shape is not a shape');
                if (!shape.exportOptions) return;
                api.deleteExportFormatAt(shape.exportOptions, (op as ArrayOpRemove).start)
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }

    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.IdSet) {
            return;
        }
        const shape = (_op.targetId[0] === page.id) ? page : page.getTarget(_op.targetId);
        // if (!(shape instanceof Shape)) {
        //     throw new Error();
        // }
        if (!shape) {
            console.log("shape not find", _op.targetId)
            return;
        }

        const op = _op as IdOpSet;
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fillId = cmd.arrayAttrId;
            // find fill
            const fills = shape instanceof Shape ? shape.style.fills : shape.value;
            const fillIdx = fills.findIndex((fill: Fill) => fill.id === fillId);
            if (fillIdx < 0) return;
            const fill = fills[fillIdx];
            const opId = op.opId;
            const value = cmd.value;
            if (opId === FILLS_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value));
                    api.setFillColor(fill, color);
                }
            } else if (opId === FILLS_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setFillEnable(fill, enable ?? false)
            }
            else {
                console.error("not implemented ", op)
            }
        } else if (arrayAttr === BORDER_ID) {
            const borderId = cmd.arrayAttrId;
            // find fill
            const borders = shape instanceof Shape ? shape.style.borders : shape.value;
            const borderIdx = borders.findIndex((border: Border) => border.id === borderId)
            if (borderIdx < 0) return;
            const border = borders[borderIdx];
            const opId = op.opId;
            const value = cmd.value;
            if (opId === BORDER_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value))
                    api.setBorderColor(border, color);
                }
            } else if (opId === BORDER_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setBorderEnable(border, enable ?? false)
            }
            else if (opId === BORDER_ATTR_ID.thickness) {
                const thickness = value && JSON.parse(value);
                api.setBorderThickness(border, thickness ?? 0)
            }
            else if (opId === BORDER_ATTR_ID.position) {
                if (value) {
                    const position = importBorderPosition(value as any);
                    api.setBorderPosition(border, position)
                }
            } else if (opId === BORDER_ATTR_ID.borderStyle) {
                if (value) {
                    const style = importBorderStyle(JSON.parse(value));
                    api.setBorderStyle(border, style)
                }
            }
            // todo
            else {
                console.error("not implemented ", op)
            }
        } else if (arrayAttr === POINTS_ID) {
            if (!(shape instanceof PathShape)) return;
            const pointId = cmd.arrayAttrId;
            // find point
            const pointIdx = shape.points.findIndex((p) => p.id === pointId)
            if (pointIdx < 0) return;

            const opId = op.opId;
            const value = cmd.value;

            if (opId === POINTS_ATTR_ID.point) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvPoint(page, shape, pointIdx, p);
                }
            } else if (opId === POINTS_ATTR_ID.from) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvFromPoint(page, shape, pointIdx, p);
                }
            } else if (opId === POINTS_ATTR_ID.to) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvToPoint(page, shape, pointIdx, p);
                }
            }
            else if (opId === POINTS_ATTR_ID.curveMode) {
                if (value) {
                    api.shapeModifyCurveMode(page, shape, pointIdx, value as CurveMode);
                }
            } else if (opId === POINTS_ATTR_ID.hasFrom) {
                const v = value ? JSON.parse(value) : value;
                api.shapeModifyHasFrom(page, shape, pointIdx, v);
            }
            else if (opId === POINTS_ATTR_ID.hasTo) {
                const v = value ? JSON.parse(value) : value;
                api.shapeModifyHasTo(page, shape, pointIdx, v);
            }
            else if (opId === POINTS_ATTR_ID.cornerRadius) {
                if (value) {
                    api.shapeModifyPointCornerRadius(page, shape, pointIdx, Number(value));
                }
            }
            else {
                console.error("not implemented ", op)
            }
        } else if (arrayAttr === SHADOW_ID) {
            const shadowId = cmd.arrayAttrId;
            const shadows = shape instanceof Shape ? shape.style.shadows : shape.value;
            const shadowIdx = shadows.findIndex((shadow: Shadow) => shadow.id === shadowId);
            if (shadowIdx < 0) return;
            const opId = op.opId;
            const value = cmd.value;
            if (opId === SHADOW_ATTR_ID.position) {
                if (value) {
                    const position = importShadowPosition(value as any);
                    api.setShadowPosition(shadows, shadowIdx, position);
                }
            } else if (opId === SHADOW_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setShadowEnable(shadows, shadowIdx, enable ?? false);
            } else if (opId === SHADOW_ATTR_ID.offsetX) {
                const offsetX = value && JSON.parse(value);
                api.setShadowOffsetX(shadows, shadowIdx, offsetX ?? 0);
            } else if (opId === SHADOW_ATTR_ID.offsetY) {
                const offsetY = value && JSON.parse(value);
                api.setShadowOffsetY(shadows, shadowIdx, offsetY ?? 0);
            } else if (opId === SHADOW_ATTR_ID.blurRadius) {
                const blurRadius = value && JSON.parse(value);
                api.setShadowBlur(shadows, shadowIdx, blurRadius ?? 0);
            } else if (opId === SHADOW_ATTR_ID.spread) {
                const spread = value && JSON.parse(value);
                api.setShadowSpread(shadows, shadowIdx, spread ?? 0);
            } else if (opId === SHADOW_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value))
                    api.setShadowColor(shadows, shadowIdx, color);
                }
            } else {
                console.error("not implemented ", op)
            }
        } else if (arrayAttr === CUTOUT_ID) {
            const cutoutId = cmd.arrayAttrId;
            if (!(shape instanceof Shape)) throw new Error("shape is not Shape");
            if (!shape.exportOptions) return;
            const formatIdx = shape.exportOptions.exportFormats.findIndex((format: ExportFormat) => format.id === cutoutId);
            if (formatIdx < 0) return;
            const opId = op.opId;
            const value = cmd.value;
            if (opId === CUTOUT_ATTR_ID.scale) {
                const scale = value && JSON.parse(value);
                api.setExportFormatScale(shape.exportOptions, formatIdx, scale ?? 1);
            } else if (opId === CUTOUT_ATTR_ID.name) {
                api.setExportFormatName(shape.exportOptions, formatIdx, value ?? '');
            } else if (opId === CUTOUT_ATTR_ID.fileFormat) {
                if (value) {
                    const fileFormat = importExportFileFormat(value as any)
                    api.setExportFormatFileFormat(shape.exportOptions, formatIdx, fileFormat);
                }
            } else if (opId === CUTOUT_ATTR_ID.perfix) {
                if (value) {
                    const perfix = importExportFormatNameingScheme(value as any)
                    api.setExportFormatPerfix(shape.exportOptions, formatIdx, perfix);
                }
            } else {
                console.error("not implemented ", op)
            }
        } else {
            console.error("not implemented ", arrayAttr)
        }
    }

    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op0 = cmd.ops[0]
        const op1 = cmd.ops[1]
        const shape = (op0.targetId[0] === page.id) ? page : page.getTarget(op0.targetId);
        if (!shape) {
            console.log("shape not find", op0.targetId)
            return;
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                const op0 = cmd.ops[0] as ArrayOpRemove
                const op1 = cmd.ops[1] as ArrayOpInsert
                const fills = shape instanceof Shape ? shape.style.fills : shape.value;
                api.moveFill(fills, op0.start, op1.start)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                const op0 = cmd.ops[0] as ArrayOpRemove
                const op1 = cmd.ops[1] as ArrayOpInsert
                const borders = shape instanceof Shape ? shape.style.borders : shape.value;
                api.moveBorder(borders, op0.start, op1.start)
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }

    tableInsert(cmd: TableCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpInsert
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableInsert) {
            return;
        }
        const _this = this;
        const ctx = new class implements IImportContext {
            document: Document = _this.__document
        }
        if (op.opTarget === TableOpTarget.Row) {
            const data = op.data.map((cell) => cell ? importTableCell(cell, ctx) : undefined);
            const height = JSON.parse(cmd.data);
            api.tableInsertRow(page, shape as TableShape, op.index, height, data);
        } else if (op.opTarget === TableOpTarget.Col) {
            const data = op.data.map((cell) => cell ? importTableCell(cell, ctx) : undefined);
            const width = JSON.parse(cmd.data);
            api.tableInsertCol(page, shape as TableShape, op.index, width, data);
        } else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }

    tableDelete(cmd: TableCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpRemove
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableRemove) {
            return;
        }
        if (op.opTarget === TableOpTarget.Row) {
            api.tableRemoveRow(page, shape as TableShape, op.index);
        } else if (op.opTarget === TableOpTarget.Col) {
            api.tableRemoveCol(page, shape as TableShape, op.index);
        } else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }

    tableModify(cmd: TableCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpModify;
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableModify) {
            return;
        }
        const value = cmd.value;
        const opId = op.opId;
        if (op.opTarget === TableOpTarget.Row) {
            if (opId === TABLE_ATTR_ID.rowHeight) {
                if (value) api.tableModifyRowHeight(page, shape as TableShape, op.index, JSON.parse(value));
            }
        } else if (op.opTarget === TableOpTarget.Col) {
            if (opId === TABLE_ATTR_ID.colWidth) {
                if (value) api.tableModifyColWidth(page, shape as TableShape, op.index, JSON.parse(value));
            }
        } else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }

    textInsert(cmd: TextCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayInsert) return;
        const shape = page.getTarget(_op.targetId) as TextShape | Variable;

        const op = _op as ArrayOpInsert;
        const text = cmd.parseText();
        const shapetext = (shape instanceof Shape) ? shape.text : shape?.value;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong, has no text: " + shapetext)
        }
        if (text.type === "simple") {
            let attr;
            if (text.attr) attr = importSpanAttr(text.attr);
            api.insertSimpleText(shapetext, text.text as string, op.start, { attr })
        } else if (text.type === "complex") {
            const _text = importText(text.text as types.Text);
            api.insertComplexText(shapetext, _text, op.start)
        } else {
            throw new Error("unknow text insert type: " + cmd.text)
        }
    }

    textDelete(cmd: TextCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayRemove) return;
        const shape = page.getTarget(_op.targetId) as TextShape | Variable;

        const op = _op as ArrayOpRemove;
        const shapetext = (shape instanceof Shape) ? shape.text : shape?.value;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong")
        }
        api.deleteText(shapetext, op.start, op.length);
    }

    textModify(cmd: TextCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayAttr) {
            return;
        }
        const shape = page.getTarget(_op.targetId) as TextShape | Variable;

        const op = _op as ArrayOpAttr;
        const attrId = cmd.attrId
        const value = cmd.value;
        const shapetext = (shape instanceof Shape) ? shape.text : shape?.value;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong")
        }
        if (attrId === TEXT_ATTR_ID.color) {
            const color = (value && importColor(JSON.parse(value))) as Color | undefined;
            api.textModifyColor(shapetext, op.start, op.length, color)
        } else if (attrId === TEXT_ATTR_ID.fontName) {
            api.textModifyFontName(shapetext, op.start, op.length, value)
        } else if (attrId === TEXT_ATTR_ID.fontSize) {
            const fontSize = value && JSON.parse(value);
            api.textModifyFontSize(shapetext, op.start, op.length, fontSize)
        } else if (attrId === TEXT_ATTR_ID.spanKerning) {
            const kerning = value && JSON.parse(value);
            api.textModifySpanKerning(shapetext, kerning, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.paraKerning) {
            const kerning = value && JSON.parse(value);
            api.textModifyParaKerning(shapetext, kerning, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.textHorAlign) {
            const textHorAlign = value as TextHorAlign;
            api.textModifyHorAlign(shapetext, textHorAlign, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.textMaxLineheight) {
            const maxLineHeight = value && JSON.parse(value);
            api.textModifyMaxLineHeight(shapetext, maxLineHeight, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.textMinLineheight) {
            const minLineHeight = value && JSON.parse(value);
            api.textModifyMinLineHeight(shapetext, minLineHeight, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.paraSpacing) {
            const paraSpacing = value && JSON.parse(value);
            api.textModifyParaSpacing(shapetext, paraSpacing, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.bold) {
            const bold = value && JSON.parse(value);
            api.textModifyBold(shapetext, bold, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.italic) {
            const italic = value && JSON.parse(value);
            api.textModifyItalic(shapetext, italic, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.underline) {
            api.textModifyUnderline(shapetext, value as UnderlineType, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.strikethrough) {
            api.textModifyStrikethrough(shapetext, value as StrikethroughType, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.bulletNumbersType) {
            api.textModifyBulletNumbersType(shapetext, value as BulletNumbersType, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.bulletNumbersStart) {
            const start = value && JSON.parse(value) || 0;
            api.textModifyBulletNumbersStart(shapetext, start, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.bulletNumbersBehavior) {
            const inherit = value as BulletNumbersBehavior;
            api.textModifyBulletNumbersBehavior(shapetext, inherit, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.highlightColor) {
            const color = (value && importColor(JSON.parse(value))) as Color | undefined;
            api.textModifyHighlightColor(shapetext, op.start, op.length, color)
        } else if (attrId === TEXT_ATTR_ID.spanTransform) {
            const transform = value as TextTransformType | undefined;
            api.textModifySpanTransfrom(shapetext, transform, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.paraTransform) {
            const transform = value as TextTransformType | undefined;
            api.textModifyParaTransfrom(shapetext, transform, op.start, op.length)
        } else if (attrId === TEXT_ATTR_ID.indent) {
            const indent = value && JSON.parse(value) || undefined;
            api.textModifyParaIndent(shapetext, indent, op.start, op.length)
        } else {
            console.error("not implemented ", attrId)
        }
    }
}