/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, GroupShape, ShapeFrame, Creator } from "../src";

export function newDocument() {
    return new Document();
}

export function newPage(document: Document) {
    const page = Creator.newPage("Page1");
    document.pagesMgr.add(page.id, page);
    document.pagesList.push(Creator.newPageListItem(page.id, page.name));
    return page
}

export function newRectShape(parent: GroupShape, x: number, y: number, width: number, height: number) {
    const frame = new ShapeFrame(x, y, width, height);
    const shape = Creator.newRectShape("Rect1", frame, parent.style.getStylesMgr());
    parent.childs.push(shape);
    return shape
}