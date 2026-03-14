import { useState, useRef } from "react";
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
} from "@ant-design/icons";
import "./ImagesTab.css";

const { Title, Text } = Typography;

export default function ImagesTab({ patientId }) {
  const [folders, setFolders] = useState([
    { id: "1", name: "Radiografias", parentId: null },
    { id: "2", name: "Fotos Clínicas", parentId: null },
    { id: "3", name: "Documentos", parentId: null },
  ]);
  const [images, setImages] = useState([
    { id: "img1", name: "imagem1.jpg", url: "https://via.placeholder.com/300x200", folderId: "1" },
    { id: "img2", name: "imagem2.jpg", url: "https://via.placeholder.com/300x200", folderId: "1" },
  ]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingFolder, setEditingFolder] = useState(null);
  const [draggedImage, setDraggedImage] = useState(null);
  const [draggedOverFolder, setDraggedOverFolder] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const getCurrentPath = () => {
    if (!currentFolderId) return [];
    const path = [];
    let folder = folders.find((f) => f.id === currentFolderId);
    while (folder) {
      path.unshift(folder);
      folder = folder.parentId ? folders.find((f) => f.id === folder.parentId) : null;
    }
    return path;
  };

  const getCurrentFolders = () => {
    return folders.filter((f) => f.parentId === currentFolderId);
  };

  const getCurrentImages = () => {
    return images.filter((img) => img.folderId === currentFolderId);
  };

  const handleCreateFolder = () => {
    form.resetFields();
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    try {
      const values = await form.validateFields();
      const newFolder = {
        id: Date.now().toString(),
        name: values.name,
        parentId: currentFolderId,
      };
      setFolders([...folders, newFolder]);
      messageApi.success("Pasta criada com sucesso!");
      setIsCreateFolderModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error(error);
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
      setFolders(
        folders.map((f) => (f.id === editingFolder.id ? { ...f, name: values.name } : f))
      );
      messageApi.success("Nome da pasta atualizado!");
      setIsEditFolderModalOpen(false);
      setEditingFolder(null);
      editForm.resetFields();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteFolder = (folderId) => {
    // Deletar pasta e todas as subpastas
    const deleteFolderRecursive = (id) => {
      const subfolders = folders.filter((f) => f.parentId === id);
      subfolders.forEach((subfolder) => deleteFolderRecursive(subfolder.id));
      setFolders((prev) => prev.filter((f) => f.id !== id));
    };
    deleteFolderRecursive(folderId);
    // Mover imagens para a pasta raiz
    setImages((prev) =>
      prev.map((img) => (img.folderId === folderId ? { ...img, folderId: null } : img))
    );
    messageApi.success("Pasta excluída com sucesso!");
  };

  const handleDeleteImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    messageApi.success("Imagem excluída com sucesso!");
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsImageViewerOpen(true);
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      // Simular upload - aqui você faria a chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now().toString(),
          name: file.name,
          url: e.target.result,
          folderId: currentFolderId,
        };
        setImages((prev) => [...prev, newImage]);
        messageApi.success("Imagem adicionada com sucesso!");
      };
      reader.readAsDataURL(file);
    } catch (error) {
      messageApi.error("Erro ao fazer upload da imagem");
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
      if (file.type.startsWith("image/")) {
        handleFileUpload(file);
      }
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

  const handleDrop = (e, targetFolderId) => {
    e.preventDefault();
    if (draggedImage) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === draggedImage.id ? { ...img, folderId: targetFolderId } : img
        )
      );
      messageApi.success("Imagem movida com sucesso!");
    }
    setDraggedImage(null);
    setDraggedOverFolder(null);
  };

  const handleBreadcrumbClick = (folderId) => {
    setCurrentFolderId(folderId);
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
            Adicionar Imagem
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
        accept="image/*"
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
        {currentFolders.length > 0 && (
          <div className="folders-section">
            <Title level={5}>Pastas</Title>
            <div className="folders-grid">
              {currentFolders.map((folder) => (
                <Card
                  key={folder.id}
                  className={`folder-card ${draggedOverFolder === folder.id ? "drag-over" : ""}`}
                  hoverable
                  onDoubleClick={() => setCurrentFolderId(folder.id)}
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
            <Title level={5}>Imagens</Title>
            <div className="images-grid">
              {currentImages.map((image) => (
                <Card
                  key={image.id}
                  className="image-card"
                  hoverable
                  cover={
                    <div className="image-preview" onClick={() => handleImageClick(image)}>
                      <img
                        alt={image.name}
                        src={image.url}
                        draggable
                        onDragStart={(e) => handleDragStart(e, image)}
                      />
                    </div>
                  }
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="Tem certeza que deseja excluir esta imagem?"
                      onConfirm={() => handleDeleteImage(image.id)}
                      okText="Sim"
                      cancelText="Não"
                    >
                      <DeleteOutlined style={{ color: "#ff4d4f" }} />
                    </Popconfirm>,
                  ]}
                >
                  <Card.Meta
                    title={
                      <Text ellipsis style={{ width: "100%" }}>
                        {image.name}
                      </Text>
                    }
                  />
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
        footer={null}
        width="90%"
        style={{ top: 20 }}
        centered
      >
        {selectedImage && (
          <div className="image-viewer">
            <Image
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{ maxHeight: "80vh", width: "100%" }}
              preview={false}
            />
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <Text strong>{selectedImage.name}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
