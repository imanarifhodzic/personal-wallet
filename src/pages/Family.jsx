import { useState, useEffect } from "react";
import { familyAPI } from "../api";
import { useCurrency } from "../context/CurrencyContext";
import { GenericSkeleton } from "../components/Skeleton";
// ...

export default function Family() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childData, setChildData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);
  const { format } = useCurrency();

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await familyAPI.getChildren();
      setChildren(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewChild = async (child) => {
    setSelectedChild(child);
    setLoadingChild(true);
    try {
      const res = await familyAPI.getChildSummary(child.id);
      setChildData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChild(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (loading) return <GenericSkeleton />;
  return (
    <div className="page">
      <h1 className="page-title">Family</h1>

      {children.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "var(--text-secondary)",
            fontSize: "13px",
          }}
        >
          No linked child accounts yet. A child under 16 can link to your
          account during registration.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          <div className="card" style={{ padding: "8px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--text-secondary)",
                padding: "8px 12px",
                marginBottom: "4px",
              }}
            >
              LINKED ACCOUNTS
            </div>
            {children.map((child) => (
              <div
                key={child.id}
                onClick={() => viewChild(child)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  cursor: "pointer",
                  background:
                    selectedChild?.id === child.id
                      ? "var(--purple-light)"
                      : "transparent",
                  color:
                    selectedChild?.id === child.id
                      ? "var(--purple)"
                      : "var(--text-primary)",
                }}
              >
                <div style={{ fontWeight: "500", fontSize: "14px" }}>
                  {child.full_name}
                </div>
                <div
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  Age {child.age}
                </div>
              </div>
            ))}
          </div>

          <div>
            {!selectedChild ? (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  padding: "48px 0",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                }}
              >
                Select a child account to view their activity
              </div>
            ) : loadingChild ? (
              <div className="card" style={{ color: "var(--text-secondary)" }}>
                Loading...
              </div>
            ) : (
              childData && (
                <div>
                  <div
                    style={{
                      fontWeight: "500",
                      fontSize: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    {childData.child.full_name}'s activity
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      marginBottom: "20px",
                    }}
                  >
                    <div className="card">
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginBottom: "8px",
                        }}
                      >
                        Income
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "500",
                          color: "var(--income)",
                        }}
                      >
                        {format(childData.summary.income)}
                      </div>
                    </div>
                    <div className="card">
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginBottom: "8px",
                        }}
                      >
                        Expenses
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "500",
                          color: "var(--expense)",
                        }}
                      >
                        {format(childData.summary.expenses)}
                      </div>
                    </div>
                    <div className="card">
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginBottom: "8px",
                        }}
                      >
                        Balance
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "500",
                          color: "var(--purple)",
                        }}
                      >
                        {format(childData.summary.balance)}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div style={{ fontWeight: "500", marginBottom: "16px" }}>
                      Recent transactions
                    </div>
                    {childData.transactions.length === 0 ? (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          padding: "16px 0",
                          textAlign: "center",
                        }}
                      >
                        No transactions yet
                      </div>
                    ) : (
                      childData.transactions.map((tx) => (
                        <div
                          key={tx.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                flexShrink: 0,
                                background:
                                  tx.type === "income"
                                    ? "var(--income)"
                                    : "var(--expense)",
                              }}
                            />
                            <div>
                              <div style={{ fontSize: "14px" }}>
                                {tx.description || "No description"}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {tx.category_name || "Uncategorized"} ·{" "}
                                {formatDate(tx.transaction_date)}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color:
                                tx.type === "income"
                                  ? "var(--income)"
                                  : "var(--expense)",
                            }}
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {format(tx.amount)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
