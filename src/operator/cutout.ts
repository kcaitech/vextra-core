/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
import { BasicArray } from "../data/basic";
import { ExportFormat, ExportOptions, Shape } from "../data/shape";
import { ExportFileFormat, ExportFormatNameingScheme } from "../data/style";
import { BasicOp } from "./basicop";
import { Variable } from "../data/typesdefine";

export class CutoutOp {
    constructor(private _basicop: BasicOp) { }

    addExportFormat(shape: Shape | Variable, format: ExportFormat, index: number) {
    let options;
    if (shape instanceof Shape) {
        if (!shape.exportOptions) shape.exportOptions = new ExportOptions(new BasicArray(), 0, false, false, false, false);
        options = shape.exportOptions;
    } else {
        options = shape.value as ExportOptions;
    }
        return this._basicop.crdtArrayInsert(options.exportFormats, index, format);
    }

    addPageExportFormat(page: Page, format: ExportFormat, index: number) {
        return this.addExportFormat(page, format, index);
    }

    deleteExportFormatAt(options: ExportOptions, index: number) {
        return this._basicop.crdtArrayRemove(options.exportFormats, index);
    }

    deletePageExportFormatAt(options: ExportOptions, index: number) {
        return this.deleteExportFormatAt(options, index);
    }

    deleteExportFormats(options: ExportOptions, index: number, strength: number) {
        for (let i = index + strength - 1; i >= index; i--) {
            this._basicop.crdtArrayRemove(options.exportFormats, i);
        }
    }

    setExportFormatScale(options: ExportOptions, index: number, scale: number) {
        const format: ExportFormat = options.exportFormats[index];
        if (format) return this._basicop.crdtSetAttr(format, "scale", scale); // format.scale = scale;
    }
    setExportFormatName(options: ExportOptions, index: number, name: string) {
        const format: ExportFormat = options.exportFormats[index];
        if (format) return this._basicop.crdtSetAttr(format, "name", name); // format.name = name;
    }
    setExportFormatPerfix(options: ExportOptions, index: number, Prefix: ExportFormatNameingScheme) {
        const format: ExportFormat = options.exportFormats[index];
        if (format) return this._basicop.crdtSetAttr(format, "namingScheme", Prefix); // format.namingScheme = Prefix;
    }
    
    setExportFormatFileFormat(options: ExportOptions, index: number, fileFormat: ExportFileFormat) {
        const format: ExportFormat = options.exportFormats[index];
        if (format) return this._basicop.crdtSetAttr(format, "fileFormat", fileFormat); // format.fileFormat = fileFormat;
    }
    
    setExportTrimTransparent(options: ExportOptions, trim: boolean) {
        // options.trimTransparent = trim;
        return this._basicop.crdtSetAttr(options, "trimTransparent", trim);
    }
    
    setExportCanvasBackground(options: ExportOptions, background: boolean) {
        // options.canvasBackground = background;
        return this._basicop.crdtSetAttr(options, "canvasBackground", background);
    }
    
    setExportPreviewUnfold(options: ExportOptions, unfold: boolean) {
        // options.unfold = unfold;
        return this._basicop.crdtSetAttr(options, "unfold", unfold);
    }
    
    // page cutout
    setPageExportPreviewUnfold(options: ExportOptions, unfold: boolean) {
        // options.unfold = unfold;
        return this._basicop.crdtSetAttr(options, "unfold", unfold);
    }
    
    setPageExportFormatScale(options: ExportOptions, index: number, scale: number) {
        return this.setExportFormatScale(options, index, scale);
    }
    
    setPageExportFormatName(options: ExportOptions, index: number, name: string) {
        return this.setExportFormatName(options, index, name);
    }
    setPageExportFormatPerfix(options: ExportOptions, index: number, Prefix: ExportFormatNameingScheme) {
        return this.setExportFormatPerfix(options, index, Prefix);
    }
    
    setPageExportFormatFileFormat(options: ExportOptions, index: number, fileFormat: ExportFileFormat) {
        return this.setExportFormatFileFormat(options, index, fileFormat);
    }
}
