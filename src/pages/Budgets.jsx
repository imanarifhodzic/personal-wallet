import { useState, useEffect } from "react";
import { budgetsAPI, categoriesAPI } from "../api";
import { useCurrency } from "../context/CurrencyContext";
import EmptyState from "../components/EmptyState";
import { GenericSkeleton } from "../components/Skeleton";
// ...

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { format } = useCurrency();
  const [form, setForm] = useState({
    category_id: "",
    limit_amount: "",
    period: "monthly",
    start_date: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, catRes] = await Promise.all([
        budgetsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setBudgets(budgetRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingBudget(null);
    setForm({
      category_id: "",
      limit_amount: "",
      period: "monthly",
      start_date: "",
    });
    setError("");
    setShowForm(true);
  };

  const openEdit = (budget) => {
    setEditingBudget(budget);
    setForm({
      category_id: budget.category_id,
      limit_amount: budget.limit_amount,
      period: budget.period,
      start_date: budget.start_date,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingBudget) {
        await budgetsAPI.update(editingBudget.id, {
          ...form,
          limit_amount: parseFloat(form.limit_amount),
        });
      } else {
        await budgetsAPI.create({
          ...form,
          limit_amount: parseFloat(form.limit_amount),
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
    if (!window.confirm("Delete this budget?")) return;
    try {
      await budgetsAPI.delete(id);
      setBudgets(budgets.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return "var(--expense)";
    if (percent >= 80) return "#854F0B";
    return "var(--purple)";
  };

  if (loading) return <GenericSkeleton />;

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
          Budgets
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + Add budget
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "500", marginBottom: "16px" }}>
            {editingBudget ? "Edit budget" : "New budget"}
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
                <label>Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Monthly limit</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={form.limit_amount}
                  onChange={(e) =>
                    setForm({ ...form, limit_amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Period</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                  required
                />
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
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingBudget
                    ? "Save changes"
                    : "Add budget"}
              </button>
            </div>
          </form>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🎯"
            title="No budgets set"
            description="Set monthly spending limits per category and track how well you're sticking to them."
            action="+ Add budget"
            onAction={openCreate}
          />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {budgets.map((budget) => {
            const percent = Math.min(
              (budget.spent_amount / budget.limit_amount) * 100,
              100,
            );
            const progressColor = getProgressColor(percent);
            const isOver = budget.spent_amount > budget.limit_amount;

            return (
              <div key={budget.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        background: budget.category_color || "var(--purple)",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>
                      {budget.category_name}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => openEdit(budget)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12px",
                        color: "var(--expense)",
                        cursor: "pointer",
                        padding: "2px 6px",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>Spent</span>
                  <span style={{ color: progressColor, fontWeight: "500" }}>
                    {format(budget.spent_amount)} /{" "}
                    {format(budget.limit_amount)}
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    borderRadius: "99px",
                    height: "6px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "99px",
                      width: `${percent}%`,
                      background:
                        progressColor === "var(--purple)"
                          ? "linear-gradient(90deg, #534AB7 0%, #7F77DD 100%)"
                          : progressColor,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <span>{budget.period}</span>
                  {isOver ? (
                    <span
                      style={{ color: "var(--expense)", fontWeight: "500" }}
                    >
                      Over budget
                    </span>
                  ) : (
                    <span>{Math.round(100 - percent)}% remaining</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
