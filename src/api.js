import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  verifyLink: (data) => api.post("/auth/verify-link", data),
};

export const familyAPI = {
  getChildren: () => api.get("/family/children"),
  getChildSummary: (childId) => api.get(`/family/child/${childId}`),
};

export const transactionsAPI = {
  getAll: () => api.get("/transactions"),
  getSummary: () => api.get("/transactions/summary"),
  create: (data) => api.post("/transactions", data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

export const categoriesAPI = {
  getAll: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const budgetsAPI = {
  getAll: () => api.get("/budgets"),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export const profileAPI = {
  get: () => api.get("/profile"),
  updateName: (data) => api.put("/profile/name", data),
  updatePassword: (data) => api.put("/profile/password", data),
};

export const savingsAPI = {
  getAll: () => api.get("/savings"),
  create: (data) => api.post("/savings", data),
  contribute: (id, data) => api.post(`/savings/${id}/contribute`, data),
  update: (id, data) => api.put(`/savings/${id}`, data),
  delete: (id) => api.delete(`/savings/${id}`),
};

export default api;
