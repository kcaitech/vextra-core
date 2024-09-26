// util functions

const getCharCode = (char: string) => char.charCodeAt(0);
const char2Hex = (char: string) => `0x${getCharCode(char).toString(16)}`;
const getCharCodeArray = (str: string) => {
    let charCodeArr = [];
    for (let i = 0; i < str.length; i++) {
        charCodeArr.push(getCharCode(str[i]));
    }

    return charCodeArr;
};

const DOCAlphaCharArray = getCharCodeArray('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
const DOCDigitCharArray = getCharCodeArray('0123456789');
const DOCPuncCharArray = getCharCodeArray('([{·‘“〈《「『【〔〖（．［｛￡￥\"!),.:;?]}¨·ˇˉ―‖’”…∶、。〃々〉》」』】〕〗！＂＇），．：；？］｀｜｝～￠');
const DOCPlaceHolderCharArray = [
    0x0b,
    0x0d,	// 段落结束占位符
    0x0f,	// 分节
    0x0c,	// 页结束占位符
    0x0e,	// 栏结束占位符
    0x02,	// 脚注尾注的占位符
    0x05,	// 批注占位符
    0x08,	// 非嵌入式对象的占位符
    0x01,	// 嵌入式对象的占位符
    0x09,	// 制表符
    0x20,	// 空格
    0x13,	// 域开始符
    0x14,	// 域结束符
    0x15,
    0x28,	// 符号
    0x3000,	// 全角空格
    0x00A0,	// 无间断空格
    0x00,
    0x0000,	// 0也认为是空格
];

export enum DOCTxCharClass {
    CC_Ascii,
    CC_FarEast,
    CC_NoFarEast,
    CC_Shared,    // floating
    CC_Complex
};
export enum DOCTxUsrClass {
    SC_Ascii = DOCTxCharClass.CC_Ascii,
    SC_FarEast = DOCTxCharClass.CC_FarEast,
    SC_NoFarEast = DOCTxCharClass.CC_NoFarEast,
    SC_Shared = DOCTxCharClass.CC_Shared,
    SC_Complex = DOCTxCharClass.CC_Complex,
    __SC_SomeShared__,                // Internal use only
    __SC_Unknown__,
};

// The name "Usr" stands for "Unicode subrange"
export enum DOCTxUsrType {
    usrBasicLatin,				            //	0000 - 007F		基本拉丁语
    usrLatin1,						        //	0080 - 00FF		拉丁语- 1增补
    usrLatinXA, 					            //	0100 - 017F		拉丁语扩充- A
    usrLatinXB, 					            //	0180 - 024F		拉丁语扩展- B
    usrIPAExtensions,				            //	0250 - 02AF		IPA扩充
    usrSpacingModLetters,			            //	02B0 - 02FF		进格的修饰字母
    usrCombDiacritical, 			            //	0300 - 036F		组合的分音符号
    usrBasicGreek,					        //	0370 - 03FF		希腊语和科普特语
    usrGreekSymbolsCop,			            //
    usrCyrillic,					            //	0400 - 04FF		西里尔字母
    usrCyrillic2,					            //	0500 - 052F		西里尔字母增补
    usrArmenian,					            //	0530 - 058F		亚美尼亚语
    usrHebrewXA,					            //	0590 - 05FF		希伯来语
    usrBasicHebrew, 				            //
    usrBasicArabic, 				            //	0600 - 06FF		阿拉伯语
    usrArabicX, 					            //
    usrSyriac,						        //	0700 - 074F		叙利亚语
    usrThaana,						        //	0780 - 07BF		T h a a n a
    usrDevangari, 					        //	0900 - 097F		梵文字母
    usrBengali, 					            //	0980 - 09FF		孟加拉语
    usrGurmukhi,					            //	0A00 - 0A7F		果鲁穆奇字母
    usrGujarati,					            //	0A80 - 0AFF		古吉特拉语
    usrOriya,						            //	0B00 - 0B7F		奥里雅语
    usrTamil,						            //	0B80 - 0BFF		泰米尔语
    usrTelugu,						        //	0C00 - 0C7F		卢泰固语
    usrKannada,	    				        //	0C80 - 0CFF		卡纳达语
    usrMalayalam,					            //	0D00 - 0D7F		马拉雅拉姆语
    usrCeylon, 						        //	0D80 - 0DFF		锡兰语
    usrThai,						            //	0E00 - 0E7F		泰语
    usrLao, 						            //	0E80 - 0EFF		老挝语
    usrTibet,						            //	0F00 - 0FFF		西藏语
    usrBurma,						            //	1000 - 109F		缅甸语
    usrGeorgianExtended,			            //	10A0 - 10FF		乔治亚语
    usrBasicGeorgian,				            //
    usrHangulJamo,					        //	1100 - 11FF		Hangul Jamo

    usrEthiopia,					            //	1200 - 137F		埃塞俄比亚语
    usrCherokee,					            //	13A0 - 13FF		切罗基语
    usrJLDTZPY,						        //	1400 - 167F		统一的加拿大土著拼音
    usrOGZM,						            //	1680 - 169F		欧甘字母
    usrAncientryNorthEurope,		            //	16A0 - 16FF		古代北欧文字
    usrTJL,							        //	1700 - 171F		塔加拉语
    usrHanunoo,						        //	1720 - 173F		H a n u n o o
    usrBuhid,						            //	1740 - 175F		B u h i d
    usrTagbanwa,					            //	1760 - 177F		T a g b a n w a
    usrCambodia,					            //	1780 - 17FF		高棉语
    usrMongolia,					            //	1800 - 18AF		蒙古语

    usrLatinExtendedAdd,			            //	1E00 - 1EFF		拉丁文扩充附加
    usrGreekExtended,				            //	1F00 - 1FFF		希腊语扩充
    usrGeneralPunct,				            //	2000 - 206F		广义标点
    usrSuperAndSubscript,			            //	2070 - 209F		上标和下标
    usrCurrencySymbols, 			            //	20A0 - 20CF		货币符号
    usrCombDiacriticsS, 			            //	20D0 - 20FF		符号的组合分音记号
    usrLetterlikeSymbols,  			        //	2100 - 214F		类似字母的符号
    usrNumberForms, 				            //	2150 - 218F		数字形式
    usrArrows,  					            //	2190 - 21FF		箭头
    usrMathematicalOps, 			            //	2200 - 22FF		数学运算符
    usrMiscTechnical,				            //	2300 - 23FF		零杂技术用符号
    usrControlPictures,	    		        //	2400 - 243F		控制描述符
    usrOpticalCharRecog,			            //	2440 - 245F		光学字符识别
    usrEnclosedAlphanum,			            //	2460 - 24FF		带括号的字母数字
    usrBoxDrawing,					        //	2500 - 257F		Box Drawing
    usrBlockElements,				            //	2580 - 259F		方块元素
    usrGeometricShapes,			            //	25A0 - 25FF		几何图形
    usrMiscDingbats,				            //	2600 - 26FF		零杂符号
    usrDingbats,					            //	2700 - 27BF		装饰标志
    usrMiscMathSymbolsA,			            //	27C0 - 27EF		零杂数学符号- A
    usrArrowsA,						        //	27F0 - 27FF		增补箭头- A			        // mark: unicode5.0还未支持
    usrBraillePatterns,				        //	2800 - 28FF		盲文图案
    usrArrowsB,						        //	2900 - 297F		增补箭头- B
    usrMiscMathSymbolsB,			            //	2980 - 29FF		零杂数学符号- B
    usrMathematicalOps1,			            //	2A00 - 2AFF		增补数学运算符
    usrCJKRadicals1,				            //	2E80 - 2EFF		C J K偏旁增补
    usrKangxiRadicals,				        //	2F00 - 2FDF		康熙偏旁
    usrIdeographicDescription,		        //	2FF0 - 2FFF		表意描述字符
    usrCJKSymAndPunct,				        //	3000 - 303F		C J K符号和标点
    usrHiragana,					            //	3040 - 309F		平假名
    usrKatakana,					            //	30A0 - 30FF		片假名
    usrBopomofo,					            //	3100 - 312F		注音
    usrHangulCompatJamo,			            //	3130 - 318F		Hangul 兼容J a m o
    usrCJKMisc,					            //	3190 - 319F		K a n b u n
    __usrUnnamed10,					        //	31A0 - 31BF		注音扩充
    __usrUnnamed11,					        //	31F0 - 31FF		片假名语言扩充
    usrEnclosedCJKLtMnth,			            //	3200 - 32FF		带括号的C J K字母及月份
    usrCJKCompatibility,			            //	3300 - 33FF		C J K兼容
    usrCJKUnifiedIdeoExtendedA,		        //	3400 - 4DBF		C J K统一汉字扩充A
    usrCJKUnifiedIdeo,				        //	4E00 - 9FFF		C J K统一汉字
    __usrUnnamed13,					        //	A000 - A48F		彝语音节
    __usrUnnamed14,					        //	A490 - A4CF		彝语偏旁
    usrHangul,						        //	AC00 - D7AF		H a n g u l音节
    usrHighSurrogates,				        //	D800 - DB7F		高位代用
    __usrUnnamed16,					        //	DB80 - DBFF		专用高位代用
    usrLowSurrogates,				            //	DC00 - DFFF		低位代用
    usrPrivateUseArea,				        //	E000 - F8FF		专用区
    usrCJKCompatibilityIdeographs,	        //	F900 - FAFF		C J K兼容汉字
    usrAlphaPresentationForms,		        //	FB00 - FB4F		字母表示形式
    usrArabicPresentationFormsA,	            //	FB50 - FDFF		阿拉伯数字表示形式- A
    __usrUnnamed18,					        //	FE00 - FE0F		变调选择符
    usrCombiningHalfMarks,			        //	FE20 - FE2F		组合的半标记
    usrCJKCompatForms,				        //	FE30 - FE4F		C J K兼容形式
    usrSmallFormVariants,			            //	FE50 - FE6F		小写变体
    usrArabicPresentationFormsB,	            //	FE70 - FEFF		阿拉伯数字表示形式- B
    usrHFWidthForms,				            //	FF00 - FFEF		半宽和满宽形式（半形及全形）？
    usrSpecials,					            //	FFF0 - FFFF		特殊格式

    usrLinearBSyllabary,			            //	10000 - 1007F
    usrLinearBIdeograms,			            //  10080 - 100FF
    usrAegeanNumbers,				            //	10100 - 1013F
    usrAncientGreekNumbers,			        //	10140 - 1018F
    __usrUnnamed19,					        //	10190 - 102FF
    usrOldItalic,					            //	10300 - 1032F
    usrGothic,						        //	10330 -	1034F
    __usrUnnamed20,					        //	10350 - 1037F
    usrUgaritic,					            //	10380 - 1039F
    usrOldPersian,					        //	103A0 - 103DF
    __usrUnnamed21,					        //	103E0 - 103FF
    usrDeseret,						        //	10400 - 1044F
    usrShavian,						        //	10450 - 1047F
    usrOsmanya,						        //	10480 - 104AF
    __usrUnnamed22,					        //	104B0 - 107FF
    usrCypriotSyllabary,			            //	10800 - 1083F
    __usrUnnamed23,					        //	10840 - 108FF
    usrPhoenician,					        //	10900 - 1091F
    __usrUnnamed24,					        //	10920 - 109FF
    usrKharoshthi,					        //	10A00 - 10A5F
    __usrUnnamed25,					        //	10A60 - 11FFF
    usrCuneiform,					            //	12000 - 120FF
    __usrUnnamed26,					        //	12100 - 123FF
    usrCuneiformNumbersAndPunctuation,	    //	12400 - 1247F
    __usrUnnamed27,					        //	12480 - 1CFFF
    usrByzantineMusicalSymbols,		        //	1D000 - 1D0FF
    usrMusicalSymbols,				        //	1D100 - 1D1FF
    usrAncientGreekMusicalNotation,	        //	1D200 - 1D24F
    __usrUnnamed28,					        //	1D250 - 1D2FF
    usrTaiXuanJingSymbols,			        //	1D300 - 1D35F
    usrCountingRodNumerals,			        //	1D360 - 1D37F
    __usrUnnamed29,					        //	1D380 - 1D3FF
    usrMathematicalAlphanumericSymbols,	    //	1D400 - 1D7FF
    __usrUnnamed30,					        //	1D800 - 1FFFF
    usrCJKUnifiedIdeographsExtensionB,	    //	20000 - 2A6DF
    __usrUnnamed31,					        //	2A6E0 - 2F7FF
    usrCJKCompatibilityIdeographsSupplement,  //	2F800 - 2FA1F
    __usrUnnamed32,					        //	2FA20 - DFFFF
    usrTags,						            //	E0000 - E007F
    __usrUnnamed33,					        //	E0080 - EFFFF
    usrSupplementaryPrivateUseAreaA,	        //	F0000 - FFFFD
    //__usrUnnamed34,					        //	FFFFF - FFFFF

    usrSupplementaryPrivateUseAreaB,	        //	100000 - 10FFFD

    usrError = 0xffffffff
};


function createTxUsrItem(nType: DOCTxUsrType = 0, chFrom: number = 0, chTo: number = 0, nClass: DOCTxUsrClass = 0) {
    return { nType, chFrom, chTo, nClass };
}

type TxUsrTable_Item = { nType: DOCTxUsrType, chFrom: number, chTo: number, nClass: DOCTxUsrClass }

const { SC_Ascii, SC_FarEast, SC_NoFarEast, SC_Shared,
    SC_Complex, __SC_SomeShared__, __SC_Unknown__ } = DOCTxUsrClass;
const TxUsrTable: TxUsrTable_Item[] = [
    createTxUsrItem(DOCTxUsrType.usrBasicLatin, 0x0000, 0x007f, SC_Ascii),
    createTxUsrItem(DOCTxUsrType.usrLatin1, 0x0080, 0x00ff, __SC_SomeShared__),
    createTxUsrItem(DOCTxUsrType.usrLatinXA, 0x0100, 0x017f, __SC_SomeShared__),
    createTxUsrItem(DOCTxUsrType.usrLatinXB, 0x0180, 0x024f, __SC_SomeShared__),
    createTxUsrItem(DOCTxUsrType.usrIPAExtensions, 0x0250, 0x02af, __SC_SomeShared__),
    createTxUsrItem(DOCTxUsrType.usrSpacingModLetters, 0x02b0, 0x02ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrCombDiacritical, 0x0300, 0x036f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrBasicGreek, 0x0370, 0x03cf, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrGreekSymbolsCop, 0x03d0, 0x03ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrCyrillic, 0x0400, 0x04ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrCyrillic2, 0x0500, 0x052f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrArmenian, 0x0530, 0x058f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrHebrewXA, 0x0590, 0x05cf, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrBasicHebrew, 0x05d0, 0x05ff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrBasicArabic, 0x0600, 0x0652, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrArabicX, 0x0653, 0x06ff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrSyriac, 0x0700, 0x074F, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrThaana, 0x0780, 0x07BF, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrDevangari, 0x0900, 0x097f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrBengali, 0x0980, 0x09ff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrGurmukhi, 0x0a00, 0x0a7f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrGujarati, 0x0a80, 0x0aff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrOriya, 0x0b00, 0x0b7f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrTamil, 0x0b80, 0x0bff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrTelugu, 0x0c00, 0x0c7f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrKannada, 0x0c80, 0x0cff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrMalayalam, 0x0d00, 0x0d7f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrThai, 0x0e00, 0x0e7f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrLao, 0x0e80, 0x0eff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrTibet, 0x0f00, 0x0fff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrBurma, 0x1000, 0x109f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrGeorgianExtended, 0x10a0, 0x10cf, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrBasicGeorgian, 0x10d0, 0x10ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrHangulJamo, 0x1100, 0x11ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrEthiopia, 0x1200, 0x137f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrCherokee, 0x13a0, 0x13ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrJLDTZPY, 0x1400, 0x167f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrOGZM, 0x1680, 0x169f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrAncientryNorthEurope, 0x16a0, 0x16ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrTJL, 0x1700, 0x171f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrHanunoo, 0x1720, 0x173f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrBuhid, 0x1740, 0x175f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrTagbanwa, 0x1760, 0x177f, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrCambodia, 0x1780, 0x17ff, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrMongolia, 0x1800, 0x18af, SC_Complex),
    createTxUsrItem(DOCTxUsrType.usrLatinExtendedAdd, 0x1e00, 0x1eff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrGreekExtended, 0x1f00, 0x1fff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrGeneralPunct, 0x2000, 0x206f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrSuperAndSubscript, 0x2070, 0x209f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrCurrencySymbols, 0x20a0, 0x20cf, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrCombDiacriticsS, 0x20d0, 0x20ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrLetterlikeSymbols, 0x2100, 0x214f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrNumberForms, 0x2150, 0x218f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrArrows, 0x2190, 0x21ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrMathematicalOps, 0x2200, 0x22ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrMiscTechnical, 0x2300, 0x23ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrControlPictures, 0x2400, 0x243f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrOpticalCharRecog, 0x2440, 0x245f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrEnclosedAlphanum, 0x2460, 0x24ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrBoxDrawing, 0x2500, 0x257f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrBlockElements, 0x2580, 0x259f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrGeometricShapes, 0x25a0, 0x25ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrMiscDingbats, 0x2600, 0x26ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrDingbats, 0x2700, 0x27bf, SC_Shared),

    createTxUsrItem(DOCTxUsrType.usrMiscMathSymbolsA, 0x27c0, 0x27ef, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrArrowsA, 0x27f0, 0x27ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrBraillePatterns, 0x2800, 0x28ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrArrowsB, 0x2900, 0x297f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrMiscMathSymbolsB, 0x2980, 0x29ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrMathematicalOps1, 0x2a00, 0x2aff, SC_Shared),

    createTxUsrItem(DOCTxUsrType.usrCJKRadicals1, 0x2e80, 0x2eff, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrKangxiRadicals, 0x2f00, 0x2fdf, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrIdeographicDescription, 0x2ff0, 0x2fff, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.usrCJKSymAndPunct, 0x3000, 0x303f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrHiragana, 0x3040, 0x309f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrKatakana, 0x30a0, 0x30ff, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrBopomofo, 0x3100, 0x312f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrHangulCompatJamo, 0x3130, 0x318f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrCJKMisc, 0x3190, 0x319f, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed10, 0x31a0, 0x31bf, __SC_Unknown__),
    createTxUsrItem(DOCTxUsrType.__usrUnnamed11, 0x31f0, 0x31ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrEnclosedCJKLtMnth, 0x3200, 0x32ff, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrCJKCompatibility, 0x3300, 0x33ff, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.usrCJKUnifiedIdeoExtendedA, 0x3400, 0x4dbf, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.usrCJKUnifiedIdeo, 0x4e00, 0x9fff, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed13, 0xa000, 0xa48f, __SC_Unknown__),
    createTxUsrItem(DOCTxUsrType.__usrUnnamed14, 0xa490, 0xa4cf, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrHangul, 0xac00, 0xd7a3, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.usrHighSurrogates, 0xd800, 0xdb7f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.__usrUnnamed16, 0xdb80, 0xdbff, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrLowSurrogates, 0xdc00, 0xdfff, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.usrPrivateUseArea, 0xe000, 0xf8ff, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrCJKCompatibilityIdeographs, 0xf900, 0xfaff, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrAlphaPresentationForms, 0xfb00, 0xfb4f, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrArabicPresentationFormsA, 0xfb50, 0xfdff, SC_Shared),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed18, 0xfe00, 0xfe0f, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCombiningHalfMarks, 0xfe20, 0xfe2f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrCJKCompatForms, 0xfe30, 0xfe4f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrSmallFormVariants, 0xfe50, 0xfe6f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrArabicPresentationFormsB, 0xfe70, 0xfefe, SC_Shared),
    createTxUsrItem(DOCTxUsrType.usrHFWidthForms, 0xff00, 0xffef, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrSpecials, 0xfff0, 0xffff, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.usrLinearBSyllabary, 0x10000, 0x1007f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrLinearBIdeograms, 0x10080, 0x100ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrAegeanNumbers, 0x10100, 0x1013f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrAncientGreekNumbers, 0x10140, 0x1018f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed19, 0x10190, 0x102ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrOldItalic, 0x10300, 0x1032f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrGothic, 0x10330, 0x1034f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed20, 0x10350, 0x1037f, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrUgaritic, 0x10380, 0x1039f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrOldPersian, 0x103a0, 0x103df, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed21, 0x103e0, 0x103ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrDeseret, 0x10400, 0x1044f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrShavian, 0x10450, 0x1047f, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrOsmanya, 0x10480, 0x104af, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed22, 0x104b0, 0x107ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCypriotSyllabary, 0x10800, 0x1083f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed23, 0x10840, 0x108ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrPhoenician, 0x10900, 0x1091f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed24, 0x10920, 0x109ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrKharoshthi, 0x10a00, 0x10a5f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed25, 0x10a60, 0x11fff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCuneiform, 0x12000, 0x120ff, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed26, 0x12100, 0x123ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCuneiformNumbersAndPunctuation, 0x12400, 0x1247f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed27, 0x12480, 0x1cfff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrByzantineMusicalSymbols, 0x1d000, 0x1d0ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrMusicalSymbols, 0x1d100, 0x1d1ff, SC_NoFarEast),
    createTxUsrItem(DOCTxUsrType.usrAncientGreekMusicalNotation, 0x1d200, 0x1d24f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed28, 0x1d250, 0x1d2ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrTaiXuanJingSymbols, 0x1d300, 0x1d35f, SC_FarEast),
    createTxUsrItem(DOCTxUsrType.usrCountingRodNumerals, 0x1d360, 0x1d37f, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed29, 0x1d380, 0x1d3ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrMathematicalAlphanumericSymbols, 0x1d400, 0x1d7ff, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed30, 0x1d800, 0x1ffff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCJKUnifiedIdeographsExtensionB, 0x20000, 0x2a6df, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed31, 0x2a6e0, 0x2f7ff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrCJKCompatibilityIdeographsSupplement, 0x2f800, 0x2fa1f, SC_FarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed32, 0x2fa20, 0xdffff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrTags, 0xe0000, 0xe007f, SC_NoFarEast),

    createTxUsrItem(DOCTxUsrType.__usrUnnamed33, 0xe0080, 0xeffff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrSupplementaryPrivateUseAreaA, 0xf0000, 0xffffd, SC_NoFarEast),

    //createTxUsrItem(DOCTxUsrType.__usrUnnamed34,				            0xfffff, 0xfffff, __SC_Unknown__),

    createTxUsrItem(DOCTxUsrType.usrSupplementaryPrivateUseAreaB, 0x100000, 0x10fffd, SC_NoFarEast)
]
const s = DOCTxCharClass.CC_Shared,
    n = DOCTxCharClass.CC_NoFarEast;
const SomeSharedCharsTable: DOCTxCharClass[] = [
    // usrLatin1: 0xa0->0xff
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0080-0x008f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0090-0x009f
    n, s, n, n, s, n, n, s, s, n, s, n, n, s, n, s, // 0x00a0-0x00af
    s, s, s, s, s, n, s, s, s, s, s, n, s, s, s, s, // 0x00b0-0x00bf
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x00c0-0x00cf
    n, n, n, n, n, n, n, s, n, n, n, n, n, n, n, n, // 0x00d0-0x00df
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x00e0-0x00ef
    n, n, n, n, n, n, n, s, n, n, n, n, n, n, n, n, // 0x00f0-0x00ff
    // usrLatinXA: 0x100->0x17f
    s, s, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0100-0x010f
    n, n, n, s, n, n, n, n, n, n, n, s, n, n, n, n, // 0x0110-0x011f
    n, n, n, n, n, n, n, n, n, n, n, s, n, n, n, n, // 0x0120-0x012f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0130-0x013f
    n, n, n, n, s, n, n, n, s, n, n, n, n, s, n, n, // 0x0140-0x014f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0150-0x015f
    n, n, n, n, n, n, n, n, n, n, n, s, n, n, n, n, // 0x0160-0x016f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0170-0x017f
    // usrLatinXB: 0x180->0x24f
    // In usrLatinXB shared characters are
    // 0x192, 0x1FA, 0x1FB, 0x1FC, 0x1FD, 0x1FE and 0x1FF.
    // All other characters in this unicode subrange are considered "non-Far East".
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0180-0x018f
    n, n, s, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0190-0x019f  0x192
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x01a0-0x01af
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x01b0-0x01bf
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x01c0-0x01cf
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x01d0-0x01df
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x01e0-0x01ef
    n, n, n, n, n, n, n, n, n, n, s, s, s, s, s, s, // 0x01f0-0x01ff  0x1FA-0x1FF
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0200-0x020f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0210-0x021f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0220-0x022f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0230-0x023f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0240-0x024f
    // usrIPAExtensions: 0x250->0x2af
    // In usrIPAExtensions shared characters are 0x251, and 0x261.
    n, s, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0250-0x025f  0x251
    n, s, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0260-0x026f  0x261
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0270-0x027f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0280-0x028f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x0290-0x029f
    n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, // 0x02a0-0x02af
]

function checkUsrTable(start: number, end: number) {
    let index = start,
        nextIndex = start + 1;
    do {
        const it = TxUsrTable[index],
            itNext = TxUsrTable[nextIndex];
        if (it.chTo <= it.chFrom || itNext.chFrom <= it.chTo) return false;

        index = nextIndex;
        nextIndex++;
    } while (nextIndex !== end - 1)

    return true;
}


function isTxRealAsia(txUniRg: number): boolean {
    return txUniRg == DOCTxUsrType.usrCJKUnifiedIdeo ||                // 统一汉语
        txUniRg == DOCTxUsrType.usrCJKCompatibilityIdeographs ||    // 兼容汉语
        txUniRg == DOCTxUsrType.usrCJKCompatibility ||              // CJK兼容字符
        txUniRg == DOCTxUsrType.usrCJKUnifiedIdeoExtendedA ||       // CJK统一汉字扩充A
        txUniRg == DOCTxUsrType.usrHiragana ||                      // 平假名
        txUniRg == DOCTxUsrType.usrKatakana ||                      // 片假名
        txUniRg == DOCTxUsrType.usrBopomofo ||                      // 日文注音
        txUniRg == DOCTxUsrType.usrHangul ||                        // 朝鲜文
        txUniRg == DOCTxUsrType.usrHangulCompatJamo;                // 朝鲜文兼容字符
}

function isTxChinese(txUniRg: number): boolean {
    return txUniRg == DOCTxUsrType.usrCJKUnifiedIdeo ||                // 统一汉语
        txUniRg == DOCTxUsrType.usrCJKCompatibilityIdeographs ||    // 兼容汉语
        txUniRg == DOCTxUsrType.usrCJKCompatibility ||              // CJK兼容字符
        txUniRg == DOCTxUsrType.usrCJKUnifiedIdeoExtendedA;         // CJK统一汉字扩充A
}

function isTxComplex(txUniRg: number): boolean {
    const { usrHebrewXA, usrBasicHebrew, usrBasicArabic, usrArabicX,
        usrSyriac, usrThaana, usrThai, usrTamil, usrBengali,
        usrDevangari, usrGujarati, usrGurmukhi, usrKannada, usrOriya,
        usrTelugu, usrMalayalam, usrLao, usrBuhid, usrTagbanwa,
        usrCambodia, usrTibet, usrMongolia } = DOCTxUsrType;

    return txUniRg == usrHebrewXA ||        // 希伯来语
        txUniRg == usrBasicHebrew ||
        txUniRg == usrBasicArabic ||     // 阿拉伯语
        txUniRg == usrArabicX ||
        txUniRg == usrSyriac ||          // 叙利亚语(古代), Arabic-Syria(叙利亚)
        txUniRg == usrThaana ||          // Thaana(塔安那文), 马尔代夫语
        txUniRg == usrThai ||            // 泰语
        // Indic family of scripts -- begin --
        txUniRg == usrTamil ||           // 泰米尔语
        txUniRg == usrBengali ||         // 孟加拉语
        txUniRg == usrDevangari ||       // 梵文字母
        txUniRg == usrGujarati ||        // 古吉特拉
        txUniRg == usrGurmukhi ||        // 果鲁穆奇
        txUniRg == usrKannada ||         // 卡纳达语
        txUniRg == usrOriya ||           // 奥里雅语
        txUniRg == usrTelugu ||          // 卢泰固语

        // prev Supported complex scripts in Windows XP
        txUniRg == usrMalayalam ||       // 马拉雅拉姆语
        txUniRg == usrLao ||             // 老挝语
        txUniRg == usrBuhid ||           // Buhid
        txUniRg == usrTagbanwa ||        // Tagbanwa
        txUniRg == usrCambodia ||         // 高棉语
        txUniRg == usrTibet ||           // 西藏语
        txUniRg == usrMongolia;          // 蒙古语
    // Indic family of scripts -- end --
}

/**
 * 用于检测字符类型
 * 返回字符在Unicode Subrange中所属类型
 * @export
 * @class DOCCharTypeDetecter
 */
// export class DOCCharTypeDetecter {

/**
 * 判断某字符是否是“高位代用”字符，这种字符必须与与其连续的\
 * 下一个16bit组成一个字符。
 * @param {int} ch 字符
 * @returns Boolean
 * @memberof DOCCharTypeDetecter
 */
function _isHighSurrogate(ch: number) { return ch >= 0xD800 && ch <= 0xDB7f; }
/**
 * 判断某字符是否是“低位代用”字符，这种字符必须与\
 * 前一个16bit组成一个字符
 * @param {int} ch 字符
 * @returns Boolean
 * @memberof DOCCharTypeDetecter
 */
function _isLowSurrogate(ch: number) { return ch >= 0xDC00 && ch <= 0xDFFF; }

/**
 * 把两个“代用”字符转换为4字节Unicode
 * @param {int} chHiSurg
 * @param {int} chLoSurg
 * @returns 四字节的Unicode编码，返回0表示失败
 * @memberof DOCCharTypeDetecter
 */
function _surrogate2Unic4(chHiSurg: number, chLoSurg: number) {
    let result = 0;
    if (_isHighSurrogate(chHiSurg) && _isLowSurrogate(chLoSurg))
        result = (chHiSurg - 0xD800) * 0x400 + 0x10000 + (chLoSurg - 0xDC00);

    return result;
}
/**
 * 把4字节Unicode转换为“低位代用”字符
 * @param {int} ch
 * @returns “低位代用”字符，返回0标识失败
 * @memberof DOCCharTypeDetecter
 */
function _unic42LoSurrogate(ch: number) {
    let result = 0;
    if (ch > 0x10000)
        result = 0xDC00 + (ch - 0x10000) % 0x400;
    return result;
}
/**
 * 把4字节Unicode转换为“高位代用”字符
 * @param {int} ch
 * @returns “高位代用”字符，返回0标识失败
 * @memberof DOCCharTypeDetecter
 */
function _unic42HiSurrogate(ch: number) {
    let result = 0;
    if (ch > 0x10000)
        result = 0xD800 + (ch - 0x10000) / 0x400;
    return result;
}

function _getUsrItem(chLoSurg: number, chHiSurg = 0x0) {
    // const { TxUsrTable, checkUsrTable, createTxUsrItem } = this.TxUsrTable;
    const start = 0,
        end = TxUsrTable.length;

    const isTableFine = checkUsrTable(start, end);

    if (isTableFine) {
        let result = 0;

        result = _isHighSurrogate(chHiSurg) && _isLowSurrogate(chLoSurg)
            ? _surrogate2Unic4(chHiSurg, chLoSurg)
            : chLoSurg;
        let tempUsrItem = createTxUsrItem();
        tempUsrItem.chTo = result;

        let index = (function BSearchUpperBound(array, low, high, target, compare) {
            if (low > high || target > array[high]) return -1;

            let mid = Math.floor((low + high) / 2);
            while (low < high) {
                if (compare(mid, array, target))
                    high = mid;
                else
                    low = mid + 1;
                mid = Math.floor((low + high) / 2);
            }

            return mid;
        })(TxUsrTable, start, end, tempUsrItem, (index: number, table: TxUsrTable_Item[], target: TxUsrTable_Item) => table[index].chTo >= target.chTo);

        return index == -1 ? undefined : TxUsrTable[index];
    }
}

/**
 * 返回给定字符的字符类型(CC_Ascii, CC_FarEase ...)。
 * @param {string} ch 字符
 * @returns DOCTxCharClass.CC_Ascii, ...
 * @memberof DOCCharTypeDetecter
 */
function getCharClass(ch: number): DOCTxCharClass | undefined {
    // const { SomeSharedCharsTable } = TxUsrTable,
    const str = String.fromCharCode(ch);
    const pUsrItem = _getUsrItem(ch);

    if (!pUsrItem) {
        console.error(`---> 字符"${str}"(0x${ch})未定义Unicode Subrange!`);
        return DOCTxCharClass.CC_Ascii;
    }
    if (pUsrItem.nClass == DOCTxUsrClass.__SC_Unknown__) {
        console.error(`----> 字符"${str}"(0x${ch})所属UnicodeSubrange的CharClass属性为Unknown!`);
        return DOCTxCharClass.CC_Ascii;
    }
    if (pUsrItem.nClass != DOCTxUsrClass.__SC_SomeShared__) {
        return pUsrItem.nClass as number as DOCTxCharClass;
    }

    if (ch - 0x0080 < SomeSharedCharsTable.length) {
        return SomeSharedCharsTable[ch - 0x0080];
    }

    console.error(`---> 字符"${str}"(0x${ch})无法找到所属的Unicode Subrange`);
    return undefined;
}

/**
 * 返回给定的四字节字符的字符类型
 * @param {any} chLoSurg
 * @param {any} chHiSurg
 * @returns DOCTxCharClass.CC_Ascii, ...
 * @memberof DOCCharTypeDetecter
 */
function get4ByteCharClass(chLoSurg: number, chHiSurg: number): DOCTxCharClass | undefined {
    if (!chHiSurg) return getCharClass(chLoSurg);

    const pUsrItem = _getUsrItem(chLoSurg, chHiSurg);

    if (!pUsrItem) {
        console.error(`---> 字符(0x${chLoSurg})未定义Unicode Subrange!`);
        return DOCTxCharClass.CC_Ascii;
    }

    if (pUsrItem.nClass === DOCTxUsrClass.__SC_Unknown__) {
        console.error(`---> 字符(0x${chLoSurg})所属的Unicode Subrange的CharClass属性为Unknown!`);
        return DOCTxCharClass.CC_Ascii;
    }

    if (pUsrItem.nClass === DOCTxUsrClass.__SC_SomeShared__) {
        // TODO: 不处理
        return DOCTxCharClass.CC_Ascii;
    }

    return pUsrItem.nClass as number as DOCTxCharClass;
}

/**
 * 返回给定字符的Unicode Subrange Type
 * @param {any} ch
 * @returns DOCTxUsrType.basicLatin, ...
 * @memberof DOCCharTypeDetecter
 */
function getUsrType(ch: number) {
    const pUsrItem = _getUsrItem(ch);
    if (!pUsrItem) {
        return DOCTxUsrType.usrError;
    }

    return pUsrItem.nType;
}

// }


type UnicodeCharItem = {
    usrType?: DOCTxUsrType,
    charClass?: DOCTxCharClass,
    isRealAsia?: boolean,
    isChinese?: boolean,
    isComplex?: boolean,
    isAlpha?: boolean,
    isPlaceHolder?: boolean,
    isNum?: boolean,
    isPunc?: boolean,
    isDigit?: boolean
}
/**
 * 创建包含字符属性的对象
 * @param {int} chLoSurg
 * @param {int} chHiSurg
 * @returns Object
 * @memberof DOCCharTypeFastDetecter
 */
function _createUnicodeCharItem(chLoSurg: number, chHiSurg: number) {
    let item: UnicodeCharItem = {};
    item.usrType = _getUsrItem(chLoSurg, chHiSurg)?.nType;
    item.charClass = get4ByteCharClass(chLoSurg, chHiSurg);
    item.isRealAsia = item.usrType ? isTxRealAsia(item.usrType) : false;
    item.isChinese = item.usrType ? isTxChinese(item.usrType) : false;
    item.isComplex = item.usrType ? isTxComplex(item.usrType) : false;
    item.isAlpha = false;
    item.isNum = false;
    item.isPlaceHolder = false;
    item.isPunc = false;
    return item;
}

/**
 * 包含字符类型缓存，用于快速返回字符类型
 * 返回字符在Unicode Subrange中所属类型
 * @export
 * @class DOCCharTypeFastDetecter
 * @extends {DOCCharTypeDetecter}
 */
// class DOCCharTypeFastDetecter {
const _unicodeCharItemGroups: { items: UnicodeCharItem[], sItem: UnicodeCharItem }[] = []
const _groupBits: number = 8


/**
 * 检查[index<<8, (index+1)<<8]区间内是否包含指定字符
 * alpha/digit/punc/placeholder
 * @param {int} index
 * @returns Boolean
 * @memberof DOCCharTypeFastDetecter
 */
function _isContainSpecificChar(index: number) {
    const chStart = index << _groupBits;
    if (chStart >= 0x10000) return false;

    const chEnd = (index + 1) << _groupBits;
    for (let i = 0, l = DOCAlphaCharArray.length; i < l; i++) {
        const chAlpha = DOCAlphaCharArray[i];
        if (chStart <= chAlpha && chAlpha <= chEnd) return true;
    }
    for (let i = 0, l = DOCDigitCharArray.length; i < l; i++) {
        const chDigit = DOCDigitCharArray[i];
        if (chStart <= chDigit && chDigit <= chEnd) return true;
    }
    for (let i = 0, l = DOCPuncCharArray.length; i < l; i++) {
        const chPunc = DOCPuncCharArray[i];
        if (chStart <= chPunc && chPunc <= chEnd) return true;
    }
    for (let i = 0, l = DOCPlaceHolderCharArray.length; i < l; i++) {
        const chPlaceHolder = DOCPlaceHolderCharArray[i];
        if (chStart <= chPlaceHolder && chPlaceHolder <= chEnd) return true;
    }

    return false;
}

/**
 * 创建[index<<8, (index+1)<<8]区间内的所有字符属性对象组
 * @param {int} index
 * @returns Object
 * @memberof DOCCharTypeFastDetecter
 */
function _fillUnicodeCharItemsInGroup(index: number): { items: UnicodeCharItem[], sItem: UnicodeCharItem } {
    const g: { items: UnicodeCharItem[], sItem: UnicodeCharItem } = { items: [], sItem: {} };
    const n = 1 << _groupBits,
        chStart = index << _groupBits,
        chLoSurg = chStart >= 0x10000 ? _unic42LoSurrogate(chStart) : chStart,
        chHiSurg = chStart >= 0x10000 ? _unic42HiSurrogate(chStart) : 0;
    for (let i = 0; i < n; i++) {
        g.items[i] = _createUnicodeCharItem(chLoSurg + i, chHiSurg);
    }
    if (chHiSurg == 0) {
        const chEnd = chLoSurg + n - 1;
        for (let i = 0, l = DOCAlphaCharArray.length; i < l; i++) {
            const chAlpha = DOCAlphaCharArray[i];
            if (!g.items[chAlpha - chStart]) g.items[chAlpha - chStart] = {};
            g.items[chAlpha - chStart].isAlpha = chStart <= chAlpha && chAlpha <= chEnd;
        }
        for (let i = 0, l = DOCDigitCharArray.length; i < l; i++) {
            const chDigit = DOCDigitCharArray[i];
            if (!g.items[chDigit - chStart]) g.items[chDigit - chStart] = {};
            g.items[chDigit - chStart].isDigit = chStart <= chDigit && chDigit <= chEnd;
        }
        for (let i = 0, l = DOCPuncCharArray.length; i < l; i++) {
            const chPunc = DOCPuncCharArray[i];
            if (!g.items[chPunc - chStart]) g.items[chPunc - chStart] = {};
            g.items[chPunc - chStart].isPunc = chStart <= chPunc && chPunc <= chEnd;
        }
        for (let i = 0, l = DOCPlaceHolderCharArray.length; i < l; i++) {
            const chPlaceHolder = DOCPlaceHolderCharArray[i];
            if (!g.items[chPlaceHolder - chStart]) g.items[chPlaceHolder - chStart] = {};
            g.items[chPlaceHolder - chStart].isPlaceHolder = chStart <= chPlaceHolder && chPlaceHolder <= chEnd;
        }
    }

    return g;
}

/**
 * 创建指定index的字符属性对象组
 * 满足对象时创建区间内所有字符属性对象，不满足时创建指定字符对应属性对象
 * @param {int} index
 * @returns Object
 * @memberof DOCCharTypeFastDetecter
 */
function _createUnicodeCharItemGroup(index: number) {
    let g: { items: UnicodeCharItem[], sItem: UnicodeCharItem } = { items: [], sItem: {} };
    const chStart = index << _groupBits,
        chLoSurg = chStart > 0xffff ? _unic42LoSurrogate(chStart) : chStart,
        chHiSurg = chStart > 0xffff ? _unic42HiSurrogate(chStart) : 0;

    const usrItem = _getUsrItem(chLoSurg, chHiSurg);
    let isCreateGroupNeeded = usrItem && (usrItem.chTo < chStart + (1 << _groupBits) ||
        usrItem.nClass == DOCTxUsrClass.__SC_SomeShared__) ||
        _isContainSpecificChar(index);

    if (isCreateGroupNeeded) {
        g = _fillUnicodeCharItemsInGroup(index);
    } else {
        g.sItem = _createUnicodeCharItem(chLoSurg, chHiSurg);
    }

    return g;
}

/**
 * 获取指定字符的类型属性对象
 * @param {int} chLoSurg
 * @param {int} [chHiSurg=0x0]
 * @returns Object
 * @memberof DOCCharTypeFastDetecter
 */
export function getUnicodeCharItem(chLoSurg: number, chHiSurg = 0x0) {
    const ch = chHiSurg ? _surrogate2Unic4(chHiSurg, chLoSurg) : chLoSurg,
        index = ch >> _groupBits,
        subIndex = ch & ((1 << _groupBits) - 1);

    if (!_unicodeCharItemGroups[index]) _unicodeCharItemGroups[index] = _createUnicodeCharItemGroup(index);
    if (_unicodeCharItemGroups[index].items) return _unicodeCharItemGroups[index].items[subIndex];

    return _unicodeCharItemGroups[index].sItem;
}
// }
