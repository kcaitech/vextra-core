/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArtboardView } from "../../artboard";
import { RadiusMask } from "../../../data";
import { ViewCache } from "./view";

export class ArtboardViewCache extends ViewCache {
    constructor(protected view: ArtboardView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [
                this.view.cornerRadius?.lt ?? 0,
                this.view.cornerRadius?.rt ?? 0,
                this.view.cornerRadius?.rb ?? 0,
                this.view.cornerRadius?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius
    }
}
