/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ShapeView } from "../../../dataview";
import { ArtboardCanvasRenderer } from "./artboard";

export class SymbolCanvasRenderer extends ArtboardCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }
}