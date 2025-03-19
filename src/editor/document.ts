/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
import { Document } from "../data/document";
import { PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportPage } from "../data/baseexport";
import {
    IImportContext,
    importBlur,
    importBorderMaskType, importFill,
    importPage, importShadow,
    importTextAttr,
    importTextMask,
} from "../data/baseimport";
import { newDocument } from "./creator";
import { CoopRepository } from "../coop/cooprepo";
import { TransactDataGuard } from "../data/transact";
import * as types from "../data/typesdefine";
import { FMT_VER_latest } from "../data/fmtver";
import { FillMask, ShadowMask, StyleMangerMember, BlurMask, BorderMask, RadiusMask, Blur, TextMask } from "../data/style";
import { adapt2Shape, PageView, ShapeView } from "../dataview";
import { Fill, Shadow, BlurType } from "../data/classes";
import { BasicArray, Point2D, ResourceMgr } from "../data";

export function createDocument(documentName: string, repo: TransactDataGuard): Document {
    return newDocument(documentName, repo);
}

export class DocEditor {
    private __repo: CoopRepository;
    private __document: Document;

    constructor(document: Document, repo: CoopRepository) {
        // check
        if (!(repo instanceof CoopRepository)) throw new Error("repo wrong");
        if (!(document instanceof Document)) throw new Error("document wrong");

        this.__repo = repo;
        this.__document = document;
    }

    // 删除页面
    delete(id: string): boolean {
        const pagesmgr = this.__document;
        const index = pagesmgr.indexOfPage(id);
        if (index < 0) return false;
        const api = this.__repo.start('deletepage');
        try {
            api.pageDelete(this.__document, index);

            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    // 插入页面
    insert(index: number, page: Page): boolean {
        const api = this.__repo.start('insertpage');
        try {
            api.pageInsert(this.__document, page, index);
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    // 创建页面
    create(name: string): Page {
        return newPage(name)
    }

    // 新建副本
    copy(page: Page, name: string): Page {
        const np = exportPage(page);
        np.name = name;

        // 拷贝页面的过程，所有图层ID都需要重制，以图层ID作为属性值的属性需要通过原图层ID映射到新的图层ID
        const refs: types.SymbolRefShape[] = []; // 实例图层
        const contacts: types.ContactShape[] = []; // 连接线图层
        const contactApex: types.Shape[] = []; // 被连接线关联的图层
        const prototypeInterAction: types.Shape[] = []
        // todo 其它以图层ID为值的属性

        const idReflex = new Map<string, string>(); // 旧ID -> 新ID
        const idReflexInverse = new Map<string, string>(); // 新ID -> 旧ID

        const replaceId = (shape: types.Shape) => {
            const id = uuid();
            if (shape.typeId === 'symbol-ref-shape') {
                refs.push(shape as types.SymbolRefShape);
            }
            if (shape.typeId === 'contact-shape') {
                contacts.push(shape as types.ContactShape);
            }
            if (shape.style.contacts?.length) {
                contactApex.push(shape);
            }
            if (shape.prototypeInteractions?.length) {
                prototypeInterAction.push(shape)
            }

            idReflex.set(shape.id, id);
            idReflexInverse.set(id, shape.id);
            shape.id = id;

            const g = shape as types.GroupShape;
            if (Array.isArray(g.childs)) {
                g.childs.forEach(c => replaceId(c));
            }
        }
        replaceId(np);

        // 实例图层重新根据id指向组件
        refs.forEach(ref => {
            const refId = ref.refId;
            const newId = idReflex.get(refId);
            if (newId) ref.refId = newId;
        })
        // 连接线根据id重新关联图层
        contacts.forEach(contact => {
            if (contact.from) {
                const newFromId = idReflex.get(contact.from.shapeId);
                if (newFromId) contact.from.shapeId = newFromId;
            }
            if (contact.to) {
                const newToId = idReflex.get(contact.to.shapeId);
                if (newToId) contact.to.shapeId = newToId;
            }
        })
        // 图层根据id重新绑定连接线
        contactApex.forEach(shape => {
            if (shape.style.contacts?.length) {
                shape.style.contacts.forEach(role => {
                    const newRoleId = idReflex.get(role.shapeId);
                    if (newRoleId) role.shapeId = newRoleId;
                })
            }
        })

        //重新绑定原型的targetid
        prototypeInterAction.forEach(shape => {
            if (shape.prototypeInteractions?.length) {
                shape.prototypeInteractions.forEach(action => {
                    if (action.actions.targetNodeID) {
                        const newTargetid = idReflex.get(action.actions.targetNodeID);
                        if (newTargetid) action.actions.targetNodeID = newTargetid;
                    }
                })
            }
        })

        const document = this.__document;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = np.id;
            fmtVer: string = FMT_VER_latest
        };
        return importPage(np, ctx);
    }

    // 移动页面
    move(page: PageListItem, to: number): boolean {
        const api = this.__repo.start('page-move');
        try {
            const idx = this.__document.getPageIndexById(page.id);
            const descend = idx >= to ? to : to + 1;
            if (to !== idx) {
                api.pageMove(this.__document, idx, descend)
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e)
            this.__repo.rollback();
        }
        return true;
    }

    // 页面列表拖拽
    pageListDrag(wandererId: string, hostId: string, offsetOverHalf: boolean) {
        try {
            const pages = this.__document.pagesList;
            const wandererIdx = pages.findIndex(i => i.id === wandererId);
            let hostIdx = pages.findIndex(i => i.id === hostId);
            const api = this.__repo.start('page-move');
            hostIdx = Math.max(0, offsetOverHalf ? hostIdx + 1 : hostIdx);
            api.pageMove(this.__document, wandererIdx, hostIdx);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    // 新增页面
    insertPage(name: string, index: number) {
        const page = newPage(name);
        const result = this.insert(index, page);
        if (result) return page;
    }

    setPageName(name: string, pageId: string) {
        const api = this.__repo.start("setPageName");
        try {
            api.pageModifyName(this.__document, pageId, name);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    rename(name: string) {
        try {
            const api = this.__repo.start('document-rename');
            api.modifyDocumentName(this.__document, name)
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertStyleLib(style: StyleMangerMember, page: PageView, shapes?: ShapeView[]) {
        try {
            const api = this.__repo.start('insertStyleLib');
            api.styleInsert(this.__document, style);
            const p = this.__document.pagesMgr.getSync(page.id)
            if (shapes && p) {
                if (style instanceof FillMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.modifyFillsMask(p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof ShadowMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.modifyShadowsMask(p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof BlurMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.modifyBlurMask(p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof BorderMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.modifyBorderMask(adapt2Shape(shape).style, style.id);
                    }
                }
                if (style instanceof RadiusMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.modifyRadiusMask(adapt2Shape(shape), style.id);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    insertStyles(masks: StyleMangerMember[]) {
        try {
            const api = this.__repo.start('insertStyleLib');
            const styles = getStylesFromMasks(masks, this.__document.stylesMgr, this.__document.id);
            styles.forEach(style => api.styleInsert(this.__document, style));
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }

        function getStylesFromMasks(masks: StyleMangerMember[], manger: ResourceMgr<StyleMangerMember>, sheetId: string) {
            const styles: StyleMangerMember[] = [];
            for (const mask of masks) {
                if (manger.has(mask.id)) continue;
                let m: StyleMangerMember;
                if (mask.typeId === 'fill-mask') {
                    const fills = new BasicArray<Fill>(...(mask as FillMask).fills.map(i => importFill(i)));
                    m = new FillMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, fills, mask.disabled);
                } else if (mask.typeId === 'shadow-mask') {
                    const shadows = new BasicArray<Shadow>(...(mask as ShadowMask).shadows.map(i => importShadow(i)));
                    m = new ShadowMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, shadows, mask.disabled)
                } else if (mask.typeId === 'blur-mask') {
                    const __mask = mask as BlurMask;
                    const frank = new Blur(true, new Point2D(0, 0), 10, BlurType.Gaussian);
                    const blur = __mask.blur ? importBlur(__mask.blur) : frank;
                    m = new BlurMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, blur, mask.disabled);
                } else if (mask.typeId === 'border-mask') {
                    const __mask = mask as BorderMask;
                    const border = importBorderMaskType(__mask.border);
                    m = new BorderMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, border, mask.disabled);
                } else if (mask.typeId === 'radius-mask') {
                    const __mask = mask as RadiusMask;
                    m = new RadiusMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, new BasicArray<number>(...__mask.radius), mask.disabled)
                } else {
                    const __mask = mask as TextMask;
                    const text = importTextAttr(__mask.text)
                    m = new TextMask([0] as BasicArray<number>, sheetId, mask.id, mask.name, mask.description, text, mask.disabled)
                }
                styles.push(m);
            }
            return styles;
        }
    }

    modifyRadiusMaskRadiusSetting(sheetid: string, maskid: string, value: number[]) {
        const api = this.__repo.start('modifyRadiusMaskRadiusSetting');
        try {
            api.modifyRadiusMaskRadiusSetting(this.__document, sheetid, maskid, value)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyStyleName(sheetid: string, maskid: string, name: string) {
        const api = this.__repo.start('modifyStyleName');
        try {
            api.modifyStyleName(this.__document, sheetid, maskid, name)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyStyleDescription(sheetid: string, maskid: string, des: string | undefined) {
        const api = this.__repo.start('modifyStyleDescription');
        try {
            api.modifyStyleDescription(this.__document, sheetid, maskid, des)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }
}