// 使用字体类型（范围）
export const DOCTypoFontHint = {
    Ansi: 0,
    FarEast: 1,
    Complex: 2
};

// 占位符
export const DOCTypoPlaceholder = {
    Null: 0x00,
    Return: 0x0a,                  // 换行符
    EndLine: 0x0b,                 // 软回车换行符,
    EndPara: 0x0d,                 // 段落结束占位符

    EndSection: 0x0c,              // 分节
    EndPage: 0x0f,                 // 页结束占位符

    EndColumn: 0x0e,               // 栏结束占位符
    FootNote: 0x02,                // 脚注尾注的占位符
    Comment: 0x05,                 // 批注占位符
    Drawing: 0x08,                 // 非嵌入式对象的占位符
    Embed: 0x01,                   // 嵌入式对象的占位符
    Tab: 0x09,                     // 制表符
    Space: 0x20,                   // 空格
    FieldBegin: 0x13,              // 域开始符
    FieldSep: 0x14,                // 域分割符
    FieldEnd: 0x15,                // 域结束符
    TextSymbol: 0x28,              // 符号
    EndCell: 0x07,
    ControlBegin: 0x03,            // 控件开始占位符
    ControlEnd: 0x04,              // 控件结束占位符
    MathFunction: 0x1a,            // 公式函数占位符
    MathArgEnd: 0x1b,              // 公式参数占位符

    FullWidthSpace: 0x3000,        // 全角空格
    Zero: 0x0000,                  // special时表示当前页码，否则为*号
    NonBreakSpace: 0x00A0,         // 无间断空格
    ContentNodeBegin: 0x3c,        // CONTENTNODE开始符（可能是文档部件）
    ContentNodeEnd: 0x3e,          // CONTENTNODE开始符

    OptionHyphen: 0x001F,          // 可选连字符
    NoWidthOptionalBreak: 0x200C,  // 零宽度空格
    NoWidthNoBreak: 0x200D,        // 零宽度非间断空格
    ZeroReplace: 0x002A,           // 编码为0的非special字符
    PopDirFormatting: 0x202C       // POP DIRECTIONAL FORMATTING
};

// 网格模式标记
export const DOCTypoGridModeFlags = {
    Horizontal: 0x01,
    Vertical: 0x02,
    SnapText: 0x04
};

// 网格模式
export const DOCTypoGridMode = {
    None: 0,
    CharAndLine: 1,
    LineOnly: 2,
    SnapText: 3
};

// 制表位类型
const DOCTypoCCTab = 0x1100;
export const DOCTypoTabRngCode = {
	Left: DOCTypoCCTab | 0,
	Center: DOCTypoCCTab | 1,
	Right: DOCTypoCCTab | 2,
	Decimal: DOCTypoCCTab | 3
};

// Char Flag相关
export const DOCTypoCharRngFlagBit = {
    Unknown: 0x00,
	Normal: 0x01,
	SharedNormal: 0x02,
	FarEast: 0x03,
	SharedFarEast: 0x04,
	Complex: 0x05,
	Space: 0x06,
	Tab: 0x07,
	LineBreak: 0x08,
	ParaBreak: 0x09,
	SepBreak: 0x0A,
	ColBreak: 0x0B,
	Drawing: 0x0C,
	EmbedDrawing: 0x0D,
	Zero: 0x0E,
	ForceLineEnd: 0x0F,
};

export const DOCTypoCharFlagBit = {
    Hidden: (0x01 << 4),			        //隐藏字符

	Box: (0x01 << 5),			            //charbox

	Spec: (0x01 << 6),			            //特殊字符

	HiddenField: (0x01 << 7),			    //隐藏域　

	//为点击测试预留的
	HitTestHyperlink: (0x01 << 8),			//超链接

	LineFST: (0x01 << 9),			        //行内的第一个字符

	// 下面是加入复杂文字后增加的
	NotCharStop: (0x01 << 10),			    // not fCharStop: @mark, char stop 和 cluster start 似乎有重复含义, todo:

	WordStop: (0x01 << 11),			        // fWordStop

	NotClusterStart: (0x01 << 12),		    // not fClusterStart

	RTL: (0x01 << 13),			            // fRTL

	LayoutRTL: (0x01 << 14),			    // fLayoutRTL

	Complex: (0x01 << 15),			        // fComplex

	// 从SCRIPT_PROPERTIES里取得的一些复杂文字的特殊性质
	NeedWordBreaking: (0x01 << 16),		    // fNeedsWordBreaking, 设置到 char 上

	Field: (0x01 << 17),

	Invalid: (0x01 << 18),			        // Glyph信息无效 (被废除或未初始化)

	EmphasisMark: (0x01 << 19),			    // 有着重号

	AboveTextEmphasisMark: (0x01 << 20),	// 着重号在字符的上方, 没设表示在下方

	OleEmphasisMark: (0x01 << 21),		    // ole 嵌入式对象

	LowerAlphaSmallCaps: (0x01 << 22),	    // "小型大写字母"下的小写字母

	TextInput: (0x01 << 23),                // 文字型窗体域

	FormFieldMark: (0x01 << 24),            // 显示域代码时，窗体域的0x13或0x15字符

	TOCField: (0x01 << 25),                 // 是否在目录域中

	AsianLayout: (0x01 << 26), 		        // 是否位于中文版式中

	VertInfo: (0X01 << 27),			        // 是否在行排时候重新计算glyf高度相关信息

	Kerning: (0x01 << 28),			        // 是否因为后面的字符而有Kerning

	// 只使用CHAR_FLAG_VERTINFO_BIT
	// CHAR_FLAG_CALCINFO_BIT: (0X01 << 29),// 是否在行排时候重新计算glyf高度相关信息
	CJKFont: (0X01 << 29),			        // 是否使用了中文字体

    // TODO: js位操作仅支持32位运算
	SpecHidden: (0x01 << 30),               // 隐藏特殊字符
	//Collapse: (0x01 << 30),			        //字符被折叠隐藏(大纲版式下用)

	PuncAdj: (0x01 << 31),			        // 标点被压缩
};

export const DOCParaType = {
    ParaType_Normal: 0,
    ParaType_TableCell: 1,
    ParaType_TableRow: 2,
    ParaType_TextFrame: 3,
    ParaType_TableDiagonal: 4
};

export const DOCPeripheralParaType = {
    PeripheralParaType_Normal: 0,
    PeripheralParaType_Frame: 1,
    PeripheralParaType_Table: 2,
    PeripheralParaType_Formula: 4
};

export const DOCModifyType = {
    Insert: 0,
    Delete: 1,
    SetProp: 2
};

export const DOCTemplateType = {
    Normal: 0,          // 一般文档
    Summary: 1,         // 总结模板
    Resume: 2,          // 简历模板
    PalaceMuseum: 3,    // 故宫模板
    WeeklyReport: 4     // 周报
};

export const DOCTemplateContentType = {
    Other: 0,           // 其他
    ContentBlock: 1,    // 模块
    ContentField: 2,    // 模块内字段
    ContentItem: 3      // 模块内内容项
};

export const DOCCompareType = {
    CMP_LT: -1,
    CMP_EQ: 0,
    CMP_GT: 1,
};

export const DOCContentCtrlType = {
    wpsContentRichText: 0,
    wpsContentPureText: 1,
    wpsContentPicture: 2,
    wpsContentComboBox: 3,
    wpsContentDropdownList: 4,
    wpsContentBuildingBlock: 5,
    wpsContentDate: 6,
    wpsContentGroup: 7,
    wpsContentCheckBox: 8,
    wpsContentRepeatSec: 9,
    wpsContentDocpartObj: 10,
    wpsContentUnknown: 11,
};

export const DocProtType = {
    txDocProtNone: 0,
    txDocProtReadOnly: 1,
    txDocProtRevisions: 2,
    txDocProtKrmReadOnly: 3,
    txDocProtForm: 4,
    txDocProtComment: 5,
}

export const DOCSaveFormat = {
    wpsFormatDocument: 0,
    wpsFormatTemplate: 1,
    wpsFormatText: 2,
    wpsFormatTextLineBreaks: 3,
    wpsFormatDOSText: 4,
    wpsFormatDOSTextLineBreaks: 5,
    wpsFormatRTF: 6,
    wpsFormatUnicodeText: 7,
    wpsFormatEncodedText: 7,
    wpsFormatHTML: 8,
    wpsFormatWebArchive: 9,
    wpsFormatFilteredHTML: 10,
    wpsFormatXML: 11,
    wpsFormatXMLDocument: 12,
    wpsFormatXMLDocumentMacroEnabled: 13,
    wpsFormatXMLTemplate: 14,
    wpsFormatXMLTemplateMacroEnabled: 15,
    wpsFormatFlatXML: 19,
    wpsFormatFlatXMLMacroEnabled: 20,
    wpsFormatFlatXMLTemplate: 21,
    wpsFormatFlatXMLTemplateMacroEnabled: 22,
    wpsWdFormatDocument: 72,
    wpsWdFormatTemplate: 73,
    wpsFormatCustom: 100,
    wpsFormatUOF10: 111,
    wpsFormatUOF20: 112,
    wpsFormatOFD: 113,
};
