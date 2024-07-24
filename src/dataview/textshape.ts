import {
    OverrideType,
    Para,
    Path,
    BasicArray,
    TextLayout,
    ShapeSize,
    Span,
    Text,
    TextBehaviour,
    TextShape,
    Transform,
    VariableType,
    ShapeType,
    BlurType,
    makeShapeTransform2By1,
    makeShapeTransform1By2
} from "../data";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import {
    CursorLocate, TextLocate, locateCursor,
    locateNextCursor, locatePrevCursor, locateRange, locateText
} from "../data/textlocate";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "../data/textutils";
import { objectId } from "../basic/objectid";
import { innerShadowId } from "../render";

export class TextShapeView extends ShapeView {
    __str: string | undefined;
    __strText: Text | undefined;
    m_transform_form_mask?: Transform;
    m_mask_group?: ShapeView[];

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        if (v && typeof v.value === 'string') {
            if (this.__str === v.value) {
                return this.__strText!;
            }
            this.__str = v.value;
            const str = v.value.split('\n');
            const origin = (this.m_data as TextShape).text;
            this.__strText = new Text(new BasicArray<Para>());
            if (origin.attr) mergeTextAttr(this.__strText, origin.attr);
            const originp = origin.paras[0];
            const originspan = originp.spans[0];
            for (let i = 0; i < str.length; ++i) {
                let _str = str[i];
                if (!_str.endsWith('\n')) _str += '\n';
                const p = new Para(_str, new BasicArray<Span>());
                p.spans.push(new Span(p.length));
                mergeParaAttr(p, originp);
                mergeSpanAttr(p.spans[0], originspan);
                this.__strText.paras.push(p);
            }
            return this.__strText;
        }

        const text = v ? v.value : (this.m_data as TextShape).text;
        if (typeof text === 'string') throw new Error("");
        return text;
    }

    get data() {
        return this.m_data as TextShape;
    }

    get text() {
        return this.getText();
    }

    private m_layout?: TextLayout;
    // private m_layoutText?: Text;
    private m_textpath?: Path;

    __layoutToken: string | undefined;
    __preText: Text | undefined;

    getLayout() {
        const text = this.getText();
        if (this.__preText && this.__layoutToken && objectId(this.__preText) !== objectId(text)) {
            this.__preText.dropLayout(this.__layoutToken, this.id);
        }
        const frame = this.__origin_frame;
        const layout = text.getLayout3(frame, this.id, this.__layoutToken);
        this.__layoutToken = layout.token;
        if (this.m_layout !== layout.layout) {
            this.m_textpath = undefined;
        }
        this.m_layout = layout.layout;
        if (this.isVirtualShape && this.__preText !== text) {
            this.updateFrameByLayout(frame);
        }
        this.__preText = text;
        return layout.layout;
    }

    locateText(x: number, y: number): TextLocate {
        const layout = this.getLayout();
        return locateText(layout, x, y);
    }

    locateRange(start: number, end: number): { x: number, y: number }[] {
        return locateRange(this.getLayout(), start, end);
    }

    locateCursor(index: number, cursorAtBefore: boolean): CursorLocate | undefined {
        return locateCursor(this.getLayout(), index, cursorAtBefore);
    }

    locatePrevCursor(index: number): number {
        return locatePrevCursor(this.getLayout(), index);
    }

    locateNextCursor(index: number): number {
        return locateNextCursor(this.getLayout(), index);
    }

    getTextPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }

    onDataChange(...args: any[]): void {
        super.onDataChange();
        this.m_textpath = undefined;
    }

    renderContents(): EL[] {
        const layout = this.getLayout();
        return renderTextLayout(elh, layout, this.frame, this.blur);
    }

    __origin_frame: ShapeSize = new ShapeSize();

    forceUpdateOriginFrame() {
        const frame = this.data.frame;
        // this.__origin_frame.x = frame.x;
        // this.__origin_frame.y = frame.y;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }

    updateLayoutArgs(trans: Transform, size: ShapeSize, radius: number | undefined): void {
        // if (this.isVirtualShape && isDiffShapeFrame(this.m_frame, frame)) {
        //     this.updateSize(frame.width, frame.height);
        // }
        super.updateLayoutArgs(trans, size, radius);
        // this.__origin_frame.x = frame.x;
        // this.__origin_frame.y = frame.y;
        this.__origin_frame.width = size.width;
        this.__origin_frame.height = size.height;
        // update frame by layout
        this.getLayout(); // 要提前排版，不然frame不对，填充不对。也可以考虑先renderContents，再renderFills。
        this.updateFrameByLayout(size);
    }

    private updateFrameByLayout(origin: ShapeSize) {
        if (!this.isVirtualShape || !this.m_layout) return;
        const text = this.getText();
        const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        if (textBehaviour !== TextBehaviour.Flexible) return;
        let notify = false;
        if (notify) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.notify("shape-frame");
        }
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;
        const mb = this.maskedBy;
        if (mb) {
            mb.notify('mask');
            this.reset("g");
            return ++this.m_render_version;
        }
        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }
        const fills = this.renderFills() || [];
        const childs = this.renderContents();
        const borders = this.renderBorders() || [];
        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        let props = this.renderProps();
        let children = [...fills, ...childs, ...borders];

        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        if (blur.length) {
            let filter: string = '';
            if (this.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    get relyLayers() {
        if (!this.m_transform_form_mask) this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const group = this.m_mask_group || [];
        if (group.length < 2) return;
        const inverse = makeShapeTransform2By1(this.m_transform_form_mask).getInverse();
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            const dom = __s.dom;
            (dom.elattr as any)['style'] = { 'transform': makeShapeTransform1By2(__s.transform2.clone().addTransform(inverse)).toString() };
            els.push(dom);
        }

        return els;
    }

    get transformFromMask() {
        this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const space = makeShapeTransform2By1(this.m_transform_form_mask).getInverse();

        return makeShapeTransform1By2(this.transform2.clone().addTransform(space)).toString()
    }

    renderMask() {
        if (!this.mask) return;
        const parent = this.parent;
        if (!parent || parent.type === ShapeType.Page) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === this.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [this];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return new Transform(1, 0, x, 0, 1, y);
    }

    bleach(el: EL) {  // 漂白
        if (el.elattr.fill) el.elattr.fill = '#FFF';
        if (el.elattr.stroke) el.elattr.stroke = '#FFF';

        // 漂白字体
        if (el.eltag === 'text') {
            if ((el.elattr?.style as any).fill) {
                (el.elattr?.style as any).fill = '#FFF'
            }
        }

        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        // 渐变漂白不了

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    onDestory(): void {
        super.onDestory();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }
}