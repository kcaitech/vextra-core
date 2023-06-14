import { Cmd, PageCmdDelete, PageCmdMove, ShapeArrayAttrMove, ShapeCmdInsert, ShapeCmdRemove, TextCmdInsert, TextCmdRemove } from "coop/data/classes";
import * as basicapi from "./basicapi"
import { Repository } from "../data/transact";
import { Page } from "../data/page";
import { Document } from "../data/document";
import { PageCmdInsert } from "coop/data/classes";
import { exportBorder, exportColor, exportFill, exportPage } from "../io/baseexport";
import { PageCmdModify } from "../coop/data/classes";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, SHAPE_ATTR_ID } from "./consts";
import { GroupShape, Shape, TextShape } from "../data/shape";
import { exportShape } from "./utils";
import { ShapeCmdMove } from "../coop/data/classes";
import { ShapeCmdModify } from "../coop/data/classes";
import { Artboard } from "../data/artboard";
import { Border, Color, Fill, Style } from "../data/style";
import { ShapeArrayAttrInsert } from "../coop/data/classes";
import { ShapeArrayAttrRemove } from "../coop/data/classes";
import { ShapeArrayAttrModify } from "../coop/data/classes";
import { SpanAttr } from "../data/text";

export class Api {
    private cmds: Cmd[] = [];
    private needUpdateFrame: Shape[] = [];
    private repo: Repository;
    constructor(repo: Repository) {
        this.repo = repo;
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
        this.cmds.push(cmd);
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
        this.needUpdateFrame.push(shape);
    }
    shapeDelete(page: Page, parent: GroupShape, index: number) {
        let shape: Shape | undefined;
        this.__trap(() => {
            shape = parent.removeChildAt(index);
            if (shape) {
                page.onRemoveShape(shape);
                if (parent.childs.length > 0) {
                    this.needUpdateFrame.push(parent.childs[0])
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
                this.needUpdateFrame.push(shape)
                if (parent.id !== parent2.id && parent.childs.length > 0) {
                    this.needUpdateFrame.push(parent.childs[0])
                }
                this.addCmd(ShapeCmdMove.Make(page.id, parent.id, shape.id, index, parent2.id, index2));
            }
        });
    }
    shapeModifyX(page: Page, shape: Shape, x: number) {
        const frame = shape.frame;
        if (x !== frame.x) {
            this.__trap(() => {
                const save = frame.x;
                frame.x = x;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.x, x, save))
                this.needUpdateFrame.push(shape);
            })
        }
    }
    shapeModifyY(page: Page, shape: Shape, y: number) {
        const frame = shape.frame;
        if (y !== frame.y) {
            this.__trap(() => {
                const save = frame.y;
                frame.y = y;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.y, y, save))
                this.needUpdateFrame.push(shape);
            })
        }
    }
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        const frame = shape.frame;
        if (w !== frame.width || h !== frame.height) {
            this.__trap(() => {
                const save = { w: frame.width, h: frame.height }
                frame.width = w;
                frame.height = h;
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.size, { w, h }, save))
                this.needUpdateFrame.push(shape);
            })
        }
    }
    shapeModifyRotate(page: Page, shape: Shape, rotate: number) {
        if (rotate !== shape.rotation) {
            this.__trap(() => {
                const save = shape.rotation;
                shape.rotation = rotate;
                this.needUpdateFrame.push(shape);
                this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.rotate, rotate, save))
            })
        }
    }
    shapeModifyName(page: Page, shape: Shape, name: string) {
        this.__trap(() => {
            const save = shape.name;
            shape.name = name;
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.name, name, save));
        })
    }
    shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined) {
        this.__trap(() => {
            const save = shape.isFlippedHorizontal;
            shape.isFlippedHorizontal = hflip;
            this.needUpdateFrame.push(shape);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.hflip, hflip, save));
        })
    }
    shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined) {
        this.__trap(() => {
            const save = shape.isFlippedVertical;
            shape.isFlippedVertical = vflip;
            this.needUpdateFrame.push(shape);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.vflip, vflip, save));
        })
    }
    artboardModifyBackgroundColor(page: Page, shape: Artboard, color: Color) {
        this.__trap(() => {
            const save = shape.backgroundColor;
            shape.setArtboardColor(color);
            this.addCmd(ShapeCmdModify.Make(page.id, shape.id, SHAPE_ATTR_ID.backgroundColor, color, save))
        })
    }
    addFillAt(page: Page, shape: Shape, fill: Fill, index: number) {
        this.__trap(() => {
            basicapi.addFillAt(shape.style, fill, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)))
        })
    }
    addBorderAt(page: Page, shape: Shape, border: Border, index: number) {
        this.__trap(() => {
            basicapi.addBorderAt(shape.style, border, index);
            this.addCmd(ShapeArrayAttrInsert.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)))
        })
    }
    deleteFillAt(page: Page, shape: Shape, index: number) {
        this.__trap(() => {
            const fill = basicapi.deleteFillAt(shape.style, index);
            if (fill) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, FILLS_ID, fill.id, index, exportFill(fill)));
        })
    }
    deleteBorderAt(page: Page, shape: Shape, index: number) {
        this.__trap(() => {
            const border = basicapi.deleteBorderAt(shape.style, index);
            if (border) this.addCmd(ShapeArrayAttrRemove.Make(page.id, shape.id, BORDER_ID, border.id, index, exportBorder(border)));
        })
    }
    setFillColor(page: Page, shape: Shape, idx: number, color: Color) {
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
        const border = shape.style.borders[idx];
        if (border) {
            this.__trap(() => {
                const save = border.color;
                border.color = color
                this.addCmd(ShapeArrayAttrModify.Make(page.id, shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.color, exportColor(color), exportColor(save)));
            })
        }
    }
    moveFill(page: Page, shape: Shape, idx: number, idx2: number) {
        this.__trap(() => {
            const fill = shape.style.fills.splice(idx, 1)[0];
            if (fill) {
                shape.style.fills.splice(idx2, 0, fill);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, shape.id, FILLS_ID, idx, idx2))
            }
        })
    }
    moveBorder(page: Page, shape: Shape, idx: number, idx2: number) {
        this.__trap(() => {
            const border = shape.style.borders.splice(idx, 1)[0];
            if (border) {
                shape.style.borders.splice(idx2, 0, border);
                this.addCmd(ShapeArrayAttrMove.Make(page.id, shape.id, BORDER_ID, idx, idx2))
            }
        })
    }
    insertText(page: Page, shape: TextShape, idx: number, text: string, attr?: SpanAttr) {
        this.__trap(() => {
            basicapi.insertText(shape, text, idx, attr)
            this.addCmd(TextCmdInsert.Make(page.id, shape.id, idx, text))
        })
    }
    deleteText(page: Page, shape: TextShape, idx: number, len: number) {
        this.__trap(() => {
            const del = basicapi.deleteText(shape, idx, len)
            if (del) this.addCmd(TextCmdRemove.Make(page.id, shape.id, idx, del.text.length, del))
        })
    }
    formatText(page: Page, shape: TextShape, idx: number, len: number, attr: SpanAttr) {
        throw new Error("not implemented")
    }
    moveText(page: Page, shape: TextShape, idx: number, len: number, idx2: number) {
        throw new Error("not implemented")
    }
}