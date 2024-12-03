// import { is_mac } from "../../data/utils";

export const inject: any = {};
inject['ImageShape'] = {} as any;
inject['ImageShape']['before'] = `\
    // inject code
    const color: types.Color = {
        typeId: "color",
        alpha: 1,
        blue: 216,
        green: 216,
        red: 216
    }
    const size = source.size ?? (source as any).frame;
    const fill: types.Fill = {
        typeId: "fill",
        color: color,
        crdtidx: [0],
        fillType: types.FillType.Pattern,
        id: "bdcd3743-fb61-4aeb-8864-b95d47b84a90",
        imageRef: source.imageRef,
        isEnabled: true,
        imageScaleMode: types.ImageScaleMode.Fill,
        originalImageHeight: size.height,
        originalImageWidth: size.width
    }
    source.style.fills = [fill];
    if (!source.pathsegs) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points.length) {
            seg.points.push(...(source as any)?.points);
        } else {
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
        
            seg.points.push(p1, p2, p3, p4);
        }
     
        source.pathsegs = [seg];
    }
`
inject['PathShape'] = {} as any;
inject['PathShape']['before'] = `\
    // inject code
     if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }
`

inject['RectShape'] = {} as any;
inject['RectShape']['before'] = `\
    // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }
`

inject['OvalShape'] = {} as any;
inject['OvalShape']['before'] = `\
    // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }
`

inject['LineShape'] = {} as any;
inject['LineShape']['before'] = `\
    // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: false
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }
`

inject['CutoutShape'] = {} as any;
inject['CutoutShape']['before'] = `\
    // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: true
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    }
`

inject['ContactShape'] = {} as any;
inject['ContactShape']['before'] = `\
    // inject code
    if (!source.pathsegs?.length) { // 兼容旧数据
        const seg: types.PathSegment = {
            crdtidx: [0],
            id: '39e508e8-a1bb-4b55-ad68-aa2a9b3b447a',
            points:[],
            isClosed: false
        }
        
        if ((source as any)?.points?.length) {
            seg.points.push(...(source as any)?.points);
        } 
        
        source.pathsegs = [seg];
    } else {
        if (source?.pathsegs[0]?.isClosed) {
            source.pathsegs[0].isClosed = false;
        }
    }
`

inject['Fill'] = {};
inject['Fill']['after'] = `\
    // inject code
    if (ctx?.document) ret.setImageMgr(ctx.document.mediasMgr);
    if (source["colorMask"] && ctx?.document) ret.setStylesMgr(ctx.document.stylesMgr);
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
                        fontName: is_mac() ? "PingFang SC" : "微软雅黑",
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
    if (_source.bold) {
        _source.weight = _source.bold;
    }
`

inject['Border'] = {};
inject['Border']['before'] = `\
    // inject code
    if (!(source as any).sideSetting || !((source as any).sideSetting.crdtidx || (source as any).sideSetting.typeId)) {
        source.sideSetting = {
            crdtidx: [0],
            typeId:"border-side-setting",
            sideType: types.SideType.Normal,
            thicknessTop: source.thickness,
            thicknessLeft: source.thickness,
            thicknessBottom: source.thickness,
            thicknessRight: source.thickness,
        }
    }
`