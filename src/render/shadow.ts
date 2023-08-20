import { Shadow } from "data/baseclasses";

export function render(h: Function, id: string, shadow: Shadow) {
  const filter_props = { id, x: '-30%', y: '-30%', height: '160%', width: '160%' };
  const { color, offsetX, offsetY, blurRadius, spread } = shadow
  const fe_color_matrix = {
    type: "matrix",
    values: `0 0 0 ${color.red / 255} 0
             0 0 0 ${color.green / 255} 0
             0 0 0 ${color.blue / 255} 0
             0 0 0 ${color.alpha} 0`
  }
  const fe_gaussian_blur_props = {
    stdDeviation: `${blurRadius} ${spread}`,
    result: "blur"
  }
  const fe_offset_props = {
    in: "blur",
    dx: offsetX,
    dy: offsetY,
    result: "offsetBlur"
  }

  const fe_merge_node1_porps = { in: "offsetBlur" };
  const fe_merge_node2_porps = { in: "SourceGraphic" };

  return h('filter', filter_props, [
    h('feColorMatrix', fe_color_matrix),
    h('feGaussianBlur', fe_gaussian_blur_props),
    h('feOffset', fe_offset_props),
    h('feMerge', {}, [
      h('feMergeNode', fe_merge_node1_porps),
      h('feMergeNode', fe_merge_node2_porps),
    ])
  ])
}