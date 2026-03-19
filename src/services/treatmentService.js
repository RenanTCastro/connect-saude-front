import api from "./api.js";

// --- Procedimentos ---
export const searchProcedures = async (q = "") => {
  const params = q ? { q: q.trim() } : {};
  const response = await api.get("/procedures", { params });
  return response.data;
};

export const createProcedure = async (data) => {
  const response = await api.post("/procedures", data);
  return response.data;
};

// --- Tratamentos do paciente ---
export const getTreatments = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/treatments`);
  return response.data;
};

export const createTreatment = async (patientId, data) => {
  const response = await api.post(`/patients/${patientId}/treatments`, data);
  return response.data;
};

export const updateTreatment = async (treatmentId, data) => {
  const response = await api.put(`/treatments/${treatmentId}`, data);
  return response.data;
};

export const deleteTreatment = async (treatmentId) => {
  const response = await api.delete(`/treatments/${treatmentId}`);
  return response.data;
};

// --- Anotações do odontograma ---
export const getOdontogramAnnotations = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/odontogram-annotations`);
  return response.data;
};

export const createOdontogramAnnotation = async (patientId, data) => {
  const response = await api.post(`/patients/${patientId}/odontogram-annotations`, data);
  return response.data;
};

export const updateOdontogramAnnotation = async (annotationId, data) => {
  const response = await api.put(`/odontogram-annotations/${annotationId}`, data);
  return response.data;
};

export const deleteOdontogramAnnotation = async (annotationId) => {
  const response = await api.delete(`/odontogram-annotations/${annotationId}`);
  return response.data;
};

// --- Evolução do paciente ---
export const getEvolutionFolder = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/evolution-folder`);
  return response.data;
};

export const getEvolutionEntries = async (patientId) => {
  const response = await api.get(`/patients/${patientId}/evolution-entries`);
  return response.data;
};

export const createEvolutionEntry = async (patientId, data) => {
  const response = await api.post(`/patients/${patientId}/evolution-entries`, data);
  return response.data;
};

export const updateEvolutionEntry = async (entryId, data) => {
  const response = await api.put(`/evolution-entries/${entryId}`, data);
  return response.data;
};

export const deleteEvolutionEntry = async (entryId) => {
  const response = await api.delete(`/evolution-entries/${entryId}`);
  return response.data;
};
