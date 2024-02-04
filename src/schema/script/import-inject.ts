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
            crdtidx: {
                index: [0],
                order: ""
            },
            id: id1,
            mode: types.CurveMode.Straight,
            x: 0, y: 0
        }; // lt
        const p2: types.CurvePoint =
        {
            crdtidx: {
                index: [1],
                order: ""
            },
            id: id2,
            mode: types.CurveMode.Straight,
            x: 1, y: 0
        }; // rt
        const p3: types.CurvePoint = {
            crdtidx: {
                index: [2],
                order: ""
            },
            id: id3,
            mode: types.CurveMode.Straight,
            x: 1, y: 1
        }; // rb
        const p4: types.CurvePoint = {
            crdtidx: {
                index: [3],
                order: ""
            },
            id: id4,
            mode: types.CurveMode.Straight,
            x: 0, y: 1
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
inject['TableShape']['before'] = `\
    // inject code
    // 兼容旧数据
    if ((source as any).datas || (source as any).childs) {
        source.colWidths = ((source as any).colWidths as number[]).map((v, i) => ({
            id: uuid(),
            crdtidx: {
                index: [i],
                order: ""
            },
            value: v
        } as types.CrdtNumber));
        source.rowHeights = ((source as any).rowHeights as number[]).map((v, i) => ({
            id: uuid(),
            crdtidx: {
                index: [i],
                order: ""
            },
            value: v
        } as types.CrdtNumber));

        const colCount = source.colWidths.length;
        const rowCount = source.rowHeights.length;
        const datas: types.TableCell[] = (source as any).datas || (source as any).childs;
        const cells: {[key: string]: types.TableCell} = {};
        for (let i = 0; i < datas.length; ++i) {
            const c = datas[i];
            if (!c) continue;
            const ri = Math.floor(i / colCount);
            const ci = i % colCount;
            if (ri >= rowCount) break;
            const id = source.rowHeights[ri].id + ',' + source.colWidths[ci].id;
            cells[id] = c;
        }
        source.cells = cells as any;
    }
`
inject['TableShape']['after'] = `\
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
`
inject['SymbolRefShape'] = {};
inject['SymbolRefShape']['before'] = `\
    // inject code
    if (!source.variables) {
        source.variables = {} as any
    }
    if ((source as any).virbindsEx) {
        source.overrides = (source as any).virbindsEx
    }
`
inject['SymbolRefShape']['after'] = `\
    // inject code
    if (ctx?.document) {
        ret.setSymbolMgr(ctx.document.symbolsMgr);
        ret.setImageMgr(ctx.document.mediasMgr);
    }
`

inject['FlattenShape'] = {};
inject['FlattenShape']['content'] = `\
    // inject code
    const ret = importGroupShape(source, ctx);
    ret.isBoolOpShape = true;
    ret.type = types.ShapeType.Group;
    return ret;
`

inject['SymbolShape'] = {};
inject['SymbolShape']['before'] = `\
    // inject code
    if (!source.variables) {
        source.variables = {} as any
    }
    if ((source as any).virbindsEx) {
        source.overrides = (source as any).virbindsEx
    }
`
inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.document) {
        if (ctx.document.symbolregist.get(ret.id) === ctx.curPage) {
            ctx.document.symbolsMgr.add(ret.id, ret);
        } else if ((ctx.document as any).__nosymbolregist) {
            // 兼容旧数据
            ctx.document.symbolregist.set(ret.id, ctx.curPage);
            ctx.document.symbolsMgr.add(ret.id, ret);
        }
    }
`

inject['CurvePoint'] = {};
inject['CurvePoint']['before'] = `\
    // inject code
    const _source = source as any;
    if (_source.cornerRadius) _source.radius = _source.cornerRadius;
    if (_source.hasCurveFrom) {
        _source.hasFrom = true;
        _source.fromX = _source.curveFrom.x;
        _source.fromY = _source.curveFrom.y;
    }
    if (_source.hasCurveTo) {
        _source.hasTo = true;
        _source.toX = _source.curveTo.x;
        _source.toY = _source.curveTo.y;
    }
    if (_source.point) {
        _source.x = _source.point.x;
        _source.y = _source.point.y;
    }
    if (_source.curveMode) {
        _source.mode = _source.curveMode;
    }
`

inject['DocumentMeta'] = {};
inject['DocumentMeta']['before'] = `\
    // inject code
    if (!(source as any).symbolregist) {
        (source as any).__nosymbolregist = true;
        (source as any).symbolregist = {};
    }
`

inject['Page'] = {};
inject['Page']['before'] = `\
    // inject code
    // 兼容旧数据
    if (!(source as any).crdtidx) {
        (source as any).crdtidx = {
            index: [],
            order: ""
        }
    }
`