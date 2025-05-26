/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseCreator } from "./base"

export class UseCreator extends BaseCreator {
    adjust() {
        const href = this.localAttributes["xlink:href"]
        if (!href) return;
        const id = href.replace("#", "")

        const svgRoot = this.htmlElement?.root
        if (!svgRoot) return;

        const el = svgRoot.querySelector(`#${id}`)
        if (!el) return;

        const creator = (el as any).creator as BaseCreator
        this.localAttributes = {
            ...creator.localAttributes,
            ...this.localAttributes,
        }
        this.attributes = {
            ...creator.attributes,
            ...this.attributes,
            useTargetCreator: creator,
        }
        this.htmlElement!.tagName = creator.htmlElement!.tagName
    }

    createShape() {
        this.attributes.useTargetCreator!.createShape.call(this)
    }
}
