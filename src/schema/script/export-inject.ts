/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export const inject: any = {};
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

inject['Fill'] = {};
inject['Fill']['after'] = `\
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`

inject['TableCell'] = {};
inject['TableCell']['after'] = `\
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`
