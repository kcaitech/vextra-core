import path from 'path';
import { loadSchemas } from "./basic"
import { gen as genTypes } from "./types";
import { gen as genClass } from "./class";
import { gen as genExp } from "./export";
import { gen as genImp} from "./import";

const scriptdir = './src/schema/script2'

loadSchemas(path.join(scriptdir, '../'));

genTypes(path.join(scriptdir, '../../data/typesdefine.ts'));

genClass(path.join(scriptdir, '../../data/baseclasses.ts'));

genExp(path.join(scriptdir, '../../data/baseexport.ts'));

genImp(path.join(scriptdir, '../../data/baseimport.ts'))