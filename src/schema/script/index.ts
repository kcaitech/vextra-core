/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import path from 'path';
import { loadSchemas } from "./basic"
import { gen as genTypes } from "./types";
import { gen as genClass } from "./class";
import { gen as genExp } from "./export";
import { gen as genImp} from "./import";

const scriptdir = './src/schema/script2'

const allNodes = loadSchemas(path.join(scriptdir, '../'));

genTypes(allNodes, path.join(scriptdir, '../../data/typesdefine.ts'));

genClass(allNodes, path.join(scriptdir, '../../data/baseclasses.ts'), {
    extraHeader($) {
        $.nl('import { Basic, BasicArray, BasicMap } from "./basic"');
    },
    typesPath: "./typesdefine",
    extraOrder: [
        'GroupShape',
    ],
    baseClass: {
        extends: "Basic",
        array: "BasicArray",
        map: "BasicMap"
    }
});

genExp(allNodes, path.join(scriptdir, '../../data/baseexport.ts'));

genImp(allNodes, path.join(scriptdir, '../../data/baseimport.ts'))