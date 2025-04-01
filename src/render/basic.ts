/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Color } from "../data";
import { EL, ShapeView } from "../dataview";
export { findOverrideAndVar } from "../data/utils";

export const DefaultColor = Color.DefaultColor;

export function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}

export class IRenderer {

    constructor(protected view: ShapeView) {
    }

    getProps() {
    }

    renderFills() {
    }

    renderBorder() {
    }

    renderShadows(id?: string) {
    }

    renderBlur(id?: string) {
    }

    renderContent() {
    }

    checkAndResetDirty(): boolean {
        return this.view.m_ctx.removeDirty(this.view);
    }

    m_render_version: number = 0;

    render(type?: string) {
        return 0;
    }
    asyncRender(type?: string) {
        return  0;
    }

    get DOM() : EL | undefined {
        return undefined;
    }
}