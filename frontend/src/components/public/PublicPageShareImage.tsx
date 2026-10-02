/** Server-rendered artwork for ImageResponse; no remote asset fetches. */
export function PublicPageShareImage({ title, subtitle, hostname }: {
  title: string; subtitle: string; hostname: string;
}) {
  return <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%",
    background: "#161b22", color: "white", padding: 80, fontFamily: "Rabar", borderBottom: "12px solid #25F4EE" }}>
    <div style={{ display: "flex", fontSize: 72 }}>{title}</div>
    <div style={{ display: "flex", fontSize: 32, marginTop: 32, color: "#d1d5db" }}>{subtitle}</div>
    <div style={{ display: "flex", fontSize: 24, marginTop: 60, color: "#25F4EE" }}>{hostname}</div>
  </div>;
}
