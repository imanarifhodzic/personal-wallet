import { useState, useEffect } from "react";
import { categoriesAPI } from "../api";
import EmptyState from "../components/EmptyState";
import { GenericSkeleton } from "../components/Skeleton";

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

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "expense",
    color: "#534AB7",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingCat(null);
    setForm({ name: "", type: "expense", color: "#534AB7" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setForm({ name: cat.name, type: cat.type, color: cat.color });
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editingCat) {
        await categoriesAPI.update(editingCat.id, form);
      } else {
        await categoriesAPI.create(form);
      }
      await fetchCategories();
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this category? Transactions using it will become uncategorized.",
      )
    )
      return;
    try {
      await categoriesAPI.delete(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  if (loading) return <GenericSkeleton />;

  const CategoryCard = ({ cat }) => (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      <div
        style={{
          height: "6px",
          background: cat.color,
        }}
      />
      <div style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              background: cat.color + "22",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "700",
              color: cat.color,
              flexShrink: 0,
            }}
          >
            {cat.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: "500", fontSize: "14px" }}>
              {cat.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                marginTop: "3px",
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "99px",
                background:
                  cat.type === "income"
                    ? "var(--income-bg)"
                    : "var(--expense-bg)",
                color:
                  cat.type === "income" ? "var(--income)" : "var(--expense)",
                fontWeight: "500",
              }}
            >
              {cat.type}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => openEdit(cat)}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: "var(--radius)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              fontSize: "12px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(cat.id)}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: "var(--radius)",
              background: "var(--expense-bg)",
              border: "1px solid transparent",
              fontSize: "12px",
              color: "var(--expense)",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          Categories
        </h1>
        <button className="btn-primary" onClick={openCreate}>
          + Add category
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: "500", marginBottom: "16px" }}>
            {editingCat ? "Edit category" : "New category"}
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
                <label>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Food, Rent, Salary"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
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
                      transition: "transform 0.1s",
                      transform:
                        form.color === color ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
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
                  : editingCat
                    ? "Save changes"
                    : "Add category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {[
        { label: "Expense categories", list: expense, count: expense.length },
        { label: "Income categories", list: income, count: income.length },
      ].map(({ label, list, count }) => (
        <div key={label} style={{ marginBottom: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--text-primary)",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: "12px",
                padding: "2px 10px",
                borderRadius: "99px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {count}
            </div>
          </div>

          {list.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={label.includes("Expense") ? "🏷️" : "💰"}
                title={`No ${label.toLowerCase()} yet`}
                description={`Create your first ${label.includes("Expense") ? "expense" : "income"} category to start organizing your transactions.`}
                action="+ Add category"
                onAction={openCreate}
              />
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {list.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
