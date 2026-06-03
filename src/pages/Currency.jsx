import { useState, useEffect } from "react";
import axios from "axios";

const CURRENCIES = [
  { code: "BAM", name: "Bosnian Convertible Mark", symbol: "KM", flag: "🇧🇦" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din", flag: "🇷🇸" },
];

export default function Currency() {
  const [amount, setAmount] = useState("1");
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchRates();
  }, [fromCurrency]);

  const fetchRates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      );
      setRates(res.data.rates);
      setLastUpdated(new Date());
    } catch (err) {
      setError("Could not fetch live rates. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const convert = (toCode) => {
    if (!rates || !amount || isNaN(amount)) return "—";
    if (toCode === fromCurrency) return parseFloat(amount).toFixed(2);
    const rate =
      toCode === "BAM"
        ? rates["EUR"]
          ? rates["EUR"] * 1.95583
          : null
        : rates[toCode];
    if (!rate) return "—";
    return (parseFloat(amount) * rate).toFixed(2);
  };

  const getBAMRate = () => {
    if (!rates) return null;
    if (fromCurrency === "BAM") return 1;
    const eurRate = rates["EUR"];
    if (!eurRate) return null;
    return eurRate * 1.95583;
  };

  const formatRate = (toCode) => {
    if (!rates) return "";
    if (toCode === fromCurrency) return "";
    let rate;
    if (toCode === "BAM") {
      rate = getBAMRate();
    } else if (fromCurrency === "BAM") {
      const eurToBAM = 1.95583;
      rate = rates["EUR"] ? rates["EUR"] / eurToBAM : null;
      if (toCode !== "EUR") {
        rate = rates[toCode] ? rates[toCode] / eurToBAM : null;
      }
    } else {
      rate = toCode === "BAM" ? getBAMRate() : rates[toCode];
    }
    if (!rate) return "";
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCode}`;
  };

  return (
    <div className="page" style={{ maxWidth: "680px" }}>
      <h1 className="page-title">Currency converter</h1>

      <div className="card" style={{ marginBottom: "24px" }}>
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
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          <div className="form-group">
            <label>From currency</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {lastUpdated && (
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "4px",
            }}
          >
            Rates last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            background: "var(--expense-bg)",
            color: "var(--expense)",
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            fontSize: "13px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
          Fetching live rates...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {CURRENCIES.map((currency) => {
            const isSource = currency.code === fromCurrency;
            const converted = convert(currency.code);

            return (
              <div
                key={currency.code}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: isSource
                    ? "2px solid var(--purple)"
                    : "1px solid var(--border)",
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div style={{ fontSize: "28px", lineHeight: 1 }}>
                    {currency.flag}
                  </div>
                  <div>
                    <div style={{ fontWeight: "500", fontSize: "14px" }}>
                      {currency.code}
                      {isSource && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "11px",
                            background: "var(--purple-light)",
                            color: "var(--purple)",
                            padding: "2px 8px",
                            borderRadius: "99px",
                            fontWeight: "500",
                          }}
                        >
                          source
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {currency.name}
                    </div>
                    {!isSource && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {formatRate(currency.code)}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "500",
                      color: isSource ? "var(--purple)" : "var(--text-primary)",
                    }}
                  >
                    {currency.symbol} {converted}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          marginTop: "20px",
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: "1.6",
        }}
      >
        BAM is pegged to EUR at a fixed rate of 1 EUR = 1.95583 KM.
        <br />
        All other rates are live from exchangerate-api.com.
      </div>
    </div>
  );
}
