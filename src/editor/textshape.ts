import { BulletNumbersType, Color, Page, SpanAttr, Text, TextBehaviour, TextHorAlign, TextShape, TextVerAlign } from "../data/classes";
import { CoopRepository } from "./command/cooprepo";
import { Api } from "./command/recordapi";
import { ShapeEditor } from "./shape";
import { fixTextShapeFrameByLayout } from "./utils";

export class TextShapeEditor extends ShapeEditor {
    constructor(shape: TextShape, page: Page, repo: CoopRepository) {
        super(shape, page, repo);
    }
    get shape(): TextShape {
        return this.__shape as TextShape;
    }

    public insertText(text: string, index: number, attr?: SpanAttr): boolean {
        return this.insertText2(text, index, 0, attr);
    }

    private fixFrameByLayout(api: Api) {
        fixTextShapeFrameByLayout(api, this.__page, this.shape)
    }

    public deleteText(index: number, count: number): number { // 清空后，在失去焦点时，删除shape
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return 0;
        const api = this.__repo.start("deleteText", {});
        try {
            const deleted = api.deleteText(this.__page, this.shape, index, count);
            count = deleted ? deleted.length : count;
            if (count <= 0) {
                this.__repo.rollback();
                return 0;
            }
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return count;

        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }

    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): boolean {
        const api = this.__repo.start("insertText", {});
        try {
            if (del > 0) api.deleteText(this.__page, this.shape, index, del);
            api.insertSimpleText(this.__page, this.shape, index, text, attr);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public insertFormatText(text: Text, index: number, del: number): boolean {
        const api = this.__repo.start("insertText", {});
        try {
            if (del > 0) api.deleteText(this.__page, this.shape, index, del);
            api.insertComplexText(this.__page, this.shape, index, text);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    private __composingStarted: boolean = false;
    private __composingIndex: number = 0;
    private __composingDel: number = 0;
    private __composingAttr?: SpanAttr;
    public composingInputStart(index: number, del: number, attr?: SpanAttr) {
        this.__composingStarted = true;
        this.__composingIndex = index;
        this.__composingDel = del;
        this.__composingAttr = attr;

        const api = this.__repo.start("composingInput", {});
        if (del > 0) api.deleteText(this.__page, this.shape, index, del);
    }
    public composingInputUpdate(text: string): boolean {
        this.__repo.rollback();
        const api = this.__repo.start("composingInput", {});
        if (this.__composingDel > 0) api.deleteText(this.__page, this.shape, this.__composingIndex, this.__composingDel);
        if (text.length > 0) api.insertSimpleText(this.__page, this.shape, this.__composingIndex, text, this.__composingAttr);
        else this.shape.text.composingInputUpdate(this.__composingIndex);
        this.fixFrameByLayout(api);
        this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
        return true;
    }
    public composingInputEnd(text: string): boolean {
        this.__repo.rollback();
        this.__composingStarted = false;
        return this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
    }
    public setTextDefaultColor(color: Color) {

    }
    public setTextDefaultFontName(fontName: string) {

    }
    public setTextDefaultFontSize(fontSize: number) {

    }
    public setTextColor(index: number, len: number, color: Color) {
        const api = this.__repo.start("setTextColor", {});
        try {
            api.textModifyColor(this.__page, this.shape, index, len, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontName(index: number, len: number, fontName: string) {
        const api = this.__repo.start("setTextFontName", {});
        try {
            api.textModifyFontName(this.__page, this.shape, index, len, fontName)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontSize(index: number, len: number, fontSize: number) {
        const api = this.__repo.start("setTextFontSize", {});
        try {
            api.textModifyFontSize(this.__page, this.shape, index, len, fontSize)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 对象属性
    public setTextBehaviour(textBehaviour: TextBehaviour) {
        const api = this.__repo.start("setTextBehaviour", {});
        try {
            api.shapeModifyTextBehaviour(this.__page, this.shape, textBehaviour)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 对象属性
    public setTextVerAlign(verAlign: TextVerAlign) {
        const api = this.__repo.start("setTextVerAlign", {});
        try {
            api.shapeModifyTextVerAlign(this.__page, this.shape, verAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 对象属性
    public setTextDefaultHorAlign(horAlign: TextHorAlign) {
        const api = this.__repo.start("setTextDefaultHorAlign", {});
        try {
            api.shapeModifyTextDefaultHorAlign(this.__page, this.shape, horAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 段属性
    public setTextHorAlign(horAlign: TextHorAlign, index: number, len: number) {
        const api = this.__repo.start("setTextHorAlign", {});
        try {
            api.textModifyHorAlign(this.__page, this.shape, horAlign, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextDefaultMinLineHeight(minLineHeight: number) {

    }
    // 行高 段属性
    public setMinLineHeight(minLineHeight: number, index: number, len: number) {
        const api = this.__repo.start("setMinLineHeight", {});
        try {
            api.textModifyMinLineHeight(this.__page, this.shape, minLineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultMaxLineHeight(maxLineHeight: number) {

    }
    // 行高 段属性
    public setMaxLineHeight(maxLineHeight: number, index: number, len: number) {
        const api = this.__repo.start("setMaxLineHeight", {});
        try {
            api.textModifyMaxLineHeight(this.__page, this.shape, maxLineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultCharSpacing(kerning: number) {

    }
    // 字间距 段属性
    public setCharSpacing(kerning: number, index: number, len: number) {
        const api = this.__repo.start("setCharSpace", {});
        try {
            api.textModifyKerning(this.__page, this.shape, kerning, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultParaSpacing(paraSpacing: number) {

    }
    // 段间距 段属性
    public setParaSpacing(paraSpacing: number, index: number, len: number) {
        const api = this.__repo.start("setParaSpacing", {});
        try {
            api.textModifyParaSpacing(this.__page, this.shape, paraSpacing, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextDefaultUnderline(underline: boolean) {
        
    }

    public setTextUnderline(underline: boolean, index: number, len: number) {

    }

    public setTextDefaultStrikethrough(strikethrough: boolean) {
        
    }

    public setTextStrikethrough(strikethrough: boolean, index: number, len: number) {

    }

    // 需要个占位符

    public setTextDefaultBulletNumbers(type: BulletNumbersType) {

    }

    public setTextBulletNumbers(type: BulletNumbersType, index: number, len: number) {
        
    }

    public setTextBulletNumbersStart(start: number, index: number, len: number) {
        
    }

    public setTextBulletNumbersInherit(inherit: boolean, index: number, len: number) {
        
    }
}