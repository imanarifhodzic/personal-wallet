import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mainLinks = [
    { to: "/", label: "Dashboard" },
    { to: "/transactions", label: "Transactions" },
    { to: "/categories", label: "Categories" },
    { to: "/budgets", label: "Budgets" },
    { to: "/savings", label: "Savings" },
  ];

  const dropdownLinks = [
    ...(user?.role === "parent" ? [{ to: "/family", label: "👨‍👩‍👧 Family" }] : []),
    { to: "/currency", label: "💱 Currency" },
    { to: "/profile", label: "👤 Profile" },
  ];

  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="gradient-text"
        style={{ fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
        onClick={() => navigate("/")}
      >
        Personal Wallet
      </div>

      <div style={{ display: "flex", gap: "4px" }}>
        {mainLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
              padding: "6px 14px",
              borderRadius: "var(--radius)",
              fontSize: "13px",
              textDecoration: "none",
              fontWeight: isActive ? "500" : "400",
              background: isActive
                ? "linear-gradient(135deg, #534AB7 0%, #7F77DD 100%)"
                : "transparent",
              color: isActive ? "#fff" : "var(--text-secondary)",
            })}
          >
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: "var(--radius)",
            background: dropdownOpen ? "var(--purple-light)" : "transparent",
            transition: "background 0.15s",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "var(--purple-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--purple)",
              border: "2px solid var(--purple)",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user?.full_name}
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              marginLeft: "-4px",
            }}
          >
            {dropdownOpen ? "▲" : "▼"}
          </span>
        </div>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 8px)",
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "6px",
              minWidth: "180px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              zIndex: 200,
            }}
          >
            {dropdownLinks.map(({ to, label }) => (
              <div
                key={to}
                onClick={() => {
                  navigate(to);
                  setDropdownOpen(false);
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: "var(--radius)",
                  fontSize: "13px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {label}
              </div>
            ))}
            <div
              style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }}
            />
            <div
              onClick={handleLogout}
              style={{
                padding: "9px 12px",
                borderRadius: "var(--radius)",
                fontSize: "13px",
                cursor: "pointer",
                color: "var(--expense)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--expense-bg)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              🚪 Logout
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
