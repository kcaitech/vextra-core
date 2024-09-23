
// 数据版本号

export const FMT_VER_transfrom = "1";

export const FMT_VER_latest = FMT_VER_transfrom;

export function destruct(version: string) {
    const splits = version.toString().split('.') // toString是因为历史版本记录了number
    const main = Number.parseInt(splits[0] ?? 0)
    const second = Number.parseInt(splits[1] ?? 0)
    const third = Number.parseInt(splits[2] ?? 0)
    return { main, second, third }
}
export function compare(v0: string, v1: string) {
    // return v0 > v1 ? 1 : (v0 < v1 ? -1 : 0); // '1' === '1.0.0'
    const dv0 = destruct(v0)
    const dv1 = destruct(v1)
    if (dv0.main !== dv1.main) return dv0.main - dv1.main;
    if (dv0.second !== dv1.second) return dv0.second - dv1.second;
    if (dv0.third !== dv1.third) return dv0.third - dv1.third;
    return 0;
}