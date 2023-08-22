export const inject: any = {};
inject['ImageShape'] = {} as any;
inject['ImageShape']['before'] = `\
    // inject code
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "b259921b-4eba-461d-afc3-c4c58c1fa337"
        const id2 = "62ea3ee3-3378-4602-a918-7e05f426bb8e"
        const id3 = "1519da3c-c692-4e1d-beb4-01a85cc56738"
        const id4 = "e857f541-4e7f-491b-96e6-2ca38f1d4c09"
        const p1: types.CurvePoint = {
            id: id1,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 0 }
        }; // lt
        const p2: types.CurvePoint =
        {
            id: id2,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 0 }
        }; // rt
        const p3: types.CurvePoint = {
            id: id3,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 1 }
        }; // rb
        const p4: types.CurvePoint = {
            id: id4,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 1 }
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
`

inject['ImageShape']['after'] = `\
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
`
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
    if (ctx?.document) ret.setSymbolMgr(ctx.document.symbolsMgr);
`
inject['Artboard'] = {};
inject['Artboard']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.artboardMgr.add(ret.id, ret);
`
inject['SymbolShape'] = {};
inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.document) ctx.document.symbolsMgr.add(ret.id, ret);
`
inject['FlattenShape'] = {};
inject['FlattenShape']['content'] = `\
    // inject code
    const ret = importGroupShape(source, ctx);
    ret.isBoolOpShape = true;
    return ret;
`

