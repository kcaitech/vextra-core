import { Cmd, CmdType, PageCmdDelete, PageCmdMove, ShapeArrayAttrMove, ShapeCmdGroup, ShapeCmdInsert, ShapeCmdRemove, TextCmdGroup, TextCmdInsert, TextCmdRemove } from "../../coop/data/classes";
import * as basicapi from "../basicapi"
import { Repository } from "../../data/transact";
import { Page } from "../../data/page";
import { Document } from "../../data/document";
import { PageCmdInsert } from "../../coop/data/classes";
import { exportBorder, exportBorderPosition, exportBorderStyle, exportColor, exportFill, exportPage, exportRectRadius } from "../../io/baseexport";
import { PageCmdModify } from "../../coop/data/classes";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, SHAPE_ATTR_ID } from "./consts";
import { GroupShape, RectRadius, Shape, TextShape } from "../../data/shape";
import { exportShape, updateFrame } from "./utils";
import { ShapeCmdMove } from "../../coop/data/classes";
import { ShapeCmdModify } from "../../coop/data/classes";
import { Artboard } from "../../data/artboard";
import { Border, BorderPosition, BorderStyle, Color, Fill, MarkerType } from "../../data/style";
import { ShapeArrayAttrInsert } from "../../coop/data/classes";
import { ShapeArrayAttrRemove } from "../../coop/data/classes";
import { ShapeArrayAttrModify } from "../../coop/data/classes";
import { Span, SpanAttr } from "../../data/text";
import { cmdmerge } from "./merger";
import { RectShape } from "../../data/classes";

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
    commit(): Cmd {
        if (this.needUpdateFrame.length > 0) {
            // todo 需要优化
            const update = this.needUpdateFrame.slice(0);
            update.forEach((item) => updateFrame(item.page, item.shape, this))
        }
        this.needUpdateFrame.length = 0;
        // group cmds
        if (this.cmds.length <= 1) return this.cmds[0];

        // check group type
        const first = this.cmds[0];
        switch (first.type) {
            case CmdType.TextDelete:
            case CmdType.TextInsert:
            case CmdType.TextModify:
            case CmdType.TextMove:
                return this.groupText(first.blockId);
            case CmdType.ShapeDelete:
            case CmdType.ShapeInsert:
            case CmdType.ShapeModify:
            case CmdType.ShapeMove:
                return this.groupShape(first.blockId);
            default:
                throw new Error("unknow cmd group type:" + first.type)
        }
    }
    private groupText(blockId: string): Cmd {
        const group = TextCmdGroup.Make(blockId);
        this.cmds.forEach((c) => {
            if (c.blockId !== blockId) throw new Error("blockid not equal");
            c.unitId = group.unitId;
            switch (c.type) {
                case CmdType.TextDelete:
                case CmdType.TextInsert:
                case CmdType.TextModify:
                case CmdType.TextMove:
                    group.cmds.push(c as any);
                    break;
                default: throw new Error("unknow text group type:" + c.type)
            }
        })
        return group;
    }
    private groupShape(blockId: string): Cmd {
        const group = ShapeCmdGroup.Make(blockId);
        this.cmds.forEach((c) => {
            if (c.blockId !== blockId) throw new Error("blockid not equal");
            c.unitId = group.unitId;
            switch (c.type) {
                case CmdType.ShapeDelete:
                case CmdType.ShapeInsert:
                case CmdType.ShapeModify:
                case CmdType.ShapeMove:
                    group.cmds.push(c as any);
                    break;
                default: throw new Error("unknow shape group type:" + c.type)
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
        if (item) {
            const save = item.name;
            this.__trap(() => {
                item.name = name;
            })
            this.addCmd(PageCmdModify.Make(document.id, item.id, PAGE_ATTR_ID.name, name, save))
        }
    }
    pageMove(document: Document, fromIdx: number, toIdx: number) {
        this.__trap(() => {
            basicapi.pageMove(document, fromIdx, toIdx);
        })
        this.addCmd(PageCmdMove.Make(document.id, fromIdx, toIdx))
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
            const shape = parent.childs.splice(index, 1)[0]
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
                frame.width = w;
                frame.height = h;
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
    artboardModifyBackgroundColor(page: Page, shape: Artboard, color: Color) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const save = shape.backgroundColor;
            shape.setArtboardColor(color);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.backgroundColor, exportColor(color), save && exportColor(save)))
        })
    }
    addFillAt(page: Page, shape: Shape, fill: Fill, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addFillAt(shape.style, fill, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)))
        })
    }
    addBorderAt(page: Page, shape: Shape, border: Border, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.addBorderAt(shape.style, border, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    deleteFillAt(page: Page, shape: Shape, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(shape.style, index);
            if (fill) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    deleteBorderAt(page: Page, shape: Shape, index: number) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(shape.style, index);
            if (border) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)));
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
    insertText(page: Page, shape: TextShape, idx: number, text: string, attr?: SpanAttr) {
        this.checkShapeAtPage(page, shape);
        this.__trap(() => {
            basicapi.insertText(shape, text, idx, attr)
            this.addCmd(TextCmdInsert.Make(page.id, shape.id, idx, text))
        })
    }
    deleteText(page: Page, shape: TextShape, idx: number, len: number) {
        this.checkShapeAtPage(page, shape);
        let del: { text: string, spans: Span[] } | undefined;
        this.__trap(() => {
            del = basicapi.deleteText(shape, idx, len)
            if (del) this.addCmd(TextCmdRemove.Make(page.id, shape.id, idx, del.text.length, del))
        })
        return del;
    }
    formatText(page: Page, shape: TextShape, idx: number, len: number, attr: SpanAttr) {
        this.checkShapeAtPage(page, shape);
        throw new Error("not implemented")
    }
    moveText(page: Page, shape: TextShape, idx: number, len: number, idx2: number) {
        this.checkShapeAtPage(page, shape);
        throw new Error("not implemented")
    }
}