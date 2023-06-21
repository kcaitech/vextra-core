import * as chai from 'chai'
import { BasicArray } from '../data/basic';
import * as api from "./basicapi"

const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Document } from "../data/document";
import { Repository } from '../data/transact';
import { newArtboard, newPage, newRectShape } from "./creator";
import { v4 as uuid } from "uuid";
import { PageEditor } from './page';
import { PageListItem, ShapeFrame } from '../data/baseclasses';
import { GroupShape, Shape } from '../data/shape';
import { ShapeCmdGroup } from '../coop/data/shapecmd';
import { exportArtboard, exportPage, exportRectShape } from '../io/baseexport';
import { CMDExecuter } from './command/executer';
import { Cmd } from '../coop/data/classes';
import { CoopRepository } from './command/cooprepo';
import { Page } from 'data/page';
import { updateShapesFrame } from './command/utils';

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


    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = ShapeCmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
        if (needUpdateFrame.length > 0) {
            const page = needUpdateFrame[0].page;
            const shapes = needUpdateFrame.map((v) => v.shape);
            updateShapesFrame(page, shapes, api)
        }
        repo.commit();
    }

    const cooprepo = new CoopRepository(document, repo)
    const editor = new PageEditor(cooprepo, page, document)
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => {
        _cmd = cmd;
    })
    chai.assert.isNotNull(_cmd) // _cmd === undefined | object

    const ret = editor.group([page.childs[1], page.childs[2]], "group")
    chai.assert.isObject(ret)

    const origin = JSON.stringify(exportPage(page))

    repo.undo();

    const executer = new CMDExecuter(document, repo);
    executer.exec(_cmd!);

    const now = JSON.stringify(exportPage(page))

    chai.assert.equal(origin, now)
})
test("ungroup", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = ShapeCmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
        if (needUpdateFrame.length > 0) {
            const page = needUpdateFrame[0].page;
            const shapes = needUpdateFrame.map((v) => v.shape);
            updateShapesFrame(page, shapes, api)
        }
        repo.commit();
        chai.assert.isTrue(page.childs.length === 4);
    }
    const cooprepo = new CoopRepository(document, repo)
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });


    const editor = new PageEditor(cooprepo, page, document)

    // [r1，r2，r3，r4]=> G1
    const group = editor.group([...page.childs], "group")
    // is group.type === Group?
    chai.assert.isObject(group)
    // dose group have four children?
    chai.assert.isTrue((group as GroupShape).childs.length === 4);
    // // G1 => [r1, r2, r3, r4]
    const shapes = editor.ungroup(group as GroupShape);
    // is shapes === [r1, r2, r3, r4]?
    chai.assert.isTrue((shapes as Shape[]).length === 4);
    // dose page have four children?
    chai.assert.isTrue(page.childs.length === 4);

    chai.assert.isObject(_cmd)
    const origin = JSON.stringify(exportPage(page))
    repo.undo();
    executer.exec(_cmd!);
    const now = JSON.stringify(exportPage(page))

    chai.assert.equal(origin, now)
})
test("delete", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = ShapeCmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
        if (needUpdateFrame.length > 0) {
            const page = needUpdateFrame[0].page;
            const shapes = needUpdateFrame.map((v) => v.shape);
            updateShapesFrame(page, shapes, api)
        }
        repo.commit();
        chai.assert.isTrue(page.childs.length === 4);
    }
    const cooprepo = new CoopRepository(document, repo)
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });

    const editor = new PageEditor(cooprepo, page, document)

    const idx = Math.floor(Math.random() * page.childs.length);
    const any_shape = page.childs[idx]
    const ret = editor.delete(any_shape);
    chai.assert.isBoolean(ret);

    chai.assert.isObject(_cmd)
    const origin = JSON.stringify(exportPage(page))
    repo.undo();
    executer.exec(_cmd!);
    const now = JSON.stringify(exportPage(page))

    chai.assert.equal(origin, now)
})
test("delete_batch", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);
    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = ShapeCmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
        if (needUpdateFrame.length > 0) {
            const page = needUpdateFrame[0].page;
            const shapes = needUpdateFrame.map((v) => v.shape);
            updateShapesFrame(page, shapes, api)
        }
        repo.commit();
        chai.assert.isTrue(page.childs.length === 4);
    }
    const cooprepo = new CoopRepository(document, repo)
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });

    const editor = new PageEditor(cooprepo, page, document)
    const shapes: Shape[] = [page.childs[1], page.childs[3]];
    const ret = editor.delete_batch(shapes);
    chai.assert.isBoolean(ret);
    chai.assert.isTrue(page.childs.length === (4 - shapes.length));

    chai.assert.isObject(_cmd)
    const origin = JSON.stringify(exportPage(page))
    repo.undo();
    executer.exec(_cmd!);
    const now = JSON.stringify(exportPage(page))
    chai.assert.equal(origin, now)
})
test("insert", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    const cooprepo = new CoopRepository(document, repo)
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });

    const editor = new PageEditor(cooprepo, page, document)
    const shape = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
    editor.insert(page, 0, shape);
    chai.assert.isTrue(page.childs.length === 1);

    chai.assert.isObject(_cmd)
    const origin = JSON.stringify(exportPage(page))
    repo.undo();
    executer.exec(_cmd!);
    const now = JSON.stringify(exportPage(page))
    chai.assert.equal(origin, now)
})
test("setName", () => {
    const repo = new Repository()
    const page = newPage("Page1");
    const pageList = new BasicArray<PageListItem>();
    const pitem = new PageListItem(page.id, page.name);
    pageList.push(pitem);
    const document = new Document(uuid(), "", "Blank", pageList, repo);
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    const cooprepo = new CoopRepository(document, repo)
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });

    const editor = new PageEditor(cooprepo, page, document);
    const new_name = "-page-";
    editor.setName(new_name);
    pagesMgr.get(page.id).then(p => {
        if (p) {
            console.log('name', p.name);
            chai.assert.isTrue(p.name === new_name);
        }
    })
    // chai.assert.isObject(_cmd)
    // const origin = JSON.stringify(exportPage(page))
    // repo.undo();
    // executer.exec(_cmd!);
    // const now = JSON.stringify(exportPage(page))
    // chai.assert.equal(origin, now)
})