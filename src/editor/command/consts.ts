export const PAGE_ATTR_ID = {
    name: "name",
    background: "background"
}

export const SHAPE_ATTR_ID = {
    x: "x", // 对象的位置，相对于父节点
    y: "y", // 对象的位置，相对于父节点
    size: "size", // 对象的大小 // deprecate
    width: "width",
    height: "height",
    hflip: "hflip",
    vflip: "vflip",
    rotate: "rotate",
    constrainerProportions: "constrainerProportions",
    name: "name",
    visible: "visible",
    lock: "lock",
    resizingConstraint: "resizingConstraint",
    radius: "radius", // rect radius
    backgroundColor: "backgroundColor",
    boolop: "boolop",
    isboolopshape: "isboolopshape",
    issymbolshape: "issymbolshape",
    fixedRadius: "fixedRadius",
    startMarkerType: "startMarkerType",
    endMarkerType: "endMarkerType",
    contactFrom: "contactFrom",
    contactTo: "contactTo",
    isEdited: "isEdited",
    // text shape
    textBehaviour: "textBehaviour",
    textVerAlign: "textVerAlign",
    textOrientation: "textOrientation",
    textTransform: "textTransform",

    // table
    tableTextColor: "tableTextColor",
    tableTextHighlight: "tableTextHighlight",
    tableTextFontName: "tableTextFontName",
    tableTextFontSize: "tableTextFontSize",
    tableTextVerAlign: "tableTextVerAlign",
    tableTextHorAlign: "tableTextHorAlign",
    tableTextMinLineHeight: "tableTextMinLineHeight",
    tableTextMaxLineHeight: "tableTextMaxLineHeight",
    tableTextKerning: "tableTextKerning",
    tableTextParaSpacing: "tableTextParaSpacing",
    tableTextUnderline: "tableTextUnderline",
    tableTextStrikethrough: "tableTextStrikethrough",
    tableTextBold: "tableTextBold",
    tableTextItalic: "tableTextItalic",
    tableTextTransform: "tableTextTransform",

    // table cell
    cellContentType: "cellContentType",
    cellContentText: "cellContentText",
    cellContentImage: "cellContentImage",
    cellSpan: "cellSpan",

    // override
    // override_stringValue: "override_stringValue",
    override_text: "override_text",
    override_image: "override_image",
    override_fills: "override_fills",
    override_borders: "override_borders",
    override_visible: "override_visible",
}

export const FILLS_ID = "fills"

export const FILLS_ATTR_ID = {
    enable: "enable",
    color: "color"
}

export const BORDER_ID = "border"

export const BORDER_ATTR_ID = {
    enable: "enable",
    color: "color",
    thickness: "thickness",
    position: "position",
    borderStyle: "borderStyle",
}
export const POINT_ID = "point"

export const TEXT_ATTR_ID = {
    color: "color",
    highlightColor: "highlightColor",
    fontSize: "fontSize",
    fontName: "fontName",
    paraKerning: "paraKerning",
    spanKerning: "spanKerning",
    spanTransform: "spanTransform",
    paraTransform: "paraTransform",
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikethrough",
    paraSpacing: "paraSpacing",
    textHorAlign: "textHorAlign",
    textMinLineheight: "textMinLineheight",
    textMaxLineheight: "textMaxLineheight",
    bulletNumbersType: "bulletNumbersType",
    bulletNumbersStart: "bulletNumbersStart",
    bulletNumbersBehavior: "bulletNumbersBehavior",
    indent: "indent",
}

export const POINTS_ID = "points"

export const POINTS_ATTR_ID = {
    from: "from",
    to: "to",
    point: "point",
}

export const TABLE_ATTR_ID = {
    rowHeight: "rowHeight",
    colWidth: "colWidth",
}

export const CONTACTS_ID = "contact"
