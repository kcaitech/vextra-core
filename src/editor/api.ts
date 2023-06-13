import { Cmd, PageCmdDelete } from "coop/data/classes";
import * as basicapi from "./basicapi"
import { Repository } from "../data/transact";
import { Page } from "../data/page";
import { Document } from "../data/document";
import { PageCmdInsert } from "coop/data/classes";
import { exportPage } from "io/baseexport";

export class Api {
    private cmds: Cmd[] = [];
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
    pageModifyName() {

    }
    pageMove() {

    }

    shapeInsert() {

    }
    shapeDelete() {

    }
    shapeMove() {

    }
    shapeModifyX() {

    }
    shapeModifyY() {

    }
    shapeModifyWH() {

    }
    shapeModifyRotate() {

    }
    shapeModifyName() {

    }
    shapeModifyHFlip() {

    }
    shapeModifyVFlip() {

    }
    shapeModifyBackgroundColor() {

    }
    addFillAt() {

    }
    addBorderAt() {

    }
    deleteFillAt() {

    }
    deleteBorderAt() {

    }
    setFillColor() {

    }
    setFillEnable() {

    }
    setBorderColor() {

    }
    moveFill() {

    }
    moveBorder() {

    }
    insertText() {

    }
    deleteText() {

    }
    formatText() {

    }
    moveText() {

    }
}