import { BoolOp, Border, BorderPosition, BorderStyle, Color, CurveMode, CurvePoint, ExportFileFormat, ExportFormat, ExportFormatNameingScheme, Fill, MarkerType, OverrideType, Shadow, ShadowPosition } from "../../data"

export interface IShapeEditor {
    setName(name: string): void
    toggleVisible(): void
    toggleLock(): void
    translate(dx: number, dy: number, round: boolean): void
    translateTo(x: number, y: number): void
    expand(dw: number, dh: number): void
    expandTo(w: number, h: number): void
    setConstrainerProportions(val: boolean): void
    // flip
    flipH(): void
    flipV(): void
    contextSettingOpacity(value: number): void
    // resizingConstraint
    setResizingConstraint(value: number): void
    // rotation
    rotate(deg: number): void
    // radius
    setRectRadius(lt: number, rt: number, rb: number, lb: number): void
    setFixedRadius(fixedRadius: number): void
    setBoolOp(op: BoolOp, name?: string): void
    // fill
    addFill(fill: Fill): void
    setFillColor(idx: number, color: Color): void
    setFillEnable(idx: number, value: boolean): void
    deleteFill(idx: number): void
    // border
    setBorderEnable(idx: number, isEnabled: boolean): void
    setBorderColor(idx: number, color: Color): void
    setBorderThickness(idx: number, thickness: number): void
    setBorderPosition(idx: number, position: BorderPosition): void
    setBorderStyle(idx: number, borderStyle: BorderStyle): void
    setMarkerType(mt: MarkerType, isEnd: boolean): void
    exchangeMarkerType(): void
    deleteBorder(idx: number): void
    addBorder(border: Border): void
    // points
    setPathClosedStatus(val: boolean, segmentIndex: number): void
    addPointAt(point: CurvePoint, idx: number, segmentIndex: number): void
    removePoints(map: Map<number, number[]>): void
    modifyPointsCurveMode(range: Map<number, number[]>, curve_mode: CurveMode): void
    modifyPointsCornerRadius(range: Map<number, number[]>, cornerRadius: number): void
    modifyPointsXY(actions: { x: number, y: number, segment: number, index: number }[]): void
    // shadow
    addShadow(shadow: Shadow): void
    deleteShadow(idx: number): void
    setShadowPosition(idx: number, position: ShadowPosition): void
    setShadowEnable(idx: number, isEnabled: boolean): void
    setShadowColor(idx: number, color: Color): void
    setShadowOffsetX(idx: number, offserX: number): void
    setShadowOffsetY(idx: number, offsetY: number): void
    setShadowBlur(idx: number, blur: number): void
    setShadowSpread(idx: number, spread: number): void
    // export ops
    addExportFormat(formats: ExportFormat[]): void
    deleteExportFormat(idx: number): void
    setExportFormatScale(idx: number, scale: number): void
    setExportFormatName(idx: number, name: string): void
    setExportFormatFileFormat(idx: number, fileFormat: ExportFileFormat): void
    setExportFormatPerfix(idx: number, perfix: ExportFormatNameingScheme): void
    setExportTrimTransparent(trim: boolean): void
    setExportCanvasBackground(background: boolean): void
    setExportPreviewUnfold(unfold: boolean): void
    // 容器自适应大小
    adapt(): void
    // 删除图层
    delete(): void
    // shape
    bindVar(slot: OverrideType, varId: string): void
}