import api from "./api.js";

export const getBudgets = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/budgets`);
  return response.data;
};

export const getBudget = async (id) => {
  const response = await api.get(`/budgets/${id}`);
  return response.data;
};

export const createBudget = async (patientId, data) => {
  const response = await api.post(`/patients/${patientId}/budgets`, data);
  return response.data;
};

export const updateBudget = async (id, data) => {
  const response = await api.put(`/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};
