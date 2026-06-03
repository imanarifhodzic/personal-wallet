import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { transactionsAPI } from "../api";
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import EmptyState from "../components/EmptyState";
import { DashboardSkeleton } from "../components/Skeleton";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          transactionsAPI.getSummary(),
          transactionsAPI.getAll(),
        ]);
        setSummary(summaryRes.data);
        setTransactions(txRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const getPieData = () => {
    const expenseMap = {};
    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const name = tx.category_name || "Uncategorized";
        expenseMap[name] = (expenseMap[name] || 0) + tx.amount;
      });
    return Object.entries(expenseMap).map(([name, value]) => ({ name, value }));
  };

  const getBarData = () => {
    const monthMap = {};
    transactions.forEach((tx) => {
      const month = new Date(tx.transaction_date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      if (!monthMap[month]) monthMap[month] = { month, income: 0, expenses: 0 };
      if (tx.type === "income") monthMap[month].income += tx.amount;
      else monthMap[month].expenses += tx.amount;
    });
    return Object.values(monthMap).slice(-6);
  };

  const PIE_COLORS = [
    "#534AB7",
    "#3B6D11",
    "#A32D2D",
    "#854F0B",
    "#0C447C",
    "#085041",
  ];

  const pieData = getPieData();
  const barData = getBarData();
  const recentTransactions = transactions.slice(0, 5);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page">
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{ fontSize: "22px", fontWeight: "500", marginBottom: "4px" }}
        >
          {greeting()}, {user?.full_name?.split(" ")[0]}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Here's your financial overview for{" "}
          {new Date().toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          className="card"
          style={{
            borderLeft: "4px solid var(--income)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "var(--income-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            💰
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Total income
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "var(--income)",
              }}
            >
              {format(summary.income)}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: "4px solid var(--expense)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "var(--expense-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            💸
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Total expenses
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "var(--expense)",
              }}
            >
              {format(summary.expenses)}
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: "4px solid var(--purple)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "var(--purple-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Balance
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "600",
                color: "var(--purple)",
              }}
            >
              {format(summary.balance)}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <div style={{ fontWeight: "500", marginBottom: "16px" }}>
            Spending by category
          </div>
          {pieData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              No expense data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => format(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            {pieData.map((entry, index) => (
              <div
                key={entry.name}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: PIE_COLORS[index % PIE_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  {entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: "500", marginBottom: "16px" }}>
            Income vs expenses
          </div>
          {barData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={16}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f0efe8"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#888780" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#888780" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => format(v)}
                />
                <Tooltip formatter={(value) => format(value)} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#3B6D11"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#A32D2D"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontWeight: "500" }}>Recent transactions</div>
          <Link
            to="/transactions"
            style={{
              fontSize: "13px",
              color: "var(--purple)",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon="📊"
            title="No transactions yet"
            description="Add your first transaction to see your financial overview here."
            action="Go to Transactions"
            onAction={() => navigate("/transactions")}
          />
        ) : (
          recentTransactions.map((tx) => (
            <div
              key={tx.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "14px" }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background:
                      tx.type === "income"
                        ? "var(--income-bg)"
                        : "var(--purple-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: "600",
                    color:
                      tx.type === "income" ? "var(--income)" : "var(--purple)",
                  }}
                >
                  {(tx.category_name || tx.description || "U")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "500" }}>
                    {tx.description || "No description"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "3px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "99px",
                        background:
                          tx.type === "income"
                            ? "var(--income-bg)"
                            : "var(--purple-light)",
                        color:
                          tx.type === "income"
                            ? "var(--income)"
                            : "var(--purple)",
                        fontWeight: "500",
                      }}
                    >
                      {tx.category_name || "Uncategorized"}
                    </span>
                    <span
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {formatDate(tx.transaction_date)}
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  color:
                    tx.type === "income" ? "var(--income)" : "var(--expense)",
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
  );
}
