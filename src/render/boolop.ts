
import { parsePathString, path2curve, pathToAbsolute } from "@/path/transform";
// import { union as un, difference as diff, intersection as intersect, exclusion as ex } from "@/path/boolop"

import { union as un, subtract as diff, intersect as intersect, xor as ex } from "@/path/b3boolop"
import { pathArrToStr } from "@/path/boolop"

export function union(path0: string, path1: string): string {
    if (path0.length == 0) {
        return path1;
    }
    if (path1.length == 0) {
        return path0;
    }

    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const u = un(curve0, curve1);
    // return pathSegsToStr(u);
    return pathArrToStr(u);
}

export function intersection(path0: string, path1: string): string {
    if (path0.length == 0 || path1.length == 0) {
        return "";
    }

    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const i = intersect(curve0, curve1);
    // return pathSegsToStr(i);
    return pathArrToStr(i);
}

export function subtract(path0: string, path1: string): string {
    if (path0.length == 0) {
        return path1;
    }
    if (path1.length == 0) {
        return path0;
    }

    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const d = diff(curve0, curve1);
    // return pathSegsToStr(d);
    return pathArrToStr(d);
}

export function difference(path0: string, path1: string): string {
    if (path0.length == 0) {
        return path1;
    }
    if (path1.length == 0) {
        return path0;
    }

    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const e = ex(curve0, curve1);
    // return pathSegsToStr(e);
    return pathArrToStr(e);
}
