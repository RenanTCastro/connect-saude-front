import api from "./api.js";

export const requestLogoUploadUrl = async (file) => {
  const response = await api.post("/me/logo/upload-url", {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  });
  return response.data;
};

export const getLogoUrl = async () => {
  const response = await api.get("/me/logo/url");
  return response.data;
};

export const deleteLogo = async () => {
  const response = await api.delete("/me/logo");
  return response.data;
};
