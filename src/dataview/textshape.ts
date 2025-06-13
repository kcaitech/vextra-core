/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Text, TextShape } from "../data";
import { ShapeView } from "./shape";
import {
    CursorLocate, TextLocate, locateCursor,
    locateNextCursor, locatePrevCursor, locateRange, locateText
} from "../data/text/textlocate";
import { DViewCtx, PropsType } from "./viewctx";
import { TextModifyEffect } from "./proxy/effects/text";
import { TextLayoutMgr } from "./proxy/layout/text";
import { TextViewCache } from "./proxy/cache/text";
import { TextFrameProxy } from "./proxy/frame/text";
import { GraphicsLibrary } from "./viewctx";
export class TextShapeView extends ShapeView {
    cache: TextViewCache;
    frameProxy: TextFrameProxy;
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.effect = new TextModifyEffect(this);
        this.layoutProxy = new TextLayoutMgr(this);
        this.cache = new TextViewCache(this);
        this.frameProxy = new TextFrameProxy(this);
    }

    getText(): Text {
        return this.cache.text;
    }

    get data() {
        return this.m_data as TextShape;
    }

    get text() {
        return this.getText();
    }

    get isImageFill() {
        return false;
    }

    getLayout() {
        return this.cache.layout;
    }

    locateText(x: number, y: number): TextLocate {
        return locateText(this.getLayout(), x, y);
    }

    locateRange(start: number, end: number): { x: number, y: number }[] {
        return locateRange(this.getLayout(), start, end);
    }

    locateCursor(index: number, cursorAtBefore: boolean): CursorLocate | undefined {
        return locateCursor(this.getLayout(), index, cursorAtBefore);
    }

    locatePrevCursor(index: number): number {
        return locatePrevCursor(this.getLayout(), index);
    }

    locateNextCursor(index: number): number {
        return locateNextCursor(this.getLayout(), index);
    }

    getTextPath() {
        return this.cache.textPath;
    }

    asyncRender(gl: GraphicsLibrary): number {
        return this.render(gl);
    }

    onDestroy(): void {
        super.onDestroy();
        this.cache.dropLayout();
    }
}