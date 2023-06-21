import { Color, Page, SpanAttr, TextShape } from "../data/classes";
import { CoopRepository } from "./command/cooprepo";
import { ShapeEditor } from "./shape";

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

    public deleteText(index: number, count: number): number {
        if (!(this.__shape instanceof TextShape)) return 0;
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return 0;
        const api = this.__repo.start("deleteText", {});
        try {
            const deleted = api.deleteText(this.__page, this.__shape, index, count);
            if (!deleted) {
                this.__repo.rollback();
                return 0;
            }
            else {
                count = deleted.length;
                this.__repo.commit();
                return count;
            }
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }

    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        const api = this.__repo.start("insertText", {});
        try {
            if (del > 0) {
                const origin = api.deleteText(this.__page, this.__shape, index, del);
                api.insertSimpleText(this.__page, this.__shape, index, text, attr);
            }
            else {
                api.insertSimpleText(this.__page, this.__shape, index, text, attr);
            }
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
        if (!(this.__shape instanceof TextShape)) return false;

        this.__composingStarted = true;
        this.__composingIndex = index;
        this.__composingDel = del;
        this.__composingAttr = attr;

        const api = this.__repo.start("composingInput", {});
        if (del > 0) api.deleteText(this.__page, this.__shape, index, del);
    }
    public composingInputUpdate(text: string): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        this.__repo.rollback();
        const api = this.__repo.start("composingInput", {});
        if (this.__composingDel > 0) api.deleteText(this.__page, this.__shape, this.__composingIndex, this.__composingDel);
        if (text.length > 0) api.insertSimpleText(this.__page, this.__shape, this.__composingIndex, text, this.__composingAttr);
        this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
        return true;
    }
    public composingInputEnd(text: string): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        this.__repo.rollback();

        this.__composingStarted = false;
        return this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
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
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
}