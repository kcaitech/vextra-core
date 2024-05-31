export const EPSILON = 1e-7 // 浮点计算误差最大允许值
export function isEqual(a: number, b: number) { // 判断是否相等，差值小于EPSILON视为相等
    return a === b || Math.abs(a - b) < EPSILON
}

export function isZero(value: number) { // 判断是否为0，小于EPSILON的值视为0
    return isEqual(value, 0)
}

export function isOne(value: number) { // 判断是否为1，差值小于EPSILON视为1
    return isEqual(value, 1)
}
