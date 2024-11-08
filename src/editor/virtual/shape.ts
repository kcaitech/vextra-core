import { BoolOp, Fill, Color, BorderPosition, BorderStyle, MarkerType, Border, CurvePoint, CurveMode, Shadow, ShadowPosition, ExportFormat, ExportFileFormat, ExportFormatNameingScheme, OverrideType } from "src/data";
import { IShapeEditor } from "../interface/shape";

export class VirtualShapeEditor implements IShapeEditor {
    setName(name: string): void {
        throw new Error("Method not implemented.");
    }
    toggleVisible(): void {
        throw new Error("Method not implemented.");
    }
    toggleLock(): void {
        throw new Error("Method not implemented.");
    }
    translate(dx: number, dy: number, round: boolean): void {
        throw new Error("Method not implemented.");
    }
    translateTo(x: number, y: number): void {
        throw new Error("Method not implemented.");
    }
    expand(dw: number, dh: number): void {
        throw new Error("Method not implemented.");
    }
    expandTo(w: number, h: number): void {
        throw new Error("Method not implemented.");
    }
    setConstrainerProportions(val: boolean): void {
        throw new Error("Method not implemented.");
    }
    flipH(): void {
        throw new Error("Method not implemented.");
    }
    flipV(): void {
        throw new Error("Method not implemented.");
    }
    contextSettingOpacity(value: number): void {
        throw new Error("Method not implemented.");
    }
    setResizingConstraint(value: number): void {
        throw new Error("Method not implemented.");
    }
    rotate(deg: number): void {
        throw new Error("Method not implemented.");
    }
    setRectRadius(lt: number, rt: number, rb: number, lb: number): void {
        throw new Error("Method not implemented.");
    }
    setFixedRadius(fixedRadius: number): void {
        throw new Error("Method not implemented.");
    }
    setBoolOp(op: BoolOp, name?: string | undefined): void {
        throw new Error("Method not implemented.");
    }
    addFill(fill: Fill): void {
        throw new Error("Method not implemented.");
    }
    setFillColor(idx: number, color: Color): void {
        throw new Error("Method not implemented.");
    }
    setFillEnable(idx: number, value: boolean): void {
        throw new Error("Method not implemented.");
    }
    deleteFill(idx: number): void {
        throw new Error("Method not implemented.");
    }
    setBorderEnable(idx: number, isEnabled: boolean): void {
        throw new Error("Method not implemented.");
    }
    setBorderColor(idx: number, color: Color): void {
        throw new Error("Method not implemented.");
    }
    setBorderThickness(idx: number, thickness: number): void {
        throw new Error("Method not implemented.");
    }
    setBorderPosition(idx: number, position: BorderPosition): void {
        throw new Error("Method not implemented.");
    }
    setBorderStyle(idx: number, borderStyle: BorderStyle): void {
        throw new Error("Method not implemented.");
    }
    setMarkerType(mt: MarkerType, isEnd: boolean): void {
        throw new Error("Method not implemented.");
    }
    exchangeMarkerType(): void {
        throw new Error("Method not implemented.");
    }
    deleteBorder(idx: number): void {
        throw new Error("Method not implemented.");
    }
    addBorder(border: Border): void {
        throw new Error("Method not implemented.");
    }
    setPathClosedStatus(val: boolean, segmentIndex: number): void {
        throw new Error("Method not implemented.");
    }
    addPointAt(point: CurvePoint, idx: number, segmentIndex: number): void {
        throw new Error("Method not implemented.");
    }
    removePoints(map: Map<number, number[]>): void {
        throw new Error("Method not implemented.");
    }
    modifyPointsCurveMode(range: Map<number, number[]>, curve_mode: CurveMode): void {
        throw new Error("Method not implemented.");
    }
    modifyPointsCornerRadius(range: Map<number, number[]>, cornerRadius: number): void {
        throw new Error("Method not implemented.");
    }
    modifyPointsXY(actions: { x: number; y: number; segment: number; index: number; }[]): void {
        throw new Error("Method not implemented.");
    }
    addShadow(shadow: Shadow): void {
        throw new Error("Method not implemented.");
    }
    deleteShadow(idx: number): void {
        throw new Error("Method not implemented.");
    }
    setShadowPosition(idx: number, position: ShadowPosition): void {
        throw new Error("Method not implemented.");
    }
    setShadowEnable(idx: number, isEnabled: boolean): void {
        throw new Error("Method not implemented.");
    }
    setShadowColor(idx: number, color: Color): void {
        throw new Error("Method not implemented.");
    }
    setShadowOffsetX(idx: number, offserX: number): void {
        throw new Error("Method not implemented.");
    }
    setShadowOffsetY(idx: number, offsetY: number): void {
        throw new Error("Method not implemented.");
    }
    setShadowBlur(idx: number, blur: number): void {
        throw new Error("Method not implemented.");
    }
    setShadowSpread(idx: number, spread: number): void {
        throw new Error("Method not implemented.");
    }
    addExportFormat(formats: ExportFormat[]): void {
        throw new Error("Method not implemented.");
    }
    deleteExportFormat(idx: number): void {
        throw new Error("Method not implemented.");
    }
    setExportFormatScale(idx: number, scale: number): void {
        throw new Error("Method not implemented.");
    }
    setExportFormatName(idx: number, name: string): void {
        throw new Error("Method not implemented.");
    }
    setExportFormatFileFormat(idx: number, fileFormat: ExportFileFormat): void {
        throw new Error("Method not implemented.");
    }
    setExportFormatPerfix(idx: number, perfix: ExportFormatNameingScheme): void {
        throw new Error("Method not implemented.");
    }
    setExportTrimTransparent(trim: boolean): void {
        throw new Error("Method not implemented.");
    }
    setExportCanvasBackground(background: boolean): void {
        throw new Error("Method not implemented.");
    }
    setExportPreviewUnfold(unfold: boolean): void {
        throw new Error("Method not implemented.");
    }
    adapt(): void {
        throw new Error("Method not implemented.");
    }
    delete(): void {
        throw new Error("Method not implemented.");
    }
    bindVar(slot: OverrideType, varId: string): void {
        throw new Error("Method not implemented.");
    }
    
}