import { Shape } from "@/data/shape";
import Raphael from "@/vendor/raphael";

// todo raphael 需要精简，不需要dom的
// 
export function union(path0: string, path1: string): string {
    const paper = new Raphael(document.createElement("div"), Number.MAX_VALUE, Number.MAX_VALUE);
    const path = paper.union(paper.path(path0), paper.path(path1));
    return path;
}

export function intersection(path0: string, path1: string): string {
    const paper = new Raphael(document.createElement("div"), Number.MAX_VALUE, Number.MAX_VALUE);
    const path = paper.intersection(paper.path(path0), paper.path(path1));
    return path;
}

export function difference(path0: string, path1: string): string {
    const paper = new Raphael(document.createElement("div"), Number.MAX_VALUE, Number.MAX_VALUE);
    const path = paper.difference(paper.path(path0), paper.path(path1));
    return path;
}

export function exclusion(path0: string, path1: string): string {
    const paper = new Raphael(document.createElement("div"), Number.MAX_VALUE, Number.MAX_VALUE);
    const path = paper.exclusion(paper.path(path0), paper.path(path1));
    return path;
}