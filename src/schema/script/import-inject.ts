/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export const inject: any = {};

inject['Fill'] = {};
inject['Fill']['after'] = `\
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
`
inject['TableShape'] = {};
inject['TableShape']['after'] = `\
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
`
inject['SymbolRefShape'] = {};
inject['SymbolRefShape']['after'] = `\
    // inject code
    if (ctx?.document) {
        ret.setSymbolMgr(ctx.document.symbolsMgr);
        ret.setImageMgr(ctx.document.mediasMgr);
    }
`
inject['SymbolShape'] = {};
inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.document) {
        // const registed = ctx.document.symbolregist.get(ret.id);
        // if (!registed || registed === 'freesymbols' || registed === ctx.curPage) {
        ctx.document.symbolsMgr.add(ret.id, ret);
        // }
    }
`
inject['FillMask'] = {};
inject['FillMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['ShadowMask'] = {};
inject['ShadowMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['BlurMask'] = {};
inject['BlurMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['BorderMask'] = {};
inject['BorderMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['RadiusMask'] = {};
inject['RadiusMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['TextMask'] = {};
inject['TextMask']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.stylesMgr.add(ret.id, ret);
`
inject['Style'] = {};
inject['Style']['after'] = `\
    // inject code
    if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);
`
inject['Text'] = {};
inject['Text']['after'] = `\
    // inject code
    if (ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);
`