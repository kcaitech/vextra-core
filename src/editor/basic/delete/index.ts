/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Api } from "../../../coop";
import { ContactShape, GroupShape, Page, Shape, Document, OverrideType, SymbolShape, SymbolUnionShape, BoolShape } from "../../../data";
import { find_layers_by_varid } from "../../utils/other";

/**
 * @description 删除图层涉及多方面协调,不可以直接使用api删除
 */
export class ShapeCleaner {

    constructor(private document: Document, private api: Api, private page: Page) {
    }

    // 删除前
    // 清除连接线的影响
    // 清除连接线端点的影响
    // 清除图层对组件的影响

    // 删除图层

    // 删除后
    // 去除空的编组
    // 去除空的组件状态合集

    private removeContact(shape: Shape) {
        const api = this.api;
        const page = this.page;
        const contacts = shape.style.contacts;
        if (contacts && contacts.length) {
            for (let i = 0, len = contacts.length; i < len; i++) {
                const shape = page.getShape(contacts[i].shapeId);
                if (!shape) continue;
                const p = shape.parent as GroupShape;
                if (!p) continue;
                let idx = -1;
                for (let j = 0, len = p.childs.length; j < len; j++) {
                    if (p.childs[j].id === shape.id) {
                        idx = j;
                        break;
                    }
                }
                if (idx > -1) api.shapeDelete(this.document, page, p as GroupShape, idx);
            }
        }
    }

    private removeContactSides(shape: ContactShape) {
        const api = this.api;
        const page = this.page;

        if (shape.from) {
            const fromShape = page.getShape(shape.from.shapeId);
            const contacts = fromShape?.style.contacts;
            if (fromShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) api.removeContactRoleAt(page, fromShape, idx);
            }
        }
        if (shape.to) {
            const toShape = page.getShape(shape.to.shapeId);
            const contacts = toShape?.style.contacts;
            if (toShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) api.removeContactRoleAt(page, toShape, idx);
            }
        }
    }

    private removeBindsEffect(shape: Shape, symbol: SymbolShape) {
        const page = this.page;
        const api = this.api;
        if (!shape.varbinds) return;
        const v1 = shape.varbinds.get(OverrideType.Visible);
        if (v1) {
            const layers = find_layers_by_varid(symbol, v1, OverrideType.Visible);
            if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v1);
        }
        const v2 = shape.varbinds.get(OverrideType.SymbolID);
        if (v2) {
            const layers = find_layers_by_varid(symbol, v2, OverrideType.SymbolID);
            if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v2);
        }
        const v3 = shape.varbinds.get(OverrideType.Text);
        if (v3) {
            const layers = find_layers_by_varid(symbol, v3, OverrideType.Text);
            if (layers.length < 2) api.shapeRemoveVariable(page, symbol, v3);
        }
    }

    action(shape: Shape, api?: Api) {

    }

    clearNullGroup(shape: GroupShape | SymbolUnionShape | BoolShape) {
        if (!shape.childs.length) this.action(shape);
    }
}