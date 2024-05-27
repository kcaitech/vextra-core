import { Artboard } from './artboard'
import { BasicArray } from './basic'
import { ContactShape } from './contact'
import { GroupShape, ImageShape, LineShape, OvalShape, PathShape, PathShape2, RectShape, SymbolShape, SymbolUnionShape, TextShape } from './shape'
import { Border, Fill } from './style'
import { SymbolRefShape } from './symbolref'
import { TableShape } from './table'
import { Para, Span } from './text'

export * from './artboard'
export * from './document'
export * from './page'
export * from './shape'
export * from './style'
export * from './text'
export * from './path'
export * from './comment'
export * from './table'
export * from './contact'
export * from './symbolref'
export * from './color'

export { parsePath } from './pathparser'
export { layoutTable } from './tablelayout'
export { layoutText, TextLayout, getNextChar } from './textlayout'
export { importGradient } from './baseimport'

export { Crdtidx } from './baseclasses'

// export type Para_spans = BasicArray<Span>
// export type Style_borders = BasicArray<Border>
// export type Style_fills = BasicArray<Fill>
// export type Text_paras = BasicArray<Para>
// export type GroupShape_childs = BasicArray<GroupShape | ImageShape | PathShape | PathShape2 | RectShape | SymbolRefShape | SymbolShape | SymbolUnionShape | TextShape | Artboard | LineShape | OvalShape | TableShape | ContactShape | Shape | CutoutShape | BoolShape | PolygonShape | StarShape>

// export { 
//     Crdtidx, 
//     Gradient_stops, 
//     TableShape_rowHeights, 
//     TableShape_colWidths, 
//     DocumentMeta_pagesList,
//     ExportOptions_exportFormats,
//     GroupShape_childs,

//     PathSegment_points,
//     PathShape_pathsegs,
//     PathShape2_pathsegs,
//     Style_shadows,
//     Style_innerShadows,
//     Style_contacts,
//     Variable_0,

// } from './baseclasses'