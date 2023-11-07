import { Shadow, ShadowPosition } from "../data/baseclasses";
import { Style } from "data/style";
import { ShapeFrame } from "../data/classes";

const shadowOri: { [key: string]: (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number) => any } = {};

shadowOri[ShadowPosition.Outer] = function (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number): any {
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
    stdDeviation: `${blurRadius} ${spread}`,
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
shadowOri[ShadowPosition.Inner] = function (h: Function, shadows: Shadow[], frame: ShapeFrame, id: string, i: number): any {
  const f_id = `inner-shadow-${id + i}`;
  const filter_props = { id: f_id, x: '-30%', y: '-30%', height: '160%', width: '160%' };
  const shadow = shadows[i];
  const { color, offsetX, offsetY, blurRadius, spread } = shadow;
  const fe_offset_props = {
    dx: offsetX,
    dy: offsetY,
    result: `offsetBlur`
  }
  const fe_gaussian_blur_props = {
    stdDeviation: `${blurRadius} ${spread}`,
    in: `offsetBlur`,
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
  const h_node = [
    h('feOffset', fe_offset_props),
    h('feGaussianBlur', fe_gaussian_blur_props),
    h('feComposite', fe_composite1),
    h('feFlood', fe_flood),
    h('feComposite', fe_composite2),
    h('feComposite', fe_composite3),
  ];
  return h('filter', filter_props, h_node);
}

export function render(h: Function, style: Style, frame: ShapeFrame, id: string) {
  const elArr = new Array();
  const shadows = style.shadows;
  let filterNode = [];
  let feMergeNode = [];
  const f_id = `dorp-shadow-${id}`;
  const filter_props = { id: f_id, x: '-30%', y: '-30%', height: '160%', width: '160%' };
  const fe_merge_node2_porps = { in: "SourceGraphic" };
  for (let i = 0; i < shadows.length; i++) {
    const shadow = shadows[i];
    const position = shadow.position;
    if (!shadow.isEnabled) continue;
    if (position === ShadowPosition.Outer) {
      const { h_node, mergeNode } = shadowOri[position](h, style.shadows, frame, id, i);
      filterNode.push(...h_node);
      feMergeNode.push(mergeNode);
    } else if (position === ShadowPosition.Inner) {
      const filter = shadowOri[position](h, style.shadows, frame, id, i);
      elArr.push(filter);
    }
  }
  if (filterNode.length) {
    feMergeNode.push(h('feMergeNode', fe_merge_node2_porps));
    const merge = h('feMerge', {}, feMergeNode)
    filterNode.push(merge);
    elArr.push(h('filter', filter_props, filterNode));
  }
  return elArr;
}

export function innerShadowId(id: string, shadows?: Shadow[]) {
  let ids = [];
  if (shadows && shadows.length) {
    for (let i = 0; i < shadows.length; i++) {
      const shadow = shadows[i];
      if(shadow.position === ShadowPosition.Inner) {
        let _id = `url(#inner-shadow-${id + i})`;
        ids.push(_id)
      }
    }
  }
  return ids.join(' ');
}
