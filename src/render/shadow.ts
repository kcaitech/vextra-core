import { Shadow, ShadowPosition, ShapeType } from "../data/baseclasses";
import { Style } from "data/style";
import { Shape, ShapeFrame } from "../data/classes";

const shadowOri: { [key: string]: (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number, path: string) => any } = {};
shadowOri[ShadowPosition.Outer] = function (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number, path: string): any {
  const { width, height } = frame;
  const clipId = "clippath-shadow" + id;
  const shadow = shadows[i];
  const f_props: any = { props_w: [], props_h: [], props_x: [], props_y: [] }
  getFilterPropsValue(shadow, frame, f_props);
  const { color, offsetX, offsetY, blurRadius, spread } = shadow;
  const { red, green, blue, alpha } = color;
  const filter_props: any = { id: id + i, x: '-20%', y: '-20%', height: '140%', width: '140%' };
  filter_props.width = Math.max(...f_props.props_w);
  filter_props.height = Math.max(...f_props.props_h);
  filter_props.x = Math.min(...f_props.props_x);
  filter_props.y = Math.min(...f_props.props_y);
  const multi = 1 + (spread * 2) / 100;
  const filter = h("filter", filter_props, [
    h('feGaussianBlur', { stdDeviation: `${blurRadius / 2}` }),
    h('feOffset', { dx: offsetX / multi, dy: offsetY / multi, }),
  ])
  const body_props: any = {
    d: path,
    'clip-path': "url(#" + clipId + ")",
    filter: `url(#${id + i})`,
    style: `transform-origin: left top; transform: translate(${width / 2}px, ${height / 2}px) scale(${multi >= 0 ? multi : 0}) translate(${-width / 2}px, ${-height / 2}px) `,
    fill: `rgba(${red}, ${green}, ${blue}, ${alpha})`,
  }
  const p = h('path', body_props);
  return { filter, p }
}
shadowOri[ShadowPosition.Inner] = function (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number, path: string): any {
  const f_id = `inner-shadow-${id + i}`;
  const shadow = shadows[i];
  const { color, offsetX, offsetY, blurRadius, spread } = shadow;
  const fe_offset_props = {
    dx: offsetX,
    dy: offsetY,
    result: `offsetBlur`
  }
  const fe_gaussian_blur_props = {
    stdDeviation: `${blurRadius / 2}`,
    in: `spread`,
    in2: 'offsetBlur',
    result: `blur`
  }
  const fe_composite1 = {
    operator: 'out',
    in: `SourceGraphic`,
    in2: `blur`,
    result: `inverse`
  }
  const { red, green, blue, alpha } = color;
  const fe_flood = {
    'flood-color': `rgba(${red}, ${green}, ${blue}, ${alpha})`,
    result: `color`
  }
  const fe_composite2 = {
    operator: "in",
    in: `color`,
    in2: `inverse`,
    result: `shadow`
  }
  const fe_composite3 = {
    operator: "over",
    in: `shadow`,
    in2: `SourceGraphic`,
  }
  const fe_morphology = {
    operator: "erode",
    radius: `${spread}`,
    result: 'spread'
  }

  const filter_props = { id: f_id, x: '-20%', y: '-20%', height: '140%', width: '140%' };
  const h_node = [
    h('feOffset', fe_offset_props),
    h('feMorphology', fe_morphology),
    h('feGaussianBlur', fe_gaussian_blur_props),
    h('feComposite', fe_composite1),
    h('feFlood', fe_flood),
    h('feComposite', fe_composite2),
    h('feComposite', fe_composite3),
  ];
  return h('filter', filter_props, h_node);
}

function shadowType (h: Function, shadows: Shadow[], i: number): any {
  const shadow = shadows[i];
  const { color, offsetX, offsetY, blurRadius, spread } = shadow;
  const fe_color_matrix = {
    type: "matrix",
    values: `0 0 0 ${color.red / 255} 0
               0 0 0 ${color.green / 255} 0
               0 0 0 ${color.blue / 255} 0
               0 0 0 ${color.alpha} 0`,
    result: `color${i}`
  }
  const fe_gaussian_blur_props = {
    stdDeviation: `${blurRadius / 2}`,
    in: `color${i}`,
    result: `blur${i}`
  }
  const fe_offset_props = {
    in: `blur${i}`,
    dx: offsetX,
    dy: offsetY,
    result: `offsetBlur${i}`
  }
  const fe_merge_node1_porps = { in: `offsetBlur${i}` };
  const h_node = [
    h('feColorMatrix', fe_color_matrix),
    h('feGaussianBlur', fe_gaussian_blur_props),
    h('feOffset', fe_offset_props)
  ];
  const mergeNode = h('feMergeNode', fe_merge_node1_porps);
  return { h_node, mergeNode }
}

export function render(h: Function, style: Style, frame: ShapeFrame, id: string, path: string, shape: Shape) {
  const elArr = new Array();
  const shadows = style.shadows;
  const inner_f = [];
  const f_props: any = { props_w: [], props_h: [], props_x: [], props_y: [] }
  const filters = [];
  const paths = [];
  const filterNode = [];
  const feMergeNode = [];
  const f_id = `dorp-shadow-${id}`;
  for (let i = 0; i < shadows.length; i++) {
    const shadow = shadows[i];
    getFilterPropsValue(shadow, frame, f_props);
    const position = shadow.position;
    if (!shadow.isEnabled) continue;
    if (position === ShadowPosition.Outer) {
      if (shape.type === ShapeType.Rectangle || shape.type === ShapeType.Artboard || shape.type === ShapeType.Oval) {
        const { filter, p } = shadowOri[position](h, style.shadows, frame, id, i, path);
        filters.push(filter);
        paths.push(p);
      } else {
        const { h_node, mergeNode } = shadowType(h, style.shadows, i);
        filterNode.push(...h_node);
        feMergeNode.push(mergeNode);
      }
    } else if (position === ShadowPosition.Inner) {
      const filter = shadowOri[position](h, style.shadows, frame, id, i, path);
      inner_f.push(filter);
    }
  }
  if (filters.length) {
    elArr.push(h("g", [...filters, ...paths]));
  }
  const filter_props: any = { id: f_id, x: '-30%', y: '-30%', height: '160%', width: '160%' };
  const fe_merge_node2_porps = { in: "SourceGraphic" };
  if (filterNode.length) {
    filter_props.width = Math.max(...f_props.props_w);
    filter_props.height = Math.max(...f_props.props_h);
    filter_props.x = Math.min(...f_props.props_x);
    filter_props.y = Math.min(...f_props.props_y);
    feMergeNode.push(h('feMergeNode', fe_merge_node2_porps));
    const merge = h('feMerge', {}, feMergeNode)
    filterNode.push(merge);
    elArr.push(h('filter', filter_props, filterNode));
  }
  elArr.push(...inner_f);
  return elArr;
}

export function innerShadowId(id: string, shadows?: Shadow[]) {
  let ids = [];
  if (shadows && shadows.length) {
    for (let i = 0; i < shadows.length; i++) {
      const shadow = shadows[i];
      if (shadow.position === ShadowPosition.Inner) {
        let _id = `url(#inner-shadow-${id + i})`;
        ids.push(_id)
      }
    }
  }
  return ids.join(' ');
}

const getFilterPropsValue = (shadow: Shadow, frame: ShapeFrame, f_props: any) => {
  const { color, offsetX, offsetY, blurRadius, spread } = shadow;
  const { width, height } = frame;
  const props_x = -(Math.min(0, offsetX) + blurRadius + Math.max(0, spread) + (width * 0.1));
  const props_y = -(Math.min(0, offsetY) + blurRadius + Math.max(0, spread) + (height * 0.1));
  const props_w = width + Math.max(0, offsetX) + blurRadius + Math.max(0, spread) + (width * 0.2);
  const props_h = height + Math.max(0, offsetY) + blurRadius + Math.max(0, spread) + (height * 0.2);
  f_props.props_h.push(props_h);
  f_props.props_w.push(props_w);
  f_props.props_x.push(props_x);
  f_props.props_y.push(props_y);
}