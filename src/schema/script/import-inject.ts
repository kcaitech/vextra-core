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
            crdtidx: [0],
            id: id1,
            mode: types.CurveMode.Straight,
            x: 0, y: 0
        }; // lt
        const p2: types.CurvePoint =
        {
            crdtidx: [1],
            id: id2,
            mode: types.CurveMode.Straight,
            x: 1, y: 0
        }; // rt
        const p3: types.CurvePoint = {
            crdtidx: [2],
            id: id3,
            mode: types.CurveMode.Straight,
            x: 1, y: 1
        }; // rb
        const p4: types.CurvePoint = {
            crdtidx: [3],
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
inject['Artboard'] = {} as any;
inject['Artboard']['before'] = `\
    // inject code
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "3be37f40-7e80-4921-8191-3aa215d5f037"
        const id2 = "eb7938cf-6084-46fc-813b-ec25d03bd071"
        const id3 = "1eb6cd29-125c-4e42-af59-b92fd3d31ab9"
        const id4 = "85465bad-0633-4c2f-880a-a3dbd22674af"
        const p1: types.CurvePoint = {
            crdtidx: [0],
            id: id1,
            mode: types.CurveMode.Straight,
            x: 0, y: 0
        }; // lt
        const p2: types.CurvePoint =
        {
            crdtidx: [1],
            id: id2,
            mode: types.CurveMode.Straight,
            x: 1, y: 0
        }; // rt
        const p3: types.CurvePoint = {
            crdtidx: [2],
            id: id3,
            mode: types.CurveMode.Straight,
            x: 1, y: 1
        }; // rb
        const p4: types.CurvePoint = {
            crdtidx: [3],
            id: id4,
            mode: types.CurveMode.Straight,
            x: 0, y: 1
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
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
            crdtidx: [i],
            value: v
        } as types.CrdtNumber));
        source.rowHeights = ((source as any).rowHeights as number[]).map((v, i) => ({
            id: uuid(),
            crdtidx: [i],
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
            c.id = id;
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

inject['GroupShape'] = {};
inject['GroupShape']['before'] = `\
    // inject code
    if ((source as any).isBoolOpShape) {
        source.typeId = "bool-shape";
        source.type = types.ShapeType.BoolShape;
        return importBoolShape(source, ctx);
    }
`

inject['SymbolShape'] = {};
inject['SymbolShape']['before'] = `\
    // inject code
    if (!source.variables) {
        source.variables = {} as any
    }
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "5b0a3535-78e4-470c-a9ee-2d71f5018ed1"
        const id2 = "704b561c-0416-47bb-929f-36a0a0e578b1"
        const id3 = "cc561e4b-0a03-4b77-9f83-882b988cb5d3"
        const id4 = "6b0599e9-8738-48a5-90bd-c681cf0ef021"
        const p1: types.CurvePoint = {
            crdtidx: [0],
            id: id1,
            mode: types.CurveMode.Straight,
            x: 0, y: 0
        }; // lt
        const p2: types.CurvePoint =
        {
            crdtidx: [1],
            id: id2,
            mode: types.CurveMode.Straight,
            x: 1, y: 0
        }; // rt
        const p3: types.CurvePoint = {
            crdtidx: [2],
            id: id3,
            mode: types.CurveMode.Straight,
            x: 1, y: 1
        }; // rb
        const p4: types.CurvePoint = {
            crdtidx: [3],
            id: id4,
            mode: types.CurveMode.Straight,
            x: 0, y: 1
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
`

inject['SymbolUnionShape'] = {};
inject['SymbolUnionShape']['before'] = `\
    // inject code
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "75ce3f2a-dd1f-4eab-a989-9cf2f9a3e0df"
        const id2 = "aa088ba0-8fa6-47cd-8b1d-5badb9e8395d"
        const id3 = "24fdb5e2-95e9-4252-a28e-8cb37af36df7"
        const id4 = "e9293b8c-c915-4a48-a338-97a60006e39e"
        const p1: types.CurvePoint = {
            crdtidx: [0],
            id: id1,
            mode: types.CurveMode.Straight,
            x: 0, y: 0
        }; // lt
        const p2: types.CurvePoint =
        {
            crdtidx: [1],
            id: id2,
            mode: types.CurveMode.Straight,
            x: 1, y: 0
        }; // rt
        const p3: types.CurvePoint = {
            crdtidx: [2],
            id: id3,
            mode: types.CurveMode.Straight,
            x: 1, y: 1
        }; // rb
        const p4: types.CurvePoint = {
            crdtidx: [3],
            id: id4,
            mode: types.CurveMode.Straight,
            x: 0, y: 1
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
`

inject['SymbolShape']['after'] = `\
    // inject code
    if (ctx?.document) {
        const registed = ctx.document.symbolregist.get(ret.id);
        // if (!registed || registed === 'freesymbols' || registed === ctx.curPage) {
        ctx.document.symbolsMgr.add(ret.id, ret);
        // }
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
    if (!(source as any).symbolregist) (source as any).symbolregist = {};
`

inject['Page'] = {};
inject['Page']['before'] = `\
    // inject code
    // 兼容旧数据
    if (!(source as any).crdtidx) (source as any).crdtidx = []
`

inject['TableCell'] = {};
inject['TableCell']['before'] = `\
    // inject code
    // 兼容旧数据
    if (!(source as any).crdtidx) (source as any).crdtidx = []
    if (!source.text) source.text = {
        typeId: "text",
        paras: [
            {
                text: "\\n",
                spans: [
                    {
                        fontName: "PingFangSC-Regular",
                        fontSize: 14,
                        length: 1,
                        color: {
                            typeId: "color",
                            alpha: 0.85,
                            red: 0,
                            green: 0,
                            blue: 0
                        }
                    }
                ],
                attr: {
                    minimumLineHeight: 24
                }
            }
        ],
        attr: {
            textBehaviour: types.TextBehaviour.Fixed,
            padding: {
                left: 5,
                top: 0,
                right: 3,
                bottom: 0
            }
        }
    }
`

inject['TextAttr'] = {};
inject['TextAttr']['before'] = `\
    // inject code
    // 兼容旧数据
    const _source = source as any;
    if (typeof _source.bold === 'boolean') {
        _source.bold = _source.bold ? 700 : 400;
    }
`