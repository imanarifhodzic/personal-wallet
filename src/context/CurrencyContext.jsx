import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CurrencyContext = createContext(null);

export const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "BAM", name: "Convertible Mark", symbol: "KM" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din" },
];

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem("preferredCurrency") || "USD",
  );
  const [rates, setRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      setLoadingRates(true);
      try {
        const res = await axios.get(
          "https://api.exchangerate-api.com/v4/latest/USD",
        );
        const r = res.data.rates;
        r["BAM"] = r["EUR"] * 1.95583;
        setRates(r);
      } catch (err) {
        console.error("Could not fetch exchange rates");
      } finally {
        setLoadingRates(false);
      }
    };
    fetchRates();
  }, []);

  const changeCurrency = (code) => {
    setCurrency(code);
    localStorage.setItem("preferredCurrency", code);
  };

  const format = (amountInUSD) => {
    if (loadingRates) return "...";
    const rate = rates[currency] || 1;
    const converted = (amountInUSD || 0) * rate;
    const curr = CURRENCIES.find((c) => c.code === currency);
    return `${curr?.symbol || ""} ${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, changeCurrency, format, loadingRates, CURRENCIES }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
