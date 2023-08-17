export function render(h: Function, id: string) {
  const filter_props = { id };
  const fe_faussian_blur_props = {
    in: "SourceAlpha",
    stdDeviation: '4 4',
    result: "blur"
  }
  const fe_offset_props = {
    in: "blur",
    dx: 2,
    dy: 2,
    result: "offsetBlur"
  }
  const fe_merge_node1_porps = { in: "offsetBlur" };
  const fe_merge_node2_porps = { in: "SourceGraphic" };

  return h('filter', filter_props, [
    h('feGaussianBlur', fe_faussian_blur_props),
    h('feOffset', fe_offset_props),
    h('feMerge', {}, [
      h('feMergeNode', fe_merge_node1_porps),
      h('feMergeNode', fe_merge_node2_porps),
    ])
  ])
}