import type { CSSProperties } from "react";

/** The bundled image renderer shapes Arabic glyphs but lays out words LTR.
 * Keep Latin runs intact and lay out Arabic words in reading order with flex.
 * This affects artwork only; stored text and browser metadata remain unchanged.
 */
export function ShareImageText({ text, fontSize, color, marginTop = 0 }: {
  text: string; fontSize: number; color?: string; marginTop?: number;
}) {
  const words = text.split(/\s+/).filter(Boolean);
  const runs: { rtl: boolean; words: string[] }[] = [];
  for (const word of words) {
    const rtl = /\p{Script=Arabic}/u.test(word);
    const previous = runs[runs.length - 1];
    if (previous?.rtl === rtl) previous.words.push(word);
    else runs.push({ rtl, words: [word] });
  }
  const arabic = text.match(/\p{Script=Arabic}/gu)?.length ?? 0;
  const latin = text.match(/\p{Script=Latin}/gu)?.length ?? 0;
  const rtl = arabic > latin;
  const style: CSSProperties = { display: "flex", flexWrap: "wrap", flexDirection: rtl ? "row-reverse" : "row", width: "100%", columnGap: fontSize * 0.24, rowGap: fontSize * 0.06, lineHeight: 1.25, fontSize, color, marginTop };
  return <div style={style}>
    {runs.map((run, index) => run.rtl
      ? <div key={index} style={{ display: "flex", flexWrap: "wrap", flexDirection: "row-reverse", maxWidth: "100%", columnGap: fontSize * 0.24, rowGap: fontSize * 0.06 }}>
          {run.words.map((word, wordIndex) => <span key={wordIndex}>{word}</span>)}
        </div>
      : <div key={index} style={{ display: "flex", maxWidth: "100%" }}>{run.words.join(" ")}</div>)}
  </div>;
}
