/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


test("group", () => {})
/*
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
import { PageEditor, BatchAction2 } from './page';
import { PageListItem, ShapeFrame } from '../data/baseclasses';
import { GroupShape, Shape } from '../data/shape';
import { exportArtboard, exportPage, exportRectShape } from '../data/baseexport';
import { CMDExecuter } from './command/executer';
import { Cmd, CmdGroup } from '../coop/data/classes';
import { CoopRepository } from './coop/cooprepo';
import { Page } from 'data/page';
import { updateShapesFrame } from './coop/utils';

function createTestDocument() {
    const repo = new Repository()
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");

    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    return document;
}
function get_actions_constrainer_proportions(shapes: Shape[], value: boolean): BatchAction2[] {
    const actions: BatchAction2[] = [];
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        actions.push({ target: shape, value })
    }
    return actions;
}
export function get_actions_rotate(shapes: Shape[], value: number) {
    const actions: BatchAction2[] = [];
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        actions.push({ target: shape, value: value });
    }
    return actions;
}
test("group", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);

    const page = newPage("Page1");

    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);


    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = CmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
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
// test("ungroup", () => {
//     const repo = new Repository()
//     const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
//     const page = newPage("Page1");
//     const pagesMgr = document.pagesMgr;
//     pagesMgr.add(page.id, page);

//     {
//         const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
//         const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
//         const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
//         const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
//         const cmd = CmdGroup.Make(page.id);
//         repo.start("add shape", {});
//         const needUpdateFrame: { shape: Shape, page: Page }[] = [];
//         api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
//         cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
//         api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
//         cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
//         api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
//         cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
//         api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
//         cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
//         if (needUpdateFrame.length > 0) {
//             const page = needUpdateFrame[0].page;
//             const shapes = needUpdateFrame.map((v) => v.shape);
//             updateShapesFrame(page, shapes, api)
//         }
//         repo.commit();
//         chai.assert.isTrue(page.childs.length === 4);
//     }
//     const cooprepo = new CoopRepository(document, repo)
//     const executer = new CMDExecuter(document, repo);
//     let _cmd: Cmd | undefined;
//     cooprepo.onCommit((cmd) => { _cmd = cmd });


//     const editor = new PageEditor(cooprepo, page, document)

//     // [r1，r2，r3，r4]=> G1
//     const group = editor.group([...page.childs], "group")
//     // is group.type === Group?
//     chai.assert.isObject(group)
//     // dose group have four children?
//     chai.assert.isTrue((group as GroupShape).childs.length === 4);
//     // // G1 => [r1, r2, r3, r4]
//     const shapes = editor.ungroup(group as GroupShape);
//     // is shapes === [r1, r2, r3, r4]?
//     chai.assert.isTrue((shapes as Shape[]).length === 4);
//     // dose page have four children?
//     chai.assert.isTrue(page.childs.length === 4);

//     chai.assert.isObject(_cmd)
//     const origin = JSON.stringify(exportPage(page))
//     repo.undo();
//     executer.exec(_cmd!);
//     const now = JSON.stringify(exportPage(page))

//     chai.assert.equal(origin, now)
// })
test("delete", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = CmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
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
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);
    {
        const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
        const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
        const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
        const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
        const cmd = CmdGroup.Make(page.id);
        repo.start("add shape", {});
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
        api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
        api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
        api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
        cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
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
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
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
test("setName", async () => {
    const repo = new Repository();
    const page = newPage("Page1");
    const pageList = new BasicArray<PageListItem>();
    const pitem = new PageListItem(page.id, page.name);
    pageList.push(pitem);
    const document = new Document(uuid(), "", "", "Blank", pageList, repo);
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    const cooprepo = new CoopRepository(document, repo);
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => {
        _cmd = cmd;
    });

    const _p = await pagesMgr.get(page.id);
    chai.assert.isObject(_p);
    const editor = new PageEditor(cooprepo, _p!, document);
    const new_name = "new_name";
    editor.setName(new_name);

    const __p = pageList.find(i => i.id === page.id);
    chai.assert.isObject(__p);
    chai.assert.equal(__p!.name, new_name);
})
test("arrange", () => {
    // translate
})
test("setShapesConstrainerProportions", () => {
    const repo = new Repository()
    const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
    const page = newPage("Page1");
    const pagesMgr = document.pagesMgr;
    pagesMgr.add(page.id, page);

    const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
    const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
    const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
    const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
    const cmd = CmdGroup.Make(page.id);
    repo.start("add shape", {});
    const needUpdateFrame: { shape: Shape, page: Page }[] = [];
    api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
    cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
    api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
    cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
    api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
    cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
    api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
    cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
    if (needUpdateFrame.length > 0) {
        const page = needUpdateFrame[0].page;
        const shapes = needUpdateFrame.map((v) => v.shape);
        updateShapesFrame(page, shapes, api)
    }
    repo.commit();
    //  page
    //      rect4
    //      rect3
    //      rect2
    //      rect1
    chai.assert.isTrue(page.childs.length === 4);
    const cooprepo = new CoopRepository(document, repo);
    const executer = new CMDExecuter(document, repo);
    let _cmd: Cmd | undefined;
    cooprepo.onCommit((cmd) => { _cmd = cmd });
    const editor = new PageEditor(cooprepo, page, document);
    const shapes_action = get_actions_constrainer_proportions([shape1, shape2, shape3], true); // 只锁前三个
    editor.setShapesConstrainerProportions(shapes_action);
    //  page
    //      rect4
    //      rect3 🔒
    //      rect2 🔒
    //      rect1 🔒
    chai.assert.equal(page.childs.map(i => i.constrainerProportions).toString(), 'true,true,true,false');

    chai.assert.isObject(_cmd)
    const origin = JSON.stringify(exportPage(page));
    repo.undo();
    executer.exec(_cmd!);
    const now = JSON.stringify(exportPage(page))
    chai.assert.equal(origin, now);
})
test("setShapesFrame", () => {
    // expand
})
// test("setShapesRotate", () => {
//     const repo = new Repository()
//     const document = new Document(uuid(), "", "", "Blank", new BasicArray(), repo);
//     const page = newPage("Page1");
//     const pagesMgr = document.pagesMgr;
//     pagesMgr.add(page.id, page);

//     const shape1 = newRectShape("rect1", new ShapeFrame(0, 0, 100, 100))
//     const shape2 = newRectShape("rect2", new ShapeFrame(120, 0, 100, 100))
//     const shape3 = newRectShape("rect3", new ShapeFrame(120, 120, 100, 100))
//     const shape4 = newRectShape("rect4", new ShapeFrame(240, 0, 100, 100))
//     const cmd = CmdGroup.Make(page.id);
//     repo.start("add shape", {});
//     const needUpdateFrame: { shape: Shape, page: Page }[] = [];
//     api.shapeInsert(page, page, shape1, 0, needUpdateFrame)
//     cmd.addShapeInsert(page.id, shape1.id, 0, JSON.stringify(exportRectShape(shape1)))
//     api.shapeInsert(page, page, shape2, 1, needUpdateFrame)
//     cmd.addShapeInsert(page.id, shape2.id, 0, JSON.stringify(exportRectShape(shape2)))
//     api.shapeInsert(page, page, shape3, 2, needUpdateFrame)
//     cmd.addShapeInsert(page.id, shape3.id, 0, JSON.stringify(exportRectShape(shape3)))
//     api.shapeInsert(page, page, shape4, 3, needUpdateFrame)
//     cmd.addShapeInsert(page.id, shape4.id, 0, JSON.stringify(exportRectShape(shape4)))
//     if (needUpdateFrame.length > 0) {
//         const page = needUpdateFrame[0].page;
//         const shapes = needUpdateFrame.map((v) => v.shape);
//         updateShapesFrame(page, shapes, api)
//     }
//     repo.commit();
//     //  page
//     //      rect4
//     //      rect3
//     //      rect2
//     //      rect1
//     chai.assert.isTrue(page.childs.length === 4);
//     const cooprepo = new CoopRepository(document, repo);
//     const executer = new CMDExecuter(document, repo);
//     let _cmd: Cmd | undefined;
//     cooprepo.onCommit((cmd) => { _cmd = cmd });
//     const editor = new PageEditor(cooprepo, page, document);
//     const shapes_action = get_actions_rotate([shape1, shape2, shape4], 30); // 只锁前三个
//     editor.setShapesRotate(shapes_action);
//     //  page
//     //      rect4 30°
//     //      rect3 0°
//     //      rect2 30°
//     //      rect1 30°
//     chai.assert.equal(page.childs.map(i => i.rotation).toString(), '30,30,0,30');

//     chai.assert.isObject(_cmd)
//     const origin = JSON.stringify(exportPage(page));
//     repo.undo();
//     executer.exec(_cmd!);
//     const now = JSON.stringify(exportPage(page))
//     chai.assert.equal(origin, now);
// })
*/