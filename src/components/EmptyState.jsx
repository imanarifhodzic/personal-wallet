export default function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "var(--purple-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
          marginBottom: "16px",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontWeight: "600",
          fontSize: "15px",
          marginBottom: "8px",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "13px",
          color: "var(--text-secondary)",
          maxWidth: "280px",
          lineHeight: "1.6",
          marginBottom: action ? "20px" : "0",
        }}
      >
        {description}
      </div>
      {action && (
        <button
          className="btn-primary"
          onClick={onAction}
          style={{ marginTop: "4px" }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
