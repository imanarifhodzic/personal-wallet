import { useState, useEffect } from "react";
import { savingsAPI } from "../api";
import { useCurrency } from "../context/CurrencyContext";
import EmptyState from "../components/EmptyState";
import { GenericSkeleton } from "../components/Skeleton";
// ...

const COLORS = [
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

export default function Savings() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributingGoal, setContributingGoal] = useState(null);
  const [contributeAmount, setContributeAmount] = useState("");
  const [contributeDate, setContributeDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const { format } = useCurrency();
  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    monthly_contribution: "",
    color: "#534AB7",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await savingsAPI.getAll();
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingGoal(null);
    setForm({
      name: "",
      target_amount: "",
      monthly_contribution: "",
      color: "#534AB7",
    });
    setError("");
    setShowForm(true);
  };

  const openEdit = (goal) => {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      target_amount: goal.target_amount,
      monthly_contribution: goal.monthly_contribution,
      color: goal.color,
    });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingGoal) {
        await savingsAPI.update(editingGoal.id, {
          ...form,
          target_amount: parseFloat(form.target_amount),
          monthly_contribution: parseFloat(form.monthly_contribution),
        });
      } else {
        await savingsAPI.create({
          ...form,
          target_amount: parseFloat(form.target_amount),
          monthly_contribution: parseFloat(form.monthly_contribution),
        });
      }
      await fetchGoals();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) return;
    try {
      await savingsAPI.contribute(contributingGoal.id, {
        amount: parseFloat(contributeAmount),
        date: contributeDate,
      });
      await fetchGoals();
      setContributingGoal(null);
      setContributeAmount("");
      setContributeDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this savings goal?")) return;
    try {
      await savingsAPI.delete(id);
      setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getMonthsLeft = (goal) => {
    const remaining = goal.target_amount - goal.saved_amount;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / goal.monthly_contribution);
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
          Savings goals
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + New goal
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "500", marginBottom: "16px" }}>
            {editingGoal ? "Edit goal" : "New savings goal"}
          </div>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Goal name</label>
                <input
                  type="text"
                  placeholder="e.g. New laptop, Vacation, Emergency fund"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target amount</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  value={form.target_amount}
                  onChange={(e) =>
                    setForm({ ...form, target_amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Monthly contribution</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  value={form.monthly_contribution}
                  onChange={(e) =>
                    setForm({ ...form, monthly_contribution: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Color</label>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "4px",
                }}
              >
                {COLORS.map((color) => (
                  <div
                    key={color}
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: color,
                      cursor: "pointer",
                      border:
                        form.color === color
                          ? "3px solid var(--text-primary)"
                          : "3px solid transparent",
                    }}
                  />
                ))}
              </div>
            </div>

            {form.target_amount && form.monthly_contribution && (
              <div
                style={{
                  background: "var(--purple-light)",
                  borderRadius: "var(--radius)",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "var(--purple)",
                }}
              >
                At {format(form.monthly_contribution)}/month you'll reach your
                goal in{" "}
                <strong>
                  {Math.ceil(form.target_amount / form.monthly_contribution)}{" "}
                  months
                </strong>
              </div>
            )}

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
                  : editingGoal
                    ? "Save changes"
                    : "Create goal"}
              </button>
            </div>
          </form>
        </div>
      )}

      {contributingGoal && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "500", marginBottom: "4px" }}>
            Add contribution
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "16px",
            }}
          >
            Adding money to <strong>{contributingGoal.name}</strong>
          </div>
          <form onSubmit={handleContribute}>
            <div
              style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}
            >
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Amount</label>
                <input
                  type="number"
                  placeholder={`Suggested: ${format(contributingGoal.monthly_contribution)}`}
                  step="0.01"
                  min="0.01"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label>Date</label>
                <input
                  type="date"
                  value={contributeDate}
                  onChange={(e) => setContributeDate(e.target.value)}
                  required
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setContributeAmount(
                    contributingGoal.monthly_contribution.toString(),
                  )
                }
                style={{ whiteSpace: "nowrap" }}
              >
                Use monthly amount
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
                marginTop: "12px",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setContributingGoal(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Add funds
              </button>
            </div>
          </form>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🏆"
            title="No savings goals yet"
            description="Create a goal — like saving for a laptop or vacation — and track your monthly contributions."
            action="+ New goal"
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
          {goals.map((goal) => {
            const percent = Math.min(
              (goal.saved_amount / goal.target_amount) * 100,
              100,
            );
            const isComplete = goal.saved_amount >= goal.target_amount;
            const monthsLeft = getMonthsLeft(goal);

            return (
              <div key={goal.id} className="card">
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
                        background: goal.color,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>
                      {goal.name}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => openEdit(goal)}
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
                      onClick={() => handleDelete(goal.id)}
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
                  <span style={{ color: "var(--text-secondary)" }}>Saved</span>
                  <span
                    style={{
                      fontWeight: "500",
                      color: isComplete
                        ? "var(--income)"
                        : "var(--text-primary)",
                    }}
                  >
                    {format(goal.saved_amount)} / {format(goal.target_amount)}
                  </span>
                </div>

                <div
                  style={{
                    background: "var(--bg)",
                    borderRadius: "99px",
                    height: "6px",
                    overflow: "hidden",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "99px",
                      width: `${percent}%`,
                      background: isComplete
                        ? "var(--income)"
                        : "linear-gradient(90deg, #534AB7 0%, #7F77DD 100%)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    marginBottom: "16px",
                  }}
                >
                  <span>{format(goal.monthly_contribution)}/month</span>
                  {isComplete ? (
                    <span style={{ color: "var(--income)", fontWeight: "500" }}>
                      Goal reached!
                    </span>
                  ) : (
                    <span>
                      {monthsLeft} month{monthsLeft !== 1 ? "s" : ""} left
                    </span>
                  )}
                </div>

                {!isComplete && (
                  <button
                    className="btn-primary"
                    style={{ width: "100%", fontSize: "13px", padding: "7px" }}
                    onClick={() => {
                      setContributingGoal(goal);
                      setContributeAmount("");
                    }}
                  >
                    + Add funds
                  </button>
                )}

                {isComplete && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "7px",
                      background: "var(--income-bg)",
                      borderRadius: "var(--radius)",
                      fontSize: "13px",
                      color: "var(--income)",
                      fontWeight: "500",
                    }}
                  >
                    Completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
