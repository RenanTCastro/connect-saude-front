import { useState, useEffect } from "react";
import {
  Modal,
  Table,
  Button,
  Space,
  message,
  Popconfirm,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import api from "../../services/api";
import FormEditor from "./FormEditor";

const { Title } = Typography;

export default function FormManager({ open, onClose, onFormSelect }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [formWasSaved, setFormWasSaved] = useState(false);

  useEffect(() => {
    if (open) {
      fetchForms();
      setFormWasSaved(false); // Resetar quando o modal abrir
    }
  }, [open]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await api.get("/forms");
      setForms(response.data);
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
      messageApi.error("Erro ao carregar formulários.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingForm(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (form) => {
    setEditingForm(form);
    setIsEditorOpen(true);
  };

  const handleDelete = async (idForm) => {
    try {
      await api.delete(`/forms/${idForm}`);
      messageApi.success("Formulário deletado com sucesso!");
      fetchForms();
      setFormWasSaved(true); // Marcar que algo foi alterado
    } catch (error) {
      console.error("Erro ao deletar formulário:", error);
      messageApi.error("Erro ao deletar formulário.");
    }
  };

  const handleDuplicate = async (form) => {
    try {
      await api.post(`/forms/${form.id_form}/duplicate`, {
        name: `${form.name} (Cópia)`,
      });
      messageApi.success("Formulário duplicado com sucesso!");
      fetchForms();
      setFormWasSaved(true); // Marcar que algo foi alterado
    } catch (error) {
      console.error("Erro ao duplicar formulário:", error);
      messageApi.error("Erro ao duplicar formulário.");
    }
  };

  const handleEditorClose = (saved) => {
    setIsEditorOpen(false);
    setEditingForm(null);
    if (saved) {
      fetchForms();
      setFormWasSaved(true); // Marcar que um formulário foi salvo
    }
  };

  const handleSelectForm = (form) => {
    if (onFormSelect) {
      onFormSelect(form.id_form);
    }
    onClose(formWasSaved);
  };

  const handleClose = () => {
    onClose(formWasSaved);
  };

  const columns = [
    {
      title: "Nome",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Descrição",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "-",
    },
    {
      title: "Tipo",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Button
            type="link"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record)}
          >
            Duplicar
          </Button>
          <Popconfirm
            title="Tem certeza que deseja deletar este formulário?"
            onConfirm={() => handleDelete(record.id_form)}
            okText="Sim"
            cancelText="Não"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Deletar
            </Button>
          </Popconfirm>
          {onFormSelect && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleSelectForm(record)}
            >
              Usar
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <Modal
        title="Gerenciar Formulários"
        open={open}
        onCancel={handleClose}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Meus Formulários
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Criar Novo
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={forms}
            loading={loading}
            rowKey="id_form"
            pagination={{ pageSize: 10 }}
          />
        </Space>
      </Modal>

      {isEditorOpen && (
        <FormEditor
          open={isEditorOpen}
          form={editingForm}
          onClose={handleEditorClose}
        />
      )}
    </>
  );
}
