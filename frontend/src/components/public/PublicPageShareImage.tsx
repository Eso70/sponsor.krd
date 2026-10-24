import { ShareImageText } from "./ShareImageText";
/** Server-rendered artwork for ImageResponse; no remote asset fetches. */
export function PublicPageShareImage({ title, subtitle, hostname }: {
  title: string; subtitle: string; hostname: string;
}) {
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%",
    background: "#161b22", color: "white", padding: 80, fontFamily: "Rabar", borderBottom: "12px solid #25F4EE" }}>
    <ShareImageText text={title} fontSize={Array.from(title).length > 90 ? 36 : Array.from(title).length > 55 ? 52 : 72} />
    <ShareImageText text={subtitle} fontSize={24} marginTop={20} color="#d1d5db" />
    <div style={{ display: "flex", position: "absolute", left: 80, bottom: 64, fontSize: 24, color: "#25F4EE" }}>{hostname}</div>
  </div>;
}
