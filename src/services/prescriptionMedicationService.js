import api from "./api.js";

export const searchMedications = async (q = "") => {
  const trimmed = String(q || "").trim();
  if (trimmed.length < 2) return [];
  const response = await api.get("/prescription-medications", { params: { q: trimmed } });
  return response.data;
};
