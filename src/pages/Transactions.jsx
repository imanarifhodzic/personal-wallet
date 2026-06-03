import { useState, useEffect } from "react";
import { transactionsAPI, categoriesAPI } from "../api";
import { useCurrency } from "../context/CurrencyContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import EmptyState from "../components/EmptyState";
import { TransactionsSkeleton } from "../components/Skeleton";
// ...

const PIE_COLORS = [
  "#534AB7",
  "#E05C5C",
  "#3DAB7B",
  "#F0A500",
  "#3A9BD5",
  "#E8724A",
  "#9B59B6",
  "#2ECC71",
  "#E91E8C",
  "#00BCD4",
  "#FF7043",
  "#607D8B",
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [view, setView] = useState("transactions");
  const { format } = useCurrency();
  const [form, setForm] = useState({
    amount: "",
    type: "expense",
    description: "",
    transaction_date: "",
    category_id: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        transactionsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingTx(null);
    setForm({
      amount: "",
      type: "expense",
      description: "",
      transaction_date: "",
      category_id: "",
    });
    setError("");
    setShowForm(true);
  };

  const openEdit = (tx) => {
    setEditingTx(tx);
    setForm({
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      transaction_date: tx.transaction_date,
      category_id: tx.category_id || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amount || !form.transaction_date)
      return setError("Amount and date are required");
    setSaving(true);
    try {
      if (editingTx) {
        await transactionsAPI.update(editingTx.id, {
          ...form,
          amount: parseFloat(form.amount),
          category_id: form.category_id || null,
        });
      } else {
        await transactionsAPI.create({
          ...form,
          amount: parseFloat(form.amount),
          category_id: form.category_id || null,
        });
      }
      await fetchData();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this transaction?")) return;
    try {
      await transactionsAPI.delete(id);
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  // Get all unique months from transactions
  const getMonths = () => {
    const monthSet = new Set();
    transactions.forEach((tx) => {
      const [year, month] = tx.transaction_date.split("T")[0].split("-");
      const key = `${year}-${month}`;
      console.log("tx date:", tx.transaction_date, "→ key:", key);
      monthSet.add(key);
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  };

  const formatMonthLabel = (key) => {
    const [year, month] = key.split("-");
    return new Date(year, parseInt(month) - 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  // Filter transactions by selected month and type
  const getFiltered = () => {
    return transactions.filter((tx) => {
      const [year, month] = tx.transaction_date.split("T")[0].split("-");
      const key = `${year}-${month}`;
      const monthMatch = selectedMonth === "all" || key === selectedMonth;
      const typeMatch = filter === "all" || tx.type === filter;
      return monthMatch && typeMatch;
    });
  };

  // Summary for selected month
  const getSummary = (txList) => {
    const income = txList
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenses = txList
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  // Pie chart data for selected month
  const getPieData = (txList) => {
    const expenseMap = {};
    txList
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const name = tx.category_name || "Uncategorized";
        expenseMap[name] = (expenseMap[name] || 0) + tx.amount;
      });
    return Object.entries(expenseMap).map(([name, value]) => ({ name, value }));
  };

  const months = getMonths();
  const filtered = getFiltered();
  const summary = getSummary(filtered);
  const pieData = getPieData(filtered);

  if (loading) return <TransactionsSkeleton />;

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          Transactions
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + Add transaction
        </button>
      </div>

      {/* View tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "20px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "0",
        }}
      >
        {[
          { key: "transactions", label: "All transactions" },
          { key: "history", label: "Monthly history" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setView(tab.key);
              setSelectedMonth("all");
            }}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom:
                view === tab.key
                  ? "2px solid var(--purple)"
                  : "2px solid transparent",
              color:
                view === tab.key ? "var(--purple)" : "var(--text-secondary)",
              fontWeight: view === tab.key ? "500" : "400",
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Monthly history view */}
      {view === "history" && (
        <div>
          {months.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: "center",
                padding: "48px 0",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              No transaction history yet.
            </div>
          ) : (
            <div
              style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}
            >
              {/* Month selector */}
              <div
                className="card"
                style={{ padding: "8px", minWidth: "180px", flexShrink: 0 }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "var(--text-secondary)",
                    padding: "8px 12px",
                    marginBottom: "4px",
                  }}
                >
                  SELECT MONTH
                </div>
                {months.map((month) => (
                  <div
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--radius)",
                      cursor: "pointer",
                      background:
                        selectedMonth === month
                          ? "var(--purple-light)"
                          : "transparent",
                      color:
                        selectedMonth === month
                          ? "var(--purple)"
                          : "var(--text-primary)",
                      fontWeight: selectedMonth === month ? "500" : "400",
                      fontSize: "13px",
                    }}
                  >
                    {formatMonthLabel(month)}
                  </div>
                ))}
              </div>

              {/* Month content */}
              <div style={{ flex: 1 }}>
                {selectedMonth === "all" ? (
                  <div
                    className="card"
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Select a month to view details
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      {formatMonthLabel(selectedMonth)}
                    </div>

                    {/* Summary cards */}
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
                            marginBottom: "6px",
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
                          {format(summary.income)}
                        </div>
                      </div>
                      <div className="card">
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginBottom: "6px",
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
                          {format(summary.expenses)}
                        </div>
                      </div>
                      <div className="card">
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
                            fontSize: "20px",
                            fontWeight: "500",
                            color: "var(--purple)",
                          }}
                        >
                          {format(summary.balance)}
                        </div>
                      </div>
                    </div>

                    {/* Pie chart */}
                    {pieData.length > 0 && (
                      <div className="card" style={{ marginBottom: "20px" }}>
                        <div
                          style={{ fontWeight: "500", marginBottom: "16px" }}
                        >
                          Spending by category
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
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
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background:
                                    PIE_COLORS[index % PIE_COLORS.length],
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {entry.name} — {format(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transaction list for that month */}
                    <div className="card">
                      <div style={{ fontWeight: "500", marginBottom: "16px" }}>
                        Transactions
                      </div>
                      {filtered.length === 0 ? (
                        <EmptyState
                          icon="💸"
                          title="No transactions yet"
                          description="Start tracking your money by adding your first income or expense."
                          action="+ Add transaction"
                          onAction={openCreate}
                        />
                      ) : (
                        filtered.map((tx) => (
                          <div
                            key={tx.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "12px 0",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
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
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All transactions view */}
      {view === "transactions" && (
        <div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {["all", "income", "expense"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "99px",
                  fontSize: "13px",
                  border: "1px solid var(--border)",
                  background: filter === f ? "var(--purple)" : "var(--surface)",
                  color: filter === f ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom: "20px" }}>
              <div style={{ fontWeight: "500", marginBottom: "16px" }}>
                {editingTx ? "Edit transaction" : "New transaction"}
              </div>
              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={form.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g. Grocery shopping"
                      value={form.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="transaction_date"
                      value={form.transaction_date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category_id"
                      value={form.category_id}
                      onChange={handleChange}
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {error && (
                  <div className="error-msg" style={{ marginBottom: "12px" }}>
                    {error}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingTx
                        ? "Save changes"
                        : "Add transaction"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            {transactions.filter((tx) => filter === "all" || tx.type === filter)
              .length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                }}
              >
                No transactions found.
              </div>
            ) : (
              transactions
                .filter((tx) => filter === "all" || tx.type === filter)
                .map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
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
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
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
                      <button
                        onClick={() => openEdit(tx)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "13px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "13px",
                          color: "var(--expense)",
                          cursor: "pointer",
                          padding: "4px 8px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
