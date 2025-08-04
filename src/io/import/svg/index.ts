/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { uuid } from "../../../basic/uuid"
import { IDataGuard, Document, Page, PageListItem, BasicArray} from "../../../data"
import { Parser } from "./paser"
import { newPage } from "../../../creator"

export function parse(content: string) {
    const parser = new DOMParser()
    const svgDocument = parser.parseFromString(content, "image/svg+xml")
    const svgElement = svgDocument.documentElement
    const svgParser = new Parser(svgElement)
    return {
        shape: svgParser.parse(),
        mediaResourceMgr: svgParser.context.mediaResourceMgr,
    }
}

export async function importDocument(file: File | string, repo: IDataGuard) {

    let name: string;
    let content: string;
    if (typeof file === 'string') {
        content = file;
        name = 'New File'
    } else {
        const buff = await file.arrayBuffer()
        // buffer to string
        content = new TextDecoder().decode(buff)
        name = file.name
    }

    const { shape, mediaResourceMgr } = parse(content)
    if (!shape) return new Document(uuid(), name, repo);

    const pageList = new BasicArray<PageListItem>();
    let page: Page;
    if (shape instanceof Page) {
        pageList.push(new PageListItem([0], shape.id, shape.name));
        page = shape;
    } else {
        page = newPage("Page1");
        page.addChild(shape);
        pageList.push(new PageListItem([0], page.id, page.name));
    }
    const document = new Document(uuid(), name, repo, {
        pageList,
    })

    mediaResourceMgr.forEach((media: { buff: Uint8Array, base64: string }, id: string) => {
        document.mediasMgr.add(id, media);
    });

    document.pagesMgr.add(page.id, page);

    return document;
}