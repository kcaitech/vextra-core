/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, DataGuard, IO } from "../src";

export async function openFile(file: File): Promise<Document> {
    const repo = new DataGuard()
    if (file.name.endsWith('.vext')) {
        return IO.importVext(file, repo);
    }
    if (file.name.endsWith('.fig')) {
        return IO.importFigma(file, repo);
    }
    if (file.name.endsWith('.sketch')) {
        return IO.importSketch(file, repo)
    }
    if (file.name.endsWith('.svg')) {
        return IO.importSvg(file, repo)
    }
    throw new Error("Unsupported file type: " + file.name);
}