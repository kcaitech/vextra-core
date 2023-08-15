import { gentypes } from "../../script/schema/gen-types";
import { genclass } from "./gen-class";
import { genexport } from "./gen-export";
import { genimport } from "./gen-import";
const path = require("path")

// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../data/')
// const outfile = path.join(outdir, 'typesdefine' + typesext)


const typesext = '.ts'
const schemadir = path.resolve('./')
// const outdir = path.resolve('../data/')
// const outfile = path.join(outdir, 'baseclasses' + typesext)

gentypes(schemadir, path.join(path.resolve('../data/'), 'typesdefine' + typesext))
const basicpath = "./basic";
genclass(schemadir, path.join(path.resolve('../data/'), 'baseclasses' + typesext), basicpath)

const implpath = "../data/classes"
const typedefs = "../data/typesdefine"
const arrayimpl = "../data/basic"
// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../io/')
// const outfile = path.join(outdir, 'baseexport' + typesext)
// const exportadaptor = "./exportadaptor"
genexport(schemadir, path.join(path.resolve('../io/'), 'baseexport' + typesext), typedefs)

// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../io/')
// const outfile = path.join(outdir, 'baseimport' + typesext)
// const importadaptor = "./importadaptor"
genimport(schemadir, path.join(path.resolve('../io/'), 'baseimport' + typesext), implpath, typedefs, arrayimpl)
