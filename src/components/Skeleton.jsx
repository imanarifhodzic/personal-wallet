const pulse = {
  animation: "skeleton-pulse 1.5s ease-in-out infinite",
};

export default function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "6px",
  style = {},
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          "linear-gradient(90deg, #ede9fe 0%, #f5f3ff 50%, #ede9fe 100%)",
        backgroundSize: "200% 100%",
        ...pulse,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ children }) {
  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="page">
      <div style={{ marginBottom: "28px" }}>
        <Skeleton width="200px" height="28px" style={{ marginBottom: "8px" }} />
        <Skeleton width="300px" height="16px" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <Skeleton width="80px" height="12px" />
            <Skeleton width="140px" height="28px" />
          </SkeletonCard>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[1, 2].map((i) => (
          <SkeletonCard key={i}>
            <Skeleton width="140px" height="16px" />
            <Skeleton width="100%" height="200px" borderRadius="8px" />
          </SkeletonCard>
        ))}
      </div>

      <SkeletonCard>
        <Skeleton width="160px" height="16px" />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0",
            }}
          >
            <Skeleton
              width="38px"
              height="38px"
              borderRadius="10px"
              style={{ flexShrink: 0 }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <Skeleton width="160px" height="14px" />
              <Skeleton width="100px" height="12px" />
            </div>
            <Skeleton width="80px" height="16px" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

export function TransactionsSkeleton() {
  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <Skeleton width="160px" height="28px" />
        <Skeleton width="140px" height="36px" borderRadius="8px" />
      </div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="80px" height="32px" borderRadius="99px" />
        ))}
      </div>
      <SkeletonCard>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
            }}
          >
            <Skeleton
              width="38px"
              height="38px"
              borderRadius="10px"
              style={{ flexShrink: 0 }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <Skeleton width="180px" height="14px" />
              <Skeleton width="120px" height="12px" />
            </div>
            <Skeleton width="80px" height="16px" />
          </div>
        ))}
      </SkeletonCard>
    </div>
  );
}

export function GenericSkeleton({ title = true }) {
  return (
    <div className="page">
      {title && (
        <Skeleton
          width="180px"
          height="28px"
          style={{ marginBottom: "24px" }}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <Skeleton
                width="42px"
                height="42px"
                borderRadius="10px"
                style={{ flexShrink: 0 }}
              />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <Skeleton width="160px" height="14px" />
                <Skeleton width="100px" height="12px" />
              </div>
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
