import * as chai from 'chai'
import { BasicArray } from '../data/basic';
import * as api from "./api"

const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Document } from "../data/document";
import { Repository } from '../data/transact';
import { newPage, newRectShape } from "./creator";
import { v4 as uuid } from "uuid";
import { PageEditor } from './page';
import { ShapeFrame } from '../data/baseclasses';
import { Shape } from '../data/shape';
import { ShapeCmdGroup } from '../coop/data/shapecmd';
import { exportPage, exportRectShape } from '../io/baseexport';
import { CMDExecuter } from './cmdexecuter';
import { Cmd } from '../coop/data/classes';

function createTestDocument() {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");

    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    return document;
}

test("group", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");

    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
    const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
    const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
    const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))

    {
        const cmd = ShapeCmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: Shape[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
        needUpdateFrame.forEach((shape) => { api.updateFrame(shape) })
        repo.commit(cmd);
    }

    const editor = new PageEditor(repo, page, document)
    let _cmd: Cmd | undefined;
    repo.onCommit((cmd) => {
        _cmd = cmd;
    })
    chai.assert.isNotNull(_cmd)

    const ret = editor.group([shape2, shape3], "group")
    chai.assert.isObject(ret)

    const origin = JSON.stringify(exportPage(page))

    repo.undo();

    const executer = new CMDExecuter(document, repo);
    executer.exec(_cmd!);

    const now = JSON.stringify(exportPage(page))

    chai.assert.equal(origin, now)
})