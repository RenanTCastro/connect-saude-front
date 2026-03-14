import api from "./api.js";

// Solicita URL de upload (presigned URL)
export const requestUploadUrl = async (patientId, file, folderId = null) => {
  const fileType = file.type?.startsWith("image/") ? "image" : "document";
  
  const response = await api.post(`/patients/${patientId}/attachments/upload-url`, {
    fileName: file.name,
    fileType,
    fileSize: file.size,
    folderId,
    mimeType: file.type,
  });
  
  return response.data;
};

// Confirma upload e salva no banco
export const confirmUpload = async (patientId, fileData) => {
  const response = await api.post(`/patients/${patientId}/attachments/confirm`, fileData);
  return response.data;
};

// Lista anexos e pastas do paciente
export const getAttachments = async (patientId, folderId = null) => {
  const params = folderId !== null && folderId !== undefined ? { folderId } : {};
  const response = await api.get(`/patients/${patientId}/attachments`, { params });
  return response.data;
};

// Obtém URL de download (presigned URL)
export const getDownloadUrl = async (attachmentId) => {
  const response = await api.get(`/attachments/${attachmentId}/download-url`);
  return response.data;
};

// Deleta anexo
export const deleteAttachment = async (attachmentId) => {
  const response = await api.delete(`/attachments/${attachmentId}`);
  return response.data;
};

// Criar pasta
export const createFolder = async (patientId, name, parentId = null) => {
  const response = await api.post(`/patients/${patientId}/folders`, {
    name,
    parentId,
  });
  return response.data;
};

// Atualizar nome da pasta
export const updateFolder = async (folderId, name) => {
  const response = await api.put(`/folders/${folderId}`, { name });
  return response.data;
};

// Deletar pasta
export const deleteFolder = async (folderId) => {
  const response = await api.delete(`/folders/${folderId}`);
  return response.data;
};

// Mover anexo entre pastas
export const moveAttachment = async (attachmentId, targetFolderId) => {
  const response = await api.put(`/attachments/${attachmentId}/move`, {
    targetFolderId,
  });
  return response.data;
};
