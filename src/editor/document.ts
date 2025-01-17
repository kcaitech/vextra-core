import { Page } from "../data/page";
import { Document } from "../data/document";
import { FillType, GradientType, ImageScaleMode, PageListItem } from "../data/typesdefine";
import { newPage } from "./creator";
import { v4 as uuid } from "uuid";
import { exportGradient, exportPage, exportStop } from "../data/baseexport";
import { IImportContext, importGradient, importPage, importStop } from "../data/baseimport";
import { newDocument } from "./creator";
import { CoopRepository } from "../coop/cooprepo";
import { Repository } from "../data/transact";
import * as types from "../data/typesdefine";
import { FMT_VER_latest } from "../data/fmtver";
import { ShadowPosition } from "../data/baseclasses"
import { FillMask, ShadowMask, StyleMangerMember, BlurMask, BorderMask,RadiusMask } from "../data/style";
import { adapt2Shape, PageView, ShapeView } from "../dataview";
import { Color, Fill, Shadow, BlurType, BorderPosition,BorderSideSetting } from "../data/classes";
import { BasicArray, Stop, Gradient, Point2D } from "../data";
import { Matrix } from "../basic/matrix";

export function createDocument(documentName: string, repo: Repository): Document {
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
        const api = this.__repo.start('insertStyleLib');
        try {
            api.styleInsert(this.__document, style);
            const p = this.__document.pagesMgr.getSync(page.id)
            if (shapes && p) {
                if (style instanceof FillMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.addfillmask(this.__document, p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof ShadowMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.addshadowmask(this.__document, p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof BlurMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.addblurmask(this.__document, p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof BorderMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.addbordermask(this.__document, p, adapt2Shape(shape), style.id);
                    }
                }
                if (style instanceof RadiusMask) {
                    for (let i = 0; i < shapes.length; i++) {
                        const shape = shapes[i];
                        api.addradiusmask(this.__document, p, adapt2Shape(shape), style.id);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillColor(sheetid: string, maskid: string, index: number, color: Color) {
        const api = this.__repo.start('modifyFillMaskColor');
        try {
            api.modifyFillMaskColor(this.__document, sheetid, maskid, index, color)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillOpacity(sheetid: string, maskid: string, index: number, color: Color) {
        const api = this.__repo.start('modifyFillMaskFillOpacity');
        try {
            api.modifyFillMaskOpacity(this.__document, sheetid, maskid, index, color)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillEnabled(sheetid: string, maskid: string, index: number, isEnable: boolean) {
        const api = this.__repo.start('modifyFillMaskFillEnabled');
        try {
            api.modifyFillMaskEnabled(this.__document, sheetid, maskid, index, isEnable)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillDelFill(sheetid: string, maskid: string, index: number) {
        const api = this.__repo.start('modifyFillMaskFillDelFill');
        try {
            api.modifyFillMaskDelFill(this.__document, sheetid, maskid, index)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillAddFill(sheetid: string, maskid: string, fill: Fill) {
        const api = this.__repo.start('modifyFillMaskFillAddFill');
        try {
            api.modifyFillMaskAddFill(this.__document, sheetid, maskid, fill)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskFillFillType(sheetid: string, maskid: string, index: number, fillType: FillType) {
        const api = this.__repo.start('modifyFillMaskFillFillType');
        try {
            api.modifyFillMaskFillType(this.__document, sheetid, maskid, index, fillType)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyFillMaskGradientType(sheetid: string, maskid: string, index: number, type: GradientType) {
        const api = this.__repo.start('modifyFillMaskGradientType');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (gradient_container.fillType !== FillType.Gradient) {
                const f = api.modifyFillMaskFillType.bind(api)
                f(this.__document, sheetid, maskid, index, FillType.Gradient)
            }
            if (gradient) {
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.gradientType = type;
                if (type === GradientType.Linear && gradient.gradientType !== GradientType.Linear) {
                    new_gradient.from.y = new_gradient.from.y - (new_gradient.to.y - new_gradient.from.y);
                    new_gradient.from.x = new_gradient.from.x - (new_gradient.to.x - new_gradient.from.x);
                } else if (gradient.gradientType === GradientType.Linear && type !== GradientType.Linear) {
                    new_gradient.from.y = new_gradient.from.y + (new_gradient.to.y - new_gradient.from.y) / 2;
                    new_gradient.from.x = new_gradient.from.x + (new_gradient.to.x - new_gradient.from.x) / 2;
                }
                if (type === GradientType.Radial && new_gradient.elipseLength === undefined) {
                    new_gradient.elipseLength = 1;
                }
                new_gradient.stops[0].color = gradient_container.color;
                const f = api.modifyFillGradient.bind(api)
                f(this.__document, sheetid, maskid, index, new_gradient);
            } else {
                const stops = new BasicArray<Stop>();
                // const frame = target.frame;
                const { alpha, red, green, blue } = gradient_container.color;
                stops.push(new Stop(new BasicArray(), uuid(), 0, new Color(alpha, red, green, blue)), new Stop(new BasicArray(), uuid(), 1, new Color(0, red, green, blue)))
                const from = type === GradientType.Linear ? { x: 0.5, y: 0 } : { x: 0.5, y: 0.5 };
                const to = { x: 0.5, y: 1 };
                let elipseLength = undefined;
                if (type === GradientType.Radial) {
                    elipseLength = 1;
                }
                const new_gradient = new Gradient(from as Point2D, to as Point2D, type, stops, elipseLength);
                new_gradient.stops.forEach((v, i) => {
                    const idx = new BasicArray<number>();
                    idx.push(i);
                    v.crdtidx = idx;
                })
                const f = api.modifyFillGradient.bind(api)
                f(this.__document, sheetid, maskid, index, new_gradient);
            }

            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientType:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskGradientStop(sheetid: string, maskid: string, index: number, value: Stop) {
        const api = this.__repo.start('modifyFillMaskGradientStop');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (!gradient) return
            const new_gradient = importGradient(exportGradient(gradient));
            new_gradient.stops.push(importStop(exportStop(value)));
            const s = new_gradient.stops;
            s.sort((a, b) => {
                if (a.position > b.position) {
                    return 1;
                } else if (a.position < b.position) {
                    return -1;
                } else {
                    return 0;
                }
            })
            new_gradient.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            const f = api.modifyFillGradient.bind(api)
            f(this.__document, sheetid, maskid, index, new_gradient)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientStop:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskGradientStopColor(sheetid: string, maskid: string, index: number, value: any) {
        const api = this.__repo.start('modifyFillMaskGradientStopColor');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (!gradient) return
            const stops = gradient.stops;
            if (!stops?.length) return
            const { color, stop_i } = value;
            const new_gradient = importGradient(exportGradient(gradient));
            new_gradient.stops[stop_i].color = color;
            const f_c = api.modifyFillMaskColor.bind(api)
            f_c(this.__document, sheetid, maskid, index, color)
            const s = new_gradient.stops;
            s.sort((a, b) => {
                if (a.position > b.position) {
                    return 1;
                } else if (a.position < b.position) {
                    return -1;
                } else {
                    return 0;
                }
            })
            new_gradient.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            const f = api.modifyFillGradient.bind(api)
            f(this.__document, sheetid, maskid, index, new_gradient)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientStopColor:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskGradientReverse(sheetid: string, maskid: string, index: number) {
        const api = this.__repo.start('modifyFillMaskGradientReverse');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (!gradient) return
            const stops = gradient.stops;
            if (!stops.length) return
            const new_stops: BasicArray<Stop> = new BasicArray<Stop>();
            for (let _i = 0, _l = stops.length; _i < _l; _i++) {
                const _stop = stops[_i];
                const inver_index = stops.length - 1 - _i;
                new_stops.push(importStop(exportStop(new Stop(_stop.crdtidx, _stop.id, _stop.position, stops[inver_index].color))));
            }
            const f_c = api.modifyFillMaskColor.bind(api)
            f_c(this.__document, sheetid, maskid, index, new_stops[0].color as Color)
            const new_gradient = importGradient(exportGradient(gradient));
            new_gradient.stops = new_stops;
            const f = api.modifyFillGradient.bind(api)
            f(this.__document, sheetid, maskid, index, new_gradient)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientOpacity:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskGradientOpacity(sheetid: string, maskid: string, index: number, opacity: number) {
        const api = this.__repo.start('modifyFillMaskGradientOpacity');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (!gradient) return
            const new_gradient = importGradient(exportGradient(gradient));
            new_gradient.gradientOpacity = opacity;
            const f = api.modifyFillGradient.bind(api)
            f(this.__document, sheetid, maskid, index, new_gradient)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientOpacity:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskGradientRotate(sheetid: string, maskid: string, index: number) {
        const api = this.__repo.start('modifyFillMaskGradientRotate');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const grad_type = fillmask.fills;
            const gradient_container = grad_type[index];
            const gradient = gradient_container.gradient;
            if (!gradient) return
            const new_gradient = importGradient(exportGradient(gradient));
            const { from, to } = new_gradient;
            const gradientType = new_gradient.gradientType;
            if (gradientType === types.GradientType.Linear) {
                const midpoint = { x: (to.x + from.x) / 2, y: (to.y + from.y) / 2 };
                const m = new Matrix();
                m.trans(-midpoint.x, -midpoint.y);
                m.rotate(Math.PI / 2);
                m.trans(midpoint.x, midpoint.y);
                new_gradient.to = m.computeCoord3(to) as any;
                new_gradient.from = m.computeCoord3(from) as any;
            } else if (gradientType === types.GradientType.Radial || gradientType === types.GradientType.Angular) {
                const m = new Matrix();
                m.trans(-from.x, -from.y);
                m.rotate(Math.PI / 2);
                m.trans(from.x, from.y);
                new_gradient.to = m.computeCoord3(to) as any;
            }
            const f = api.modifyFillGradient.bind(api)
            f(this.__document, sheetid, maskid, index, new_gradient)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskGradientRotate:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskImageScaleMode(sheetid: string, maskid: string, index: number, mode: ImageScaleMode) {
        const api = this.__repo.start('modifyFillMaskImageScaleMode');
        try {
            let libs = this.__document.stylelib;
            if (!libs) return
            const lib = libs.find(s => s.id === sheetid);
            if (!lib) return
            const fillmask = lib.variables.find(s => (s as FillMask).id === maskid)
            if (!(fillmask && fillmask instanceof FillMask)) return
            const fill = fillmask.fills[index];
            api.modifyFillMaskImageScaleMode(this.__document, sheetid, maskid, index, mode)
            if (mode === types.ImageScaleMode.Tile) {
                if (!fill.scale) {
                    api.modifyFillMaskScale(this.__document, sheetid, maskid, index, 0.5)
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskImageScaleMode:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskImageOpacity(sheetid: string, maskid: string, index: number, opacity: number) {
        const api = this.__repo.start('modifyFillMaskImageOpacity');
        try {
            api.modifyFillMaskImageOpacity(this.__document, sheetid, maskid, index, opacity)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskImageOpacity:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskImageRotate(sheetid: string, maskid: string, index: number, rotate: number) {
        const api = this.__repo.start('modifyFillMaskImageRotate');
        try {
            api.modifyFillMaskImageRotate(this.__document, sheetid, maskid, index, rotate)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskImageRotate:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskImageScale(sheetid: string, maskid: string, index: number, rotate: number) {
        const api = this.__repo.start('modifyFillMaskImageScale');
        try {
            api.modifyFillMaskScale(this.__document, sheetid, maskid, index, rotate)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskImageScale:', error);
            this.__repo.rollback();
        }
    }

    modifyFillMaskImageRef(sheetid: string, maskid: string, index: number, value: any) {
        const api = this.__repo.start('modifyFillMaskImageRef');
        try {
            const { urlRef, origin, imageMgr } = value
            api.modifyFillMaskImageRef(this.__document, sheetid, maskid, index, urlRef, imageMgr)
            api.modifyFillMaskImageOriginWidth(this.__document, sheetid, maskid, index, origin.width)
            api.modifyFillMaskImageOriginHeight(this.__document, sheetid, maskid, index, origin.height)
            this.__repo.commit();
        } catch (error) {
            console.log('modifyFillMaskImageScale:', error);
            this.__repo.rollback();
        }
    }

    modifyShadowMaskShadowEnabled(sheetid: string, maskid: string, index: number, isEnable: boolean) {
        const api = this.__repo.start('modifyShadowMaskShadowEnabled');
        try {
            api.modifyShadowMaskEnabled(this.__document, sheetid, maskid, index, isEnable)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowAddShadow(sheetid: string, maskid: string, shadow: Shadow) {
        const api = this.__repo.start('modifyShadowMaskShadowAddShadow');
        try {
            api.modifyShadowMaskAddShadow(this.__document, sheetid, maskid, shadow)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowRemoveShadow(sheetid: string, maskid: string, index: number) {
        const api = this.__repo.start('modifyShadowMaskShadowRemoveShadow');
        try {
            api.modifyShadowMaskDelShadow(this.__document, sheetid, maskid, index)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowPosition(sheetid: string, maskid: string, index: number, position: ShadowPosition) {
        const api = this.__repo.start('modifyShadowMaskShadowRemoveShadow');
        try {
            api.modifyShadowMaskShadowPosition(this.__document, sheetid, maskid, index, position)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowOffsetX(sheetid: string, maskid: string, index: number, offsetX: number) {
        const api = this.__repo.start('modifyShadowMaskShadowOffsetX');
        try {
            api.modifyShadowMaskShadowOffsetX(this.__document, sheetid, maskid, index, offsetX)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowOffsetY(sheetid: string, maskid: string, index: number, offsetY: number) {
        const api = this.__repo.start('modifyShadowMaskShadowOffsetY');
        try {
            api.modifyShadowMaskShadowOffsetY(this.__document, sheetid, maskid, index, offsetY)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowBlur(sheetid: string, maskid: string, index: number, blur: number) {
        const api = this.__repo.start('modifyShadowMaskShadowBlurRadius');
        try {
            api.modifyShadowMaskShadowBlur(this.__document, sheetid, maskid, index, blur)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowSpread(sheetid: string, maskid: string, index: number, spread: number) {
        const api = this.__repo.start('modifyShadowMaskShadowSpread');
        try {
            api.modifyShadowMaskShadowSpread(this.__document, sheetid, maskid, index, spread)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyShadowMaskShadowColor(sheetid: string, maskid: string, index: number, color: Color) {
        const api = this.__repo.start('modifyShadowMaskShadowColor');
        try {
            api.modifyShadowMaskShadowColor(this.__document, sheetid, maskid, index, color)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyBlurMaskBlurEnabled(sheetid: string, maskid: string, isEnable: boolean) {
        const api = this.__repo.start('modifyBlurMaskBlurEnabled');
        try {
            api.modifyBlurMaskBlurEnabled(this.__document, sheetid, maskid, isEnable)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyBlurMaskBlurType(sheetid: string, maskid: string, type: BlurType) {
        const api = this.__repo.start('modifyBlurMaskBlurType');
        try {
            api.modifyBlurMaskBlurType(this.__document, sheetid, maskid, type)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyBlurMaskBlurSaturation(sheetid: string, maskid: string, saturation: number) {
        const api = this.__repo.start('modifyBlurMaskBlurSaturation');
        try {
            api.modifyBlurMaskBlurSaturation(this.__document, sheetid, maskid, saturation)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyBorderMaskBorderPosition(sheetid: string, maskid: string, position: BorderPosition) {
        const api = this.__repo.start('modifyBorderMaskBorderPosition');
        try {
            api.modifyBorderMaskBorderPosition(this.__document, sheetid, maskid, position)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    modifyBorderMaskBorderSideSetting(sheetid: string, maskid: string, side: BorderSideSetting) {
        const api = this.__repo.start('modifyBorderMaskBorderSideSetting');
        try {
            api.modifyBorderMaskBorderSideSetting(this.__document, sheetid, maskid, side)
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
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

    modifyStyleName(sheetid: string, maskid: string, name: string | undefined) {
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