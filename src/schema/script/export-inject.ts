/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export const inject: any = {};

inject['Shape'] = {};
inject['Shape']['after'] = `\
    // inject code
    if (ctx?.styles && ret.radiusMask) ctx.styles.add(ret.radiusMask);
`

inject['SymbolShape'] = {};
inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.symbols) ctx.symbols.add(ret.id);
`

inject['SymbolRefShape'] = {};
inject['SymbolRefShape']['after'] = `\
    // inject code
    if (ctx?.refsymbols) ctx.refsymbols.add(ret.refId);
`

inject['ImageShape'] = {};
inject['ImageShape']['after'] = `\
    // inject code
    if (ctx?.medias) ctx.medias.add(ret.imageRef);
`

inject['Style'] = {};
inject['Style']['after'] = `\
    // inject code
    if (ctx?.styles) {
        if (ret.fillsMask) ctx.styles.add(ret.fillsMask);
        if (ret.bordersMask) ctx.styles.add(ret.bordersMask);
        if (ret.shadowsMask) ctx.styles.add(ret.shadowsMask);
        if (ret.blursMask) ctx.styles.add(ret.blursMask);
    }
`
inject['Span'] = {};
inject['Span']['after'] = `\
    // inject code
    if (ctx?.styles && ret.textMask) ctx.styles.add(ret.textMask);
`

inject['ParaAttr'] = {};
inject['ParaAttr']['after'] = `\
    // inject code
    if (ctx?.styles && ret.textMask) ctx.styles.add(ret.textMask);
`

inject['Fill'] = {};
inject['Fill']['after'] = `\
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`

inject['Border'] = {};
inject['Border']['after'] = `\
    // inject code
    if (ctx?.styles && ret.fillsMask) ctx.styles.add(ret.fillsMask);
`

inject['TableCell'] = {};
inject['TableCell']['after'] = `\
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`
