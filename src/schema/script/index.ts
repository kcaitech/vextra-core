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