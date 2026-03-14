import { useState, useRef, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  message,
  Image,
  Popconfirm,
  Breadcrumb,
  Empty,
  Upload,
  Spin,
} from "antd";
import {
  FolderOutlined,
  FolderOpenOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CameraOutlined,
  UploadOutlined,
  HomeOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import "./ImagesTab.css";
import {
  requestUploadUrl,
  confirmUpload,
  getAttachments,
  getDownloadUrl,
  deleteAttachment,
  createFolder,
  updateFolder,
  deleteFolder,
  moveAttachment,
} from "../../../services/attachmentService";

const { Title, Text } = Typography;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB em bytes

export default function ImagesTab({ patientId }) {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [draggedImage, setDraggedImage] = useState(null);
  const [draggedOverFolder, setDraggedOverFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState({}); // Mapeia imageId -> downloadUrl
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Carregar URL de download de uma imagem
  const loadImageUrl = async (imageId) => {
    if (imageUrls[imageId] || loadingImages.has(imageId)) return;
    
    setLoadingImages((prev) => new Set(prev).add(imageId));
    try {
      const { downloadUrl } = await getDownloadUrl(imageId);
      setImageUrls((prev) => ({ ...prev, [imageId]: downloadUrl }));
    } catch (error) {
      console.error("Erro ao carregar URL da imagem:", error);
    } finally {
      setLoadingImages((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  // Carregar pastas e anexos do backend
  const loadAttachments = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const data = await getAttachments(patientId, currentFolderId);
      setFolders(data.folders || []);
      setImages(data.attachments || []);
      
      // Carregar URLs de download para todas as imagens
      const imageAttachments = (data.attachments || []).filter((img) => img.file_type === "image");
      imageAttachments.forEach((img) => {
        loadImageUrl(img.id);
      });
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
      messageApi.error("Erro ao carregar anexos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [patientId, currentFolderId]);

  const getCurrentPath = () => {
    if (!currentFolderId) return [];
    const path = [];
    let folder = folders.find((f) => f.id === currentFolderId);
    while (folder) {
      path.unshift(folder);
      folder = folder.parent_id ? folders.find((f) => f.id === folder.parent_id) : null;
    }
    return path;
  };

  const getCurrentFolders = () => {
    return folders.filter((f) => {
      if (currentFolderId === null) {
        return f.parent_id === null;
      }
      return f.parent_id === currentFolderId;
    });
  };

  const getCurrentImages = () => {
    return images.filter((img) => {
      if (currentFolderId === null) {
        return img.folder_id === null;
      }
      return img.folder_id === currentFolderId;
    });
  };

  const handleCreateFolder = () => {
    form.resetFields();
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createFolder(patientId, values.name, currentFolderId);
      messageApi.success("Pasta criada com sucesso!");
      setIsCreateFolderModalOpen(false);
      form.resetFields();
      loadAttachments();
    } catch (error) {
      console.error(error);
      messageApi.error(error.response?.data?.error || "Erro ao criar pasta");
    }
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    editForm.setFieldsValue({ name: folder.name });
    setIsEditFolderModalOpen(true);
  };

  const handleEditFolderSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      await updateFolder(editingFolder.id, values.name);
      messageApi.success("Nome da pasta atualizado!");
      setIsEditFolderModalOpen(false);
      setEditingFolder(null);
      editForm.resetFields();
      loadAttachments();
    } catch (error) {
      console.error(error);
      messageApi.error(error.response?.data?.error || "Erro ao atualizar pasta");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      messageApi.success("Pasta excluída com sucesso!");
      loadAttachments();
    } catch (error) {
      console.error(error);
      messageApi.error(error.response?.data?.error || "Erro ao excluir pasta");
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await deleteAttachment(imageId);
      messageApi.success("Anexo excluído com sucesso!");
      loadAttachments();
    } catch (error) {
      console.error(error);
      messageApi.error(error.response?.data?.error || "Erro ao excluir anexo");
    }
  };

  const handleImageClick = async (image) => {
    setSelectedImage(image);
    setIsImageViewerOpen(true);
    
    // Carregar URL de download para imagens se ainda não estiver carregada
    if (image.file_type === "image" && !imageUrls[image.id]) {
      await loadImageUrl(image.id);
    }
  };

  const getFileType = (file) => {
    if (file.type.startsWith("image/")) {
      return "image";
    }
    return "document";
  };

  const getFileIcon = (fileName, type) => {
    if (type === "image") return null;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FilePdfOutlined style={{ fontSize: 48, color: "#ff4d4f" }} />;
    if (["doc", "docx"].includes(ext)) return <FileTextOutlined style={{ fontSize: 48, color: "#1890ff" }} />;
    return <FileOutlined style={{ fontSize: 48, color: "#8c8c8c" }} />;
  };

  const handleFileUpload = async (file) => {
    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      messageApi.error(`Arquivo muito grande! O tamanho máximo permitido é 20MB. O arquivo "${file.name}" tem ${fileSizeMB}MB.`);
      return;
    }

    setUploading(true);
    try {
      // 1. Solicitar URL de upload
      const uploadData = await requestUploadUrl(patientId, file, currentFolderId);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d13a1be9-16a7-4807-ac4a-57af8f7d3bb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ImagesTab.jsx:243',message:'Presigned URL recebida',data:{uploadUrl:uploadData.uploadUrl.substring(0,100)+'...',fileId:uploadData.fileId,fileName:file.name,fileSize:file.size,fileType:file.type},timestamp:Date.now(),runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      // 2. Fazer upload direto para S3
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d13a1be9-16a7-4807-ac4a-57af8f7d3bb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ImagesTab.jsx:246',message:'Iniciando upload para S3',data:{method:'PUT',hasBody:!!file,contentType:file.type||'application/octet-stream',urlDomain:new URL(uploadData.uploadUrl).hostname},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d13a1be9-16a7-4807-ac4a-57af8f7d3bb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ImagesTab.jsx:254',message:'Resposta do upload S3',data:{status:uploadResponse.status,statusText:uploadResponse.statusText,ok:uploadResponse.ok,headers:Object.fromEntries(uploadResponse.headers.entries())},timestamp:Date.now(),runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d13a1be9-16a7-4807-ac4a-57af8f7d3bb6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ImagesTab.jsx:256',message:'Erro no upload S3',data:{status:uploadResponse.status,statusText:uploadResponse.statusText,errorText:errorText.substring(0,200)},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw new Error(`Erro ao fazer upload para S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // 3. Confirmar upload e salvar no banco
      await confirmUpload(patientId, {
        fileId: uploadData.fileId,
        fileName: file.name,
        fileType: uploadData.fileType,
        fileSize: file.size,
        folderId: currentFolderId,
        s3Key: uploadData.s3Key,
        mimeType: file.type,
      });

      messageApi.success("Arquivo adicionado com sucesso!");
      loadAttachments();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      messageApi.error(error.response?.data?.error || "Erro ao fazer upload do arquivo");
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input
    e.target.value = "";
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      handleFileUpload(file);
    });
    // Reset input
    e.target.value = "";
  };

  const handleDragStart = (e, image) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverFolder(folderId);
  };

  const handleDragLeave = () => {
    setDraggedOverFolder(null);
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    if (draggedImage) {
      try {
        await moveAttachment(draggedImage.id, targetFolderId);
        messageApi.success("Anexo movido com sucesso!");
        loadAttachments();
      } catch (error) {
        console.error(error);
        messageApi.error(error.response?.data?.error || "Erro ao mover anexo");
      }
    }
    setDraggedImage(null);
    setDraggedOverFolder(null);
  };

  const handleBreadcrumbClick = (folderId) => {
    setCurrentFolderId(folderId);
  };

  const handleDownloadImage = async (image) => {
    try {
      const { downloadUrl, fileName } = await getDownloadUrl(image.id);
      
      // Fazer fetch do arquivo e criar blob para download real
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Erro ao baixar arquivo");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      messageApi.success("Download iniciado!");
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      messageApi.error(error.response?.data?.error || "Erro ao fazer download do anexo");
    }
  };

  const currentPath = getCurrentPath();
  const currentFolders = getCurrentFolders();
  const currentImages = getCurrentImages();

  return (
    <div className="images-tab-container">
      {contextHolder}
      
      <div className="images-tab-header">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateFolder}
          >
            Nova Pasta
          </Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            Adicionar Anexo
          </Button>
          <Button
            icon={<CameraOutlined />}
            onClick={handleCameraCapture}
          >
            Tirar Foto
          </Button>
        </Space>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleCameraFileChange}
      />

      {currentFolderId && (
        <Breadcrumb className="images-breadcrumb">
          <Breadcrumb.Item>
            <Button
              type="link"
              icon={<HomeOutlined />}
              onClick={() => setCurrentFolderId(null)}
              style={{ padding: 0 }}
            >
              Raiz
            </Button>
          </Breadcrumb.Item>
          {currentPath.map((folder) => (
            <Breadcrumb.Item key={folder.id}>
              <Button
                type="link"
                onClick={() => handleBreadcrumbClick(folder.id)}
                style={{ padding: 0 }}
              >
                {folder.name}
              </Button>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}

      <div className="images-content">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
        {currentFolders.length > 0 && (
          <div className="folders-section">
            <Title level={5}>Pastas</Title>
            <div className="folders-grid">
              {currentFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className={`folder-card ${draggedOverFolder === folder.id ? "drag-over" : ""}`}
                  hoverable
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  actions={[
                    <EditOutlined
                      key="edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditFolder(folder);
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Tem certeza que deseja excluir esta pasta?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      okText="Sim"
                      cancelText="Não"
                    >
                      <DeleteOutlined
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "#ff4d4f" }}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <div className="folder-card-content">
                    <FolderOutlined className="folder-icon" />
                    <Text strong className="folder-name">
                      {folder.name}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentImages.length > 0 && (
          <div className="images-section">
            <Title level={5}>Anexos</Title>
            <div className="images-grid">
              {currentImages.map((image) => (
                <Card
                  key={image.id}
                  className="image-card"
                  hoverable
                  cover={
                    <div 
                      className={`image-preview ${image.file_type === "document" ? "document-preview" : ""}`}
                      onClick={() => handleImageClick(image)}
                    >
                      {image.file_type === "image" ? (
                        imageUrls[image.id] ? (
                          <img
                            alt={image.file_name}
                            src={imageUrls[image.id]}
                            draggable
                            onDragStart={(e) => handleDragStart(e, image)}
                            style={{ width: "100%", height: "200px", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Spin />
                          </div>
                        )
                      ) : (
                        <div className="document-preview-content" draggable onDragStart={(e) => handleDragStart(e, image)}>
                          {getFileIcon(image.file_name, image.file_type)}
                          <Text strong style={{ marginTop: 8, display: "block" }}>
                            {image.file_name}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                  actions={[
                    <DownloadOutlined
                      key="download"
                      onClick={() => handleDownloadImage(image)}
                      style={{ color: "#1890ff" }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Tem certeza que deseja excluir este anexo?"
                      onConfirm={() => handleDeleteImage(image.id)}
                      okText="Sim"
                      cancelText="Não"
                    >
                      <DeleteOutlined style={{ color: "#ff4d4f" }} />
                    </Popconfirm>,
                  ]}
                >
                  {image.file_type === "image" && (
                    <Card.Meta
                      title={
                        <Text ellipsis style={{ width: "100%" }}>
                          {image.file_name}
                        </Text>
                      }
                    />
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentFolders.length === 0 && currentImages.length === 0 && (
          <Empty
            description="Esta pasta está vazia"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
          </>
        )}
      </div>

      {/* Modal de criar pasta */}
      <Modal
        title="Criar Nova Pasta"
        open={isCreateFolderModalOpen}
        onOk={handleCreateFolderSubmit}
        onCancel={() => {
          setIsCreateFolderModalOpen(false);
          form.resetFields();
        }}
        okText="Criar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nome da Pasta"
            rules={[{ required: true, message: "Por favor, insira o nome da pasta!" }]}
          >
            <Input placeholder="Digite o nome da pasta" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de editar pasta */}
      <Modal
        title="Editar Nome da Pasta"
        open={isEditFolderModalOpen}
        onOk={handleEditFolderSubmit}
        onCancel={() => {
          setIsEditFolderModalOpen(false);
          setEditingFolder(null);
          editForm.resetFields();
        }}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nome da Pasta"
            rules={[{ required: true, message: "Por favor, insira o nome da pasta!" }]}
          >
            <Input placeholder="Digite o nome da pasta" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de visualização de imagem */}
      <Modal
        open={isImageViewerOpen}
        onCancel={() => {
          setIsImageViewerOpen(false);
          setSelectedImage(null);
        }}
        footer={selectedImage?.file_type === "image" ? [
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedImage && handleDownloadImage(selectedImage)}
          >
            Baixar Anexo
          </Button>,
        ] : null}
        width="90%"
        style={{ top: 20 }}
        centered
      >
        {selectedImage && (
          <div className="image-viewer">
            {selectedImage.file_type === "image" ? (
              imageUrls[selectedImage.id] ? (
                <Image
                  src={imageUrls[selectedImage.id]}
                  alt={selectedImage.file_name}
                  style={{ maxHeight: "80vh", width: "100%" }}
                  preview={false}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Spin size="large" />
                </div>
              )
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                {getFileIcon(selectedImage.file_name, selectedImage.file_type)}
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ fontSize: 16 }}>{selectedImage.file_name}</Text>
                </div>
                <div style={{ marginTop: 24 }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadImage(selectedImage)}
                  >
                    Baixar Documento
                  </Button>
                </div>
              </div>
            )}
            {selectedImage.file_type === "image" && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <Text strong>{selectedImage.file_name}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
