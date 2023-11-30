import { BasicArray } from "../../data/basic";
import { ExportFormat, ExportOptions, Shape } from "../../data/shape";
import { ExportFileFormat, ExportFormatNameingScheme } from "../../data/style";

export function addExportFormat(shape: Shape, format: ExportFormat, index: number) {
    if (!shape.exportOptions) {
        const formats = new BasicArray<ExportFormat>();
        const includedChildIds = new BasicArray<string>();
        shape.exportOptions = new ExportOptions(formats, includedChildIds, 0, false, false, false, false);
    }
    shape.exportOptions.exportFormats.splice(index, 0, format);
}

export function deleteExportFormatAt(options: ExportOptions, index: number) {
    return options.exportFormats.splice(index, 1)[0];
}
export function deleteExportFormats(options: ExportOptions, index: number, strength: number) {
    return options.exportFormats.splice(index, strength);
}

export function setExportFormatScale(options: ExportOptions, index: number, scale: number) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) format.scale = scale;
}

export function setExportFormatName(options: ExportOptions, index: number, name: string) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) format.name = name;
}
export function setExportFormatPerfix(options: ExportOptions, index: number, Prefix: ExportFormatNameingScheme) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) format.namingScheme = Prefix;
}

export function setExportFormatFileFormat(options: ExportOptions, index: number, fileFormat: ExportFileFormat) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) format.fileFormat = fileFormat;
}

export function setExportTrimTransparent(options: ExportOptions, trim: boolean) {
    options.trimTransparent = trim;
}

export function setExportCanvasBackground(options: ExportOptions, background: boolean) {
    options.canvasBackground = background;
}

export function setExportPreviewUnfold(options: ExportOptions, unfold: boolean) {
    options.unfold = unfold;
}
