/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { getUnicodeCharItem } from "./char_unicode";
import { DOCTypoPlaceholder } from "./chat_code";

const zh_CN = { language: "zh-CN", altLanguage: "en-US" };
Object.freeze(zh_CN);
const en_US = { language: "en-US", altLanguage: "zh-CN" };
Object.freeze(en_US);

const en_pnct = ',./<>?;\':"[]{}\\|=-_+)(*&^%$#@!~`'
const cn_pnct = '，。／《》？；’‘”“：｛｝［］＼｜=+-——）（＊&……％￥#@！～「」『』·、'

function regit_func(pncts: string) {
    let _map: { [key: string]: boolean } = {};
    for (let i = 0, len = pncts.length; i < len; ++i) {
        _map[pncts[i]] = true;
    }
    return _map;
}
const is_cn_punc = regit_func(cn_pnct);
const is_en_punc = regit_func(en_pnct);


export namespace CharCode {

    export function isNum(char: string) {
        return (char >= "0" && char <= "9");
    }

    export function isLetter(char: string) {
        return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");
    }

    export function isChinese(char: string) {
        return (char >= "\u4e00" && char <= "\u9fbf" || char >= "\uf900" && char <= "\ufaff" || char >= "\u3400" && char <= "\u4dbf");
    }

    export function isJapanese(char: string) {
        return (char >= "\u3040" && char <= "\u309f" || char >= "\u30a0" && char <= "\u30ff" || char >= "\u31f0" && char <= "\u31ff");
    }

    // export function isSpace(char: string) {
    //     return char === " ";
    // }

    // 标点符号
    export function isPunctuation(char: string) {
        return is_cn_punc[char] === true || is_en_punc[char] === true;
    }

    export function getLangCode(char: string) {
        if (isChinese(char) || is_cn_punc[char] === true) {
            return zh_CN;
        }
        if (isLetter(char) || isNum(char) || is_en_punc[char] === true) {
            return en_US;
        }
        return undefined;
    }

    export function  isSpecialAlpha(ch: number) {
        // 非Alpha字符，但在处理中英文间距时仍需当做西文处理
        return ch == 0x0416;
    }

    export function  isRealAsia(ch: number) {
        return getUnicodeCharItem(ch).isRealAsia;
    }

    export function  isComplex(ch: number) {
        return getUnicodeCharItem(ch).isComplex;
    }

    export function  isPunc(ch: number) {
        return getUnicodeCharItem(ch).isPunc || isJPNSpecPunc(ch);
    }

    // 从HeadPunc中剔除了0x00B7和0xFF0E
	// 这两个标点既是首标点又是尾标点，有时候要特殊考虑
    export function  isPureHeadPunc(ch: number) {
        return '$([{£¥‘“〈《「『【〔〖〝﹙﹛﹝＄（［｛￡￥'.indexOf(String.fromCharCode(ch)) > -1;
    }

    // 实际上是由应用程序定义
    export function  isHeadPunc(ch: number) {
        return '$([{£¥·‘“〈《「『【〔〖〝﹙﹛﹝＄（．［｛￡￥'.indexOf(String.fromCharCode(ch)) > -1;
    }

    export function  isTailPunc(ch: number) {
        return ch == DOCTypoPlaceholder.NonBreakSpace ||
               '!%),.:;>?]}¢¨°·ˇˉ―‖’”…‰′″›℃∶、。〃々〉》」』】〕〗〞︶︺︾﹀﹄﹚﹜﹞！＂％＇），．：；？］｀｜｝～￠'.indexOf(String.fromCharCode(ch)) > -1 ||
               isJPNSpecPunc(ch);
    }

    export function  isGenkohangPunc(ch: number) {
        return isTailPunc(ch);
    }

    // export function  isHangPunc(ch: number, lgid, isGenkoEnable: boolean, isFELineBreak11: boolean) {
    //     if (isGenkoEnable) {
    //         return isGenkohangPunc(ch);
    //     }

    //     let langId = DOCWinNTHandler.getPrimaryLangID(lgid);
    //     switch(langId) {
    //         case DOCPrimaryLangID.JAPANESE:
    //             return ',.!),:;?]}、，。'.indexOf(String.fromCharCode(ch)) > -1;
    //         case DOCPrimaryLangID.KOREAN:
    //             return ',.!),:;?]}，'.indexOf(String.fromCharCode(ch)) > -1;
    //         case DOCPrimaryLangID.CHINESE:
    //         {
    //             if (!isFELineBreak11) {
    //                 return '!),.:;?]}￠ˇ’”∶、。〉》」』】〕〗！＂＇），．·：；'.indexOf(String.fromCharCode(ch)) > -1;
    //             } else {
    //                 return ',.!),:;?]}'.indexOf(String.fromCharCode(ch)) > -1;
    //             }
    //         }
    //         default:
    //             return isDefaultHangPunc(ch, isFELineBreak11);
    //     }
    // }

    export function  isDefaultHangPunc(ch: number, isFELineBreak11: boolean) {
		if (!isFELineBreak11) {
            return '!),.:;?]}￠ˇ’”∶＂'.indexOf(String.fromCharCode(ch)) > -1; 
        } else {
            return ',.!),:;?]}'.indexOf(String.fromCharCode(ch)) > -1; 
        }
    }

    export function  isHeadCompressPunc(ch: number) {
        return getUnicodeCharItem(ch).isPunc &&
               '‘“〈《「『【〔〖（［｛'.indexOf(String.fromCharCode(ch)) > -1;
    }

    export function  isTailCompressPunc(ch: number) {
        return getUnicodeCharItem(ch).isPunc &&
               '·’”∶、。〃〉》」』】〕〗！｝］＇），．：；'.indexOf(String.fromCharCode(ch)) > -1;
    }

    export function  isCompressPunc(ch: number) {
        return isTailCompressPunc(ch) || isHeadCompressPunc(ch);
    }

    // 0x30FB: 在行压缩时候能被压缩，不能被标点压缩，可以出发Head Compress Punc
    // 和Tail Compress Punch的标点压缩
    export function  isJPNSpecPunc(ch: number) {
        return 0x30FB == ch;
    }

    export function  isMathFunction(ch: number) {
        return ch == DOCTypoPlaceholder.MathFunction;
    }

    export function  isMathArgEnd(ch: number) {
        return ch == DOCTypoPlaceholder.MathArgEnd;
    }

    export function  isAlpha(ch: number) {
        return (ch >= 'a'.charCodeAt(0) && ch <= 'z'.charCodeAt(0)) ||
               (ch >= 'A'.charCodeAt(0) && ch <= 'Z'.charCodeAt(0));
    }

    export function  isLowerAlpha(ch: number) {
        return ch >= 'a'.charCodeAt(0) && ch <= 'z'.charCodeAt(0);
    }

    export function  isUpperAlpha(ch: number) {
        return ch >= 'A'.charCodeAt(0) && ch <= 'Z'.charCodeAt(0);
    }

    export function  isTab(ch: number) {
        return ch == DOCTypoPlaceholder.Tab;
    }

    
    export function  isSpace(ch: number) {
        return getUnicodeCharItem(ch).isPlaceHolder &&
               ch == DOCTypoPlaceholder.Space ||
               ch == DOCTypoPlaceholder.FullWidthSpace ||
               ch == DOCTypoPlaceholder.NonBreakSpace;
    }

    export function  isFullWidthSpace(ch: number) {
        return ch == DOCTypoPlaceholder.FullWidthSpace;
    }

    export function  isNormalSpace(ch: number) {
        return ch == DOCTypoPlaceholder.Space;
    }

    export function  isNonBreakSpace(ch: number) {
        return ch == DOCTypoPlaceholder.NonBreakSpace;
    }

    export function  isSimpleLineBreak(ch: number) {
        return ch == DOCTypoPlaceholder.EndLine ||
               ch == DOCTypoPlaceholder.EndPara;
    }

    export function isLineBreak(ch: number) {
        return ch == DOCTypoPlaceholder.EndPara ||
               ch == DOCTypoPlaceholder.EndPage ||
               ch == DOCTypoPlaceholder.EndLine ||
               ch == DOCTypoPlaceholder.EndSection ||
               ch == DOCTypoPlaceholder.EndColumn ||
               ch == DOCTypoPlaceholder.EndCell;
    }
}

/*
【Unicode 码表】

0000-007F：C0控制符及基本拉丁文 (C0 Control and Basic Latin)
0080-00FF：C1控制符及拉丁文补充-1 (C1 Control and Latin 1 Supplement) 
0100-017F：拉丁文扩展-A (Latin Extended-A) 
0180-024F：拉丁文扩展-B (Latin Extended-B) 
0250-02AF：国际音标扩展 (IPA Extensions) 
02B0-02FF：空白修饰字母 (Spacing Modifiers) 
0300-036F：结合用读音符号 (Combining Diacritics Marks) 
0370-03FF：希腊文及科普特文 (Greek and Coptic) 
0400-04FF：西里尔字母 (Cyrillic) 
0500-052F：西里尔字母补充 (Cyrillic Supplement) 
0530-058F：亚美尼亚语 (Armenian) 
0590-05FF：希伯来文 (Hebrew) 
0600-06FF：阿拉伯文 (Arabic) 
0700-074F：叙利亚文 (Syriac) 
0750-077F：阿拉伯文补充 (Arabic Supplement) 
0780-07BF：马尔代夫语 (Thaana) 
07C0-077F：西非書面語言 (N'Ko) 
0800-085F：阿维斯塔语及巴列维语 (Avestan and Pahlavi) 
0860-087F：Mandaic 
0880-08AF：撒马利亚语 (Samaritan) 
0900-097F：天城文书 (Devanagari) 
0980-09FF：孟加拉语 (Bengali) 
0A00-0A7F：锡克教文 (Gurmukhi) 
0A80-0AFF：古吉拉特文 (Gujarati) 
0B00-0B7F：奥里亚文 (Oriya) 
0B80-0BFF：泰米尔文 (Tamil) 
0C00-0C7F：泰卢固文 (Telugu) 
0C80-0CFF：卡纳达文 (Kannada) 
0D00-0D7F：德拉维族语 (Malayalam) 
0D80-0DFF：僧伽罗语 (Sinhala) 
0E00-0E7F：泰文 (Thai) 
0E80-0EFF：老挝文 (Lao) 
0F00-0FFF：藏文 (Tibetan) 
1000-109F：缅甸语 (Myanmar) 
10A0-10FF：格鲁吉亚语 (Georgian) 
1100-11FF：朝鲜文 (Hangul Jamo) 
1200-137F：埃塞俄比亚语 (Ethiopic) 
1380-139F：埃塞俄比亚语补充 (Ethiopic Supplement) 
13A0-13FF：切罗基语 (Cherokee) 
1400-167F：统一加拿大土著语音节 (Unified Canadian Aboriginal Syllabics) 
1680-169F：欧甘字母 (Ogham) 
16A0-16FF：如尼文 (Runic) 
1700-171F：塔加拉语 (Tagalog) 
1720-173F：Hanunóo 
1740-175F：Buhid 
1760-177F：Tagbanwa 
1740-175F：Buhid 
1760-177F：Tagbanwa 
1780-17FF：高棉语 (Khmer) 
1800-18AF：蒙古文 (Mongolian) 
18B0-18FF：Cham 
1900-194F：Limbu 
1950-197F：德宏泰语 (Tai Le) 
1980-19DF：新傣仂语 (New Tai Lue) 
19E0-19FF：高棉语记号 (Kmer Symbols) 
1A00-1A1F：Buginese 
1A20-1A5F：Batak 
1A80-1AEF：Lanna 
1B00-1B7F：巴厘语 (Balinese) 
1B80-1BB0：巽他语 (Sundanese) 
1BC0-1BFF：Pahawh Hmong 
1C00-1C4F：雷布查语(Lepcha) 
1C50-1C7F：Ol Chiki 
1C80-1CDF：曼尼普尔语 (Meithei/Manipuri) 
1D00-1D7F：语音学扩展 (Phonetic Extensions) 
1D80-1DBF：语音学扩展补充 (Phonetic Extensions Supplement) 
1DC0-1DFF：结合用读音符号补充 (Combining Diacritics Marks Supplement) 
1E00-1EFF：拉丁文扩充附加 (Latin Extended Additional) 
1F00-1FFF：希腊语扩充 (Greek Extended) 
2000-206F：常用标点 (General Punctuation) 
2070-209F：上标及下标 (Superscripts and Subscripts) 
20A0-20CF：货币符号 (Currency Symbols) 
20D0-20FF：组合用记号 (Combining Diacritics Marks for Symbols) 
2100-214F：字母式符号 (Letterlike Symbols) 
2150-218F：数字形式 (Number Form) 
2190-21FF：箭头 (Arrows) 
2200-22FF：数学运算符 (Mathematical Operator) 
2300-23FF：杂项工业符号 (Miscellaneous Technical) 
2400-243F：控制图片 (Control Pictures) 
2440-245F：光学识别符 (Optical Character Recognition) 
2460-24FF：封闭式字母数字 (Enclosed Alphanumerics) 
2500-257F：制表符 (Box Drawing) 
2580-259F：方块元素 (Block Element) 
25A0-25FF：几何图形 (Geometric Shapes) 
2600-26FF：杂项符号 (Miscellaneous Symbols) 
2700-27BF：印刷符号 (Dingbats) 
27C0-27EF：杂项数学符号-A (Miscellaneous Mathematical Symbols-A) 
27F0-27FF：追加箭头-A (Supplemental Arrows-A) 
2800-28FF：盲文点字模型 (Braille Patterns) 
2900-297F：追加箭头-B (Supplemental Arrows-B) 
2980-29FF：杂项数学符号-B (Miscellaneous Mathematical Symbols-B) 
2A00-2AFF：追加数学运算符 (Supplemental Mathematical Operator) 
2B00-2BFF：杂项符号和箭头 (Miscellaneous Symbols and Arrows) 
2C00-2C5F：格拉哥里字母 (Glagolitic) 
2C60-2C7F：拉丁文扩展-C (Latin Extended-C) 
2C80-2CFF：古埃及语 (Coptic) 
2D00-2D2F：格鲁吉亚语补充 (Georgian Supplement) 
2D30-2D7F：提非纳文 (Tifinagh) 
2D80-2DDF：埃塞俄比亚语扩展 (Ethiopic Extended) 
2E00-2E7F：追加标点 (Supplemental Punctuation) 
2E80-2EFF：CJK 部首补充 (CJK Radicals Supplement) 
2F00-2FDF：康熙字典部首 (Kangxi Radicals) 
2FF0-2FFF：表意文字描述符 (Ideographic Description Characters) 
3000-303F：CJK 符号和标点 (CJK Symbols and Punctuation) 
3040-309F：日文平假名 (Hiragana) 
30A0-30FF：日文片假名 (Katakana) 
3100-312F：注音字母 (Bopomofo) 
3130-318F：朝鲜文兼容字母 (Hangul Compatibility Jamo) 
3190-319F：象形字注释标志 (Kanbun) 
31A0-31BF：注音字母扩展 (Bopomofo Extended) 
31C0-31EF：CJK 笔画 (CJK Strokes) 
31F0-31FF：日文片假名语音扩展 (Katakana Phonetic Extensions) 
3200-32FF：封闭式 CJK 文字和月份 (Enclosed CJK Letters and Months) 
3300-33FF：CJK 兼容 (CJK Compatibility) 
3400-4DBF：CJK 统一表意符号扩展 A (CJK Unified Ideographs Extension A) 
4DC0-4DFF：易经六十四卦符号 (Yijing Hexagrams Symbols) 
4E00-9FBF：CJK 统一表意符号 (CJK Unified Ideographs) 
A000-A48F：彝文音节 (Yi Syllables) 
A490-A4CF：彝文字根 (Yi Radicals) 
A500-A61F：Vai 
A660-A6FF：统一加拿大土著语音节补充 (Unified Canadian Aboriginal Syllabics Supplement) 
A700-A71F：声调修饰字母 (Modifier Tone Letters) 
A720-A7FF：拉丁文扩展-D (Latin Extended-D) 
A800-A82F：Syloti Nagri 
A840-A87F：八思巴字 (Phags-pa) 
A880-A8DF：Saurashtra 
A900-A97F：爪哇语 (Javanese) 
A980-A9DF：Chakma 
AA00-AA3F：Varang Kshiti 
AA40-AA6F：Sorang Sompeng 
AA80-AADF：Newari 
AB00-AB5F：越南傣语 (Vi?t Thái) 
AB80-ABA0：Kayah Li 
AC00-D7AF：朝鲜文音节 (Hangul Syllables) 
D800-DBFF：High-half zone of UTF-16 
DC00-DFFF：Low-half zone of UTF-16 
E000-F8FF：自行使用區域 (Private Use Zone) 
F900-FAFF：CJK 兼容象形文字 (CJK Compatibility Ideographs) 
FB00-FB4F：字母表達形式 (Alphabetic Presentation Form) 
FB50-FDFF：阿拉伯表達形式A (Arabic Presentation Form-A) 
FE00-FE0F：变量选择符 (Variation Selector) 
FE10-FE1F：竖排形式 (Vertical Forms) 
FE20-FE2F：组合用半符号 (Combining Half Marks) 
FE30-FE4F：CJK 兼容形式 (CJK Compatibility Forms) 
FE50-FE6F：小型变体形式 (Small Form Variants) 
FE70-FEFF：阿拉伯表達形式B (Arabic Presentation Form-B) 
FF00-FFEF：半型及全型形式 (Halfwidth and Fullwidth Form) 
FFF0-FFFF：特殊 (Specials)
*/


/*

语言代码：语系-地区

af 公用荷兰语
af-ZA 公用荷兰语 - 南非
sq 阿尔巴尼亚
sq-AL 阿尔巴尼亚 -阿尔巴尼亚
ar 阿拉伯语
ar-DZ 阿拉伯语 -阿尔及利亚
ar-BH 阿拉伯语 -巴林
ar-EG 阿拉伯语 -埃及
ar-IQ 阿拉伯语 -伊拉克
ar-JO 阿拉伯语 -约旦
ar-KW 阿拉伯语 -科威特
ar-LB 阿拉伯语 -黎巴嫩
ar-LY 阿拉伯语 -利比亚
ar-MA 阿拉伯语 -摩洛哥
ar-OM 阿拉伯语 -阿曼
ar-QA 阿拉伯语 -卡塔尔
ar-SA 阿拉伯语 - 沙特阿拉伯
ar-SY 阿拉伯语 -叙利亚共和国
ar-TN 阿拉伯语 -北非的共和国
ar-AE 阿拉伯语 - 阿拉伯联合酋长国
ar-YE 阿拉伯语 -也门
hy 亚美尼亚
hy-AM 亚美尼亚的 -亚美尼亚
az Azeri
az-AZ-Cyrl Azeri-(西里尔字母的) 阿塞拜疆
az-AZ-Latn Azeri(拉丁文)- 阿塞拜疆
eu 巴斯克
eu-ES 巴斯克 -巴斯克
be Belarusian
be-BY Belarusian-白俄罗斯
bg 保加利亚
bg-BG 保加利亚 -保加利亚
ca 嘉泰罗尼亚
ca-ES 嘉泰罗尼亚 -嘉泰罗尼亚
zh-HK 华 - 香港的 SAR
zh-MO 华 - 澳门的 SAR
zh-CN 华 -中国
zh-CHS 华 (单一化)
zh-SG 华 -新加坡
zh-TW 华 -台湾
zh-CHT 华 (传统的)
hr 克罗埃西亚
hr-HR 克罗埃西亚 -克罗埃西亚
cs 捷克
cs-CZ 捷克 - 捷克
da 丹麦文
da-DK 丹麦文 -丹麦
div Dhivehi
div-MV Dhivehi-马尔代夫
nl 荷兰
nl-BE 荷兰 -比利时
nl-NL 荷兰 - 荷兰
en 英国
en-AU 英国 -澳洲
en-BZ 英国 -伯利兹
en-CA 英国 -加拿大
en-CB 英国 -加勒比海
en-IE 英国 -爱尔兰
en-JM 英国 -牙买加
en-NZ 英国 - 新西兰
en-PH 英国 -菲律宾共和国
en-ZA 英国 - 南非
en-TT 英国 - 千里达托贝哥共和国
en-GB 英国 - 英国
en-US 英国 - 美国
en-ZW 英国 -津巴布韦
et 爱沙尼亚
et-EE 爱沙尼亚的 -爱沙尼亚
fo Faroese
fo-FO Faroese- 法罗群岛
fa 波斯语
fa-IR 波斯语 -伊朗王国
fi 芬兰语
fi-FI 芬兰语 -芬兰
fr 法国
fr-BE 法国 -比利时
fr-CA 法国 -加拿大
fr-FR 法国 -法国
fr-LU 法国 -卢森堡
fr-MC 法国 -摩纳哥
fr-CH 法国 -瑞士
gl 加利西亚
gl-ES 加利西亚 -加利西亚
ka 格鲁吉亚州
ka-GE 格鲁吉亚州 -格鲁吉亚州
de 德国
de-AT 德国 -奥地利
de-DE 德国 -德国
de-LI 德国 -列支敦士登
de-LU 德国 -卢森堡
de-CH 德国 -瑞士
el 希腊
el-GR 希腊 -希腊
gu Gujarati
gu-IN Gujarati-印度
he 希伯来
he-IL 希伯来 -以色列
hi 北印度语
hi-IN 北印度的 -印度
hu 匈牙利
hu-HU 匈牙利的 -匈牙利
is 冰岛语
is-IS 冰岛的 -冰岛
id 印尼
id-ID 印尼 -印尼
it 意大利
it-IT 意大利 -意大利
it-CH 意大利 -瑞士
ja 日本
ja-JP 日本 -日本
kn 卡纳达语
kn-IN 卡纳达语 -印度
kk Kazakh
kk-KZ Kazakh-哈萨克
kok Konkani
kok-IN Konkani-印度
ko 韩国
ko-KR 韩国 -韩国
ky Kyrgyz
ky-KZ Kyrgyz-哈萨克
lv 拉脱维亚
lv-LV 拉脱维亚的 -拉脱维亚
lt 立陶宛
lt-LT 立陶宛 -立陶宛
mk 马其顿
mk-MK 马其顿 -FYROM
ms 马来
ms-BN 马来 -汶莱
ms-MY 马来 -马来西亚
mr 马拉地语
mr-IN 马拉地语 -印度
mn 蒙古
mn-MN 蒙古 -蒙古
no 挪威
nb-NO 挪威 (Bokm?l) - 挪威
nn-NO 挪威 (Nynorsk)- 挪威
pl 波兰
pl-PL 波兰 -波兰
pt 葡萄牙
pt-BR 葡萄牙 -巴西
pt-PT 葡萄牙 -葡萄牙
pa Punjab 语
pa-IN Punjab 语 -印度
ro 罗马尼亚语
ro-RO 罗马尼亚语 -罗马尼亚
ru 俄国
ru-RU 俄国 -俄国
sa 梵文
sa-IN 梵文 -印度
sr-SP-Cyrl 塞尔维亚 -(西里尔字母的) 塞尔维亚共和国
sr-SP-Latn 塞尔维亚 (拉丁文)- 塞尔维亚共和国
sk 斯洛伐克
sk-SK 斯洛伐克 -斯洛伐克
sl 斯洛文尼亚
sl-SI 斯洛文尼亚 -斯洛文尼亚
es 西班牙
es-AR 西班牙 -阿根廷
es-BO 西班牙 -玻利维亚
es-CL 西班牙 -智利
es-CO 西班牙 -哥伦比亚
es-CR 西班牙 - 哥斯达黎加
es-DO 西班牙 - 多米尼加共和国
es-EC 西班牙 -厄瓜多尔
es-SV 西班牙 - 萨尔瓦多
es-GT 西班牙 -危地马拉
es-HN 西班牙 -洪都拉斯
es-MX 西班牙 -墨西哥
es-NI 西班牙 -尼加拉瓜
es-PA 西班牙 -巴拿马
es-PY 西班牙 -巴拉圭
es-PE 西班牙 -秘鲁
es-PR 西班牙 - 波多黎各
es-ES 西班牙 -西班牙
es-UY 西班牙 -乌拉圭
es-VE 西班牙 -委内瑞拉
sw Swahili
sw-KE Swahili-肯尼亚
sv 瑞典
sv-FI 瑞典 -芬兰
sv-SE 瑞典 -瑞典
syr Syriac
syr-SY Syriac-叙利亚共和国
ta 坦米尔
ta-IN 坦米尔 -印度
tt Tatar
tt-RU Tatar-俄国
te Telugu
te-IN Telugu-印度
th 泰国
th-TH 泰国 -泰国
tr 土耳其语
tr-TR 土耳其语 -土耳其
uk 乌克兰
uk-UA 乌克兰 -乌克兰
ur Urdu
ur-PK Urdu-巴基斯坦
uz Uzbek
uz-UZ-Cyrl Uzbek-(西里尔字母的) 乌兹别克斯坦
uz-UZ-Latn Uzbek(拉丁文)- 乌兹别克斯坦
vi 越南
vi-VN 越南 -越南
*/