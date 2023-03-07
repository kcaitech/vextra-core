export function makePair<T1, T2>(first: T1, second: T2):Pair<T1, T2> {
    return {first, second};
}

export interface Pair<T1, T2> {
    first: T1;
    second: T2;
}

export interface XY<T1, T2> {
    x: T1;
    y: T2;
}

