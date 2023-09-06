export const inject: any = {};
inject['GroupShape'] = {};
inject['GroupShape']['after'] = `\
    // inject code
    if (ctx?.symbols && ret.isSymbolShape) ctx.symbols.add(ret.id);
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
inject['OverrideShape'] = {};
inject['OverrideShape']['after'] = `\
    // inject code
    if (ctx?.medias && ret.imageRef) ctx.medias.add(ret.imageRef);
`
