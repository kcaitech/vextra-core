/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../../data/page";
import { BasicArray } from "../../data/basic";
import { ExportFormat, ExportOptions, Shape } from "../../data/shape";
import { ExportFileFormat, ExportFormatNameingScheme } from "../../data/style";
import { crdtArrayInsert, crdtArrayRemove, crdtSetAttr } from "./basic";
import { ArrayMoveOpRecord } from "../basic/crdt";
import { Variable } from "../../data/typesdefine";

export function addExportFormat(shape: Shape | Variable, format: ExportFormat, index: number) {
    let options;
    if (shape instanceof Shape) {
        if (!shape.exportOptions) shape.exportOptions = new ExportOptions(new BasicArray(), 0, false, false, false, false);
        options = shape.exportOptions;
    } else {
        options = shape.value as ExportOptions;
    }
    return crdtArrayInsert(options.exportFormats, index, format);
}
export function addPageExportFormat(page: Page, format: ExportFormat, index: number) {
    return addExportFormat(page, format, index);
}

export function deleteExportFormatAt(options: ExportOptions, index: number) {
    return crdtArrayRemove(options.exportFormats, index);
}
export function deletePageExportFormatAt(options: ExportOptions, index: number) {
    return deleteExportFormatAt(options, index);
}
export function deleteExportFormats(options: ExportOptions, index: number, strength: number) {
    const ops: ArrayMoveOpRecord[] = [];
    for (let i = index + strength - 1; i >= index; i--) {
        const op = crdtArrayRemove(options.exportFormats, i);
        if (op) ops.push(op);
    }
    return ops;
}

export function setExportFormatScale(options: ExportOptions, index: number, scale: number) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) return crdtSetAttr(format, "scale", scale); // format.scale = scale;
}

export function setExportFormatName(options: ExportOptions, index: number, name: string) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) return crdtSetAttr(format, "name", name); // format.name = name;
}
export function setExportFormatPerfix(options: ExportOptions, index: number, Prefix: ExportFormatNameingScheme) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) return crdtSetAttr(format, "namingScheme", Prefix); // format.namingScheme = Prefix;
}

export function setExportFormatFileFormat(options: ExportOptions, index: number, fileFormat: ExportFileFormat) {
    const format: ExportFormat = options.exportFormats[index];
    if (format) return crdtSetAttr(format, "fileFormat", fileFormat); // format.fileFormat = fileFormat;
}

export function setExportTrimTransparent(options: ExportOptions, trim: boolean) {
    // options.trimTransparent = trim;
    return crdtSetAttr(options, "trimTransparent", trim);
}

export function setExportCanvasBackground(options: ExportOptions, background: boolean) {
    // options.canvasBackground = background;
    return crdtSetAttr(options, "canvasBackground", background);
}

export function setExportPreviewUnfold(options: ExportOptions, unfold: boolean) {
    // options.unfold = unfold;
    return crdtSetAttr(options, "unfold", unfold);
}

// page cutout
export function setPageExportPreviewUnfold(options: ExportOptions, unfold: boolean) {
    // options.unfold = unfold;
    return crdtSetAttr(options, "unfold", unfold);
}

export function setPageExportFormatScale(options: ExportOptions, index: number, scale: number) {
    return setExportFormatScale(options, index, scale);
}

export function setPageExportFormatName(options: ExportOptions, index: number, name: string) {
    return setExportFormatName(options, index, name);
}
export function setPageExportFormatPerfix(options: ExportOptions, index: number, Prefix: ExportFormatNameingScheme) {
    return setExportFormatPerfix(options, index, Prefix);
}

export function setPageExportFormatFileFormat(options: ExportOptions, index: number, fileFormat: ExportFileFormat) {
    return setExportFormatFileFormat(options, index, fileFormat);
}