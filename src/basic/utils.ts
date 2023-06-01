// 根据若干(>= 4)个点，确定最边界的四个值
export function createHorizontalBox(points: [number, number][]) {
    if (points.length < 4) return;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i++) {
        xs.push(points[i][0]);
        ys.push(points[i][1]);
    }
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    return { top, bottom, left, right };
}

export function castObjectToClass<T>(obj: Object, prototype: T): T {
    // return Object.assign(Object.create(prototype as any), obj);
    Object.setPrototypeOf(obj, prototype as any);
    return obj as T;
}