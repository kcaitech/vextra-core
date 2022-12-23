import { IJSON } from "@/data/lzdata";
import { BlendMode, Blur, BorderOptions, ContextSettings, MarkerType, Style, WindingRule } from "@/data/style";
import { Env } from "./env";

export function importStyle(env:Env, data: IJSON): Style {
    return new Style(MarkerType.Type0, 0, MarkerType.Type0, WindingRule.Rule0, new Blur(), new BorderOptions(), [], new ContextSettings(BlendMode.Mode0, 0), [], [], []);
}