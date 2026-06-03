import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { profileAPI, transactionsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { useCurrency, CURRENCIES } from "../context/CurrencyContext";
import { GenericSkeleton } from "../components/Skeleton";
// ...

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { currency, changeCurrency } = useCurrency();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  const [nameForm, setNameForm] = useState({ full_name: "" });
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [passForm, setPassForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passSaving, setPassSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, txRes] = await Promise.all([
          profileAPI.get(),
          transactionsAPI.getAll(),
        ]);
        setProfile(profileRes.data);
        setNameForm({ full_name: profileRes.data.full_name });

        const txs = txRes.data;
        const totalIncome = txs
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0);
        const totalExpenses = txs
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0);
        setStats({ totalTransactions: txs.length, totalIncome, totalExpenses });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");
    setNameSaving(true);
    try {
      const res = await profileAPI.updateName(nameForm);
      setProfile(res.data);
      const token = localStorage.getItem("token");
      login(token, res.data);
      setNameSuccess("Name updated successfully");
    } catch (err) {
      setNameError(err.response?.data?.error || "Something went wrong");
    } finally {
      setNameSaving(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    if (passForm.new_password !== passForm.confirm_password) {
      return setPassError("New passwords do not match");
    }
    setPassSaving(true);
    try {
      await profileAPI.updatePassword({
        current_password: passForm.current_password,
        new_password: passForm.new_password,
      });
      setPassSuccess("Password updated successfully");
      setPassForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPassError(err.response?.data?.error || "Something went wrong");
    } finally {
      setPassSaving(false);
    }
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  if (loading) return <GenericSkeleton />;

  return (
    <div className="page" style={{ maxWidth: "960px" }}>
      <h1 className="page-title">Profile</h1>

      {/* Top profile banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          color: "#fff",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            border: "3px solid rgba(255,255,255,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            fontWeight: "700",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}
          >
            {profile?.full_name}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.8, marginBottom: "4px" }}>
            {profile?.email}
          </div>
          <div
            style={{
              display: "inline-block",
              fontSize: "11px",
              padding: "3px 10px",
              borderRadius: "99px",
              background: "rgba(255,255,255,0.2)",
              fontWeight: "500",
              marginTop: "4px",
            }}
          >
            {profile?.role === "child"
              ? "👶 Child account"
              : "👤 Parent account"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "700" }}>
              {stats.totalTransactions}
            </div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "2px" }}>
              Transactions
            </div>
          </div>
          <div style={{ width: "1px", background: "rgba(255,255,255,0.2)" }} />
          <div>
            <div
              style={{ fontSize: "13px", opacity: 0.7, marginBottom: "2px" }}
            >
              Member since
            </div>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>
              {new Date(profile?.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Change name */}
          <div className="card">
            <div
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>✏️</span> Change name
            </div>
            <form onSubmit={handleNameSubmit}>
              <div className="form-group">
                <label>Full name</label>
                <input
                  type="text"
                  value={nameForm.full_name}
                  onChange={(e) => setNameForm({ full_name: e.target.value })}
                  required
                />
              </div>
              {nameError && (
                <div className="error-msg" style={{ marginBottom: "12px" }}>
                  {nameError}
                </div>
              )}
              {nameSuccess && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--income)",
                    marginBottom: "12px",
                  }}
                >
                  {nameSuccess}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={nameSaving}
                >
                  {nameSaving ? "Saving..." : "Save name"}
                </button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="card">
            <div
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🔒</span> Change password
            </div>
            <form onSubmit={handlePassSubmit}>
              <div className="form-group">
                <label>Current password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passForm.current_password}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      current_password: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={passForm.new_password}
                  onChange={(e) =>
                    setPassForm({ ...passForm, new_password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm new password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passForm.confirm_password}
                  onChange={(e) =>
                    setPassForm({
                      ...passForm,
                      confirm_password: e.target.value,
                    })
                  }
                  required
                />
              </div>
              {passError && (
                <div className="error-msg" style={{ marginBottom: "12px" }}>
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--income)",
                    marginBottom: "12px",
                  }}
                >
                  {passSuccess}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passSaving}
                >
                  {passSaving ? "Saving..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Display currency */}
          <div className="card">
            <div
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "6px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>💱</span> Display currency
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "16px",
              }}
            >
              All amounts across the app will be displayed in your selected
              currency.
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {CURRENCIES.map((c) => (
                <div
                  key={c.code}
                  onClick={() => changeCurrency(c.code)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 14px",
                    borderRadius: "var(--radius)",
                    border:
                      currency === c.code
                        ? "2px solid var(--purple)"
                        : "1px solid var(--border)",
                    background:
                      currency === c.code
                        ? "var(--purple-light)"
                        : "var(--surface)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {currency === c.code && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--purple)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontWeight: "500",
                        color:
                          currency === c.code
                            ? "var(--purple)"
                            : "var(--text-primary)",
                      }}
                    >
                      {c.code}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontWeight: "600",
                      fontSize: "15px",
                      color:
                        currency === c.code
                          ? "var(--purple)"
                          : "var(--text-secondary)",
                    }}
                  >
                    {c.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="card">
            <div
              style={{
                fontWeight: "600",
                fontSize: "15px",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>📋</span> Account info
            </div>
            {[
              { label: "Email", value: profile?.email },
              {
                label: "Account type",
                value:
                  profile?.role === "child"
                    ? "Child account"
                    : "Parent account",
              },
              {
                label: "Member since",
                value: new Date(profile?.created_at).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                ),
              },
              { label: "Total transactions", value: stats.totalTransactions },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                >
                  {label}
                </span>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
