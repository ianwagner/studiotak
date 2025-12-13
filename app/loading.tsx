const SkeletonLine = ({ width = "100%", height = 14 }: { width?: number | string; height?: number }) => (
  <div
    className="skeleton"
    aria-hidden="true"
    style={{ width, height, borderRadius: 999 }}
  />
);

const SkeletonCard = ({ minHeight = 140 }: { minHeight?: number }) => (
  <div className="card" style={{ padding: 18, display: "grid", gap: 12, minHeight }}>
    <SkeletonLine width="32%" height={12} />
    <SkeletonLine width="72%" height={18} />
    <SkeletonLine width="58%" />
    <SkeletonLine width="44%" />
  </div>
);

export default function Loading() {
  return (
    <main>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          background: "var(--header-bg)",
          borderBottom: "1px solid var(--header-border)",
          boxShadow: "var(--header-shadow)",
          padding: "18px 0"
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <SkeletonLine width={140} height={22} />
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <SkeletonLine width={70} />
            <SkeletonLine width={70} />
            <SkeletonLine width={70} />
          </div>
        </div>
      </div>

      <div
        className="container"
        style={{
          padding: "72px 0 120px",
          display: "grid",
          gap: 28
        }}
      >
        <div style={{ display: "grid", gap: 14, textAlign: "center", justifyItems: "center" }}>
          <SkeletonLine width={120} height={12} />
          <SkeletonLine width="68%" height={44} />
          <SkeletonLine width="52%" height={18} />
        </div>

        <div className="grid" style={{ gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>

        <div className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
          <SkeletonLine width="30%" height={14} />
          <SkeletonLine width="62%" height={26} />
          <SkeletonLine width="72%" />
          <SkeletonLine width="64%" />
          <SkeletonLine width="58%" />
        </div>
      </div>
    </main>
  );
}
