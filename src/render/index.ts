// import { init as pathopinit } from "./boolop";

// export async function init() {
//     await pathopinit();
// }

export { RenderTransform } from "./basic"

export { render as renderArtboard } from "./artboard";
export { render as renderGroup } from "./group";
export { render as renderImage } from "./image";
export { render as renderLine } from "./line";
export { render as renderPathShape } from "./pathshape";
// export { render as renderRecShape } from "./rectangle";
export { render as renderBoolOpShape, render2path } from "./boolgroup";
export { render as renderSymbolRef } from "./symbolref";
export { render as renderSymbol } from "./symbol";
export { render as renderTextShape } from "./text";
export { render as renderTable } from "./table";
export { render as renderContact } from "./contact";
export { render as renderSymbolPreview } from "./symbol_preview";

// export { render as renderTableCell } from "./tablecell";
export { render as renderTableCell } from "./tablecell";
