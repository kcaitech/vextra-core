
import { parsePathString, path2curve, pathToAbsolute } from "@/path/transform";
import { union as un, difference as diff, intersection as intersect, exclusion as ex, pathSegsToStr } from "@/path/boolop"

export function union(path0: string, path1: string): string {
    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const u = un(curve0, curve1);
    return pathSegsToStr(u);
}

export function intersection(path0: string, path1: string): string {
    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const i = intersect(curve0, curve1);
    return pathSegsToStr(i);
}

export function difference(path0: string, path1: string): string {
    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const d = diff(curve0, curve1);
    return pathSegsToStr(d);
}

export function exclusion(path0: string, path1: string): string {
    const parsed0 = parsePathString(path0);
    const abs0 = pathToAbsolute(parsed0);
    const curve0 = path2curve(abs0) as (string | number)[][];

    const parsed1 = parsePathString(path1);
    const abs1 = pathToAbsolute(parsed1);
    const curve1 = path2curve(abs1) as (string | number)[][];

    const e = ex(curve0, curve1);
    return pathSegsToStr(e);
}
