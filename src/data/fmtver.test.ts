import { compare, destruct } from "./fmtver"

describe('fmtver', () => {
    test('1', () => {
        const v = destruct(1 as any as string)
        expect(v.main).toBe(1)
        expect(v.second).toBe(0)
        expect(v.third).toBe(0)
    })

    test('1.1', () => {
        const v = destruct('1.1')
        expect(v.main).toBe(1)
        expect(v.second).toBe(1)
        expect(v.third).toBe(0)
    })

    test('1.0.1', () => {
        const v = destruct('1.0.1')
        expect(v.main).toBe(1)
        expect(v.second).toBe(0)
        expect(v.third).toBe(1)
    })

    test('compare', () => {
        expect('1.1' > '1.0.1').toBe(true)
        expect('10.0' > '1.1').toBe(true)
        expect(compare('1', '1.0.0')).toBe(0)
        expect(compare('1.1', '1.0.1') > 0).toBe(true)
        expect(compare('10.0', '1.1') > 0).toBe(true)
    })
})