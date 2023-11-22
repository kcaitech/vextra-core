export const inject: any = {};
inject['SymbolShape'] = {};
inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.symbols) ctx.symbols.add(ret.id);
`

inject['SymbolRefShape'] = {};
inject['SymbolRefShape']['after'] = `\
    // inject code
    if (ctx?.referenced) ctx.referenced.add(ret.refId);
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
