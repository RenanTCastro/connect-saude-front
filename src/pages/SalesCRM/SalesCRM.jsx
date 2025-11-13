import { useEffect, useState, useCallback } from "react";
import { 
  Card, 
  Button, 
  message, 
  Form, 
  Modal, 
  Input, 
  Typography, 
  Dropdown, 
  Select, 
  Space
} from "antd";
import { PlusOutlined, MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Constantes
const LABEL_COLORS = [
  { value: "#1890ff", name: "Azul" },
  { value: "#ff4d4f", name: "Vermelho" },
  { value: "#52c41a", name: "Verde" },
  { value: "#faad14", name: "Amarelo" },
  { value: "#722ed1", name: "Roxo" },
  { value: "#eb2f96", name: "Rosa" },
  { value: "#13c2c2", name: "Ciano" },
  { value: "#fa8c16", name: "Laranja" },
];

const STAGE_CARD_WIDTH = 300;
const DRAG_HIGHLIGHT_COLOR = "#1890ff";
const DRAG_BACKGROUND_COLOR = "#f0f8ff";

// Estilos
const containerStyles = {
  height: "calc(100vh - 80px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

const headerStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
  flexShrink: 0,
  paddingRight: 24
};

const kanbanBoardStyles = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  overflowY: "hidden",
  flex: 1,
  paddingBottom: 8,
  paddingRight: 24,
  WebkitOverflowScrolling: "touch"
};

const stageCardStyles = {
  width: STAGE_CARD_WIDTH,
  height: "100%",
  position: "relative",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: "all 0.2s ease"
};

const stageCardBodyStyles = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: 16,
  overflow: "hidden"
};

const stageHeaderStyles = {
  paddingTop: 8,
  paddingRight: 40,
  fontSize: 16,
  fontWeight: 500,
  wordBreak: "break-word",
  marginBottom: 16,
  flexShrink: 0
};

const opportunitiesContainerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: 4,
  WebkitOverflowScrolling: "touch"
};

const opportunityCardStyles = (isDragging) => ({
  backgroundColor: isDragging ? "#e6f7ff" : "#f5f5f5",
  position: "relative",
  cursor: isDragging ? "grabbing" : "grab",
  opacity: isDragging ? 0.5 : 1,
  flexShrink: 0
});

const opportunityCardBodyStyles = {
  padding: "8px 12px"
};

const opportunityTitleStyles = {
  fontSize: 14,
  wordBreak: "break-word"
};

const addStageCardStyles = {
  width: STAGE_CARD_WIDTH,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  borderStyle: "dashed",
  flexShrink: 0,
};

const addStageCardBodyStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%"
};

const menuButtonStyles = {
  position: "absolute",
  top: 16,
  right: 16,
  cursor: "pointer",
  zIndex: 10
};

// Componentes
const OpportunityCard = ({ opportunity, isDragging, draggedOpportunity, onDragStart, onDragEnd, onClick }) => {
  const isThisCardDragging = draggedOpportunity?.id === opportunity.id;
  
  return (
    <Card
      key={opportunity.id}
      size="small"
      draggable
      onDragStart={(e) => onDragStart(e, opportunity)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        // Prevenir abertura apenas se este card específico estiver sendo arrastado
        if (!isThisCardDragging && onClick) {
          onClick(opportunity.id);
        }
      }}
      style={{
        ...opportunityCardStyles(isThisCardDragging),
        cursor: isThisCardDragging ? "grabbing" : "pointer"
      }}
      bodyStyle={opportunityCardBodyStyles}
    >
      <div style={opportunityTitleStyles}>
        {opportunity.title}
      </div>
    </Card>
  );
};

const StageCard = ({ 
  stage, 
  opportunities, 
  isDragOver, 
  isDragging,
  draggedOpportunity,
  loading,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onEditStage,
  onDeleteStage,
  onClickOpportunity
}) => {
  const getMenuItems = () => [
    {
      key: "edit",
      label: "Editar",
      icon: <EditOutlined />,
      onClick: () => onEditStage(stage),
    },
    {
      key: "delete",
      label: "Excluir",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeleteStage(stage),
    },
  ];

  const cardStyle = {
    ...stageCardStyles,
    borderColor: isDragOver ? DRAG_HIGHLIGHT_COLOR : undefined,
    borderWidth: isDragOver ? 2 : undefined,
    backgroundColor: isDragOver ? DRAG_BACKGROUND_COLOR : undefined,
  };

  return (
    <Card
      key={stage.id}
      style={cardStyle}
      bodyStyle={stageCardBodyStyles}
      loading={loading}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div style={menuButtonStyles}>
        <Dropdown
          menu={{ items: getMenuItems() }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ fontSize: 18 }}
          />
        </Dropdown>
      </div>
      
      <div style={stageHeaderStyles}>
        {stage.name}
      </div>

      <div style={opportunitiesContainerStyles}>
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            isDragging={isDragging}
            draggedOpportunity={draggedOpportunity}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClickOpportunity}
          />
        ))}
      </div>
    </Card>
  );
};

const AddStageCard = ({ onClick }) => (
  <Card
    style={addStageCardStyles}
    bodyStyle={addStageCardBodyStyles}
    onClick={onClick}
  >
    <PlusOutlined style={{ fontSize: 32, color: "#8c8c8c" }} />
  </Card>
);

const CreateStageModal = ({ open, loading, form, onOk, onCancel }) => (
  <Modal
    title="Criar Novo Estágio"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Criar"
    cancelText="Cancelar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="Nome do Estágio"
        rules={[{ required: true, message: "Informe o nome do estágio!" }]}
      >
        <Input placeholder="Nome do estágio" />
      </Form.Item>
    </Form>
  </Modal>
);

const EditStageModal = ({ open, loading, form, onOk, onCancel }) => (
  <Modal
    title="Editar Estágio"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Salvar"
    cancelText="Cancelar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="Nome do Estágio"
        rules={[{ required: true, message: "Informe o nome do estágio!" }]}
      >
        <Input placeholder="Nome do estágio" />
      </Form.Item>
    </Form>
  </Modal>
);

const DeleteStageModal = ({ open, loading, stageName, onOk, onCancel }) => (
  <Modal
    title="Excluir Estágio"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Sim, excluir"
    cancelText="Cancelar"
    okButtonProps={{ danger: true }}
    confirmLoading={loading}
  >
    <p>
      Tem certeza que deseja excluir o estágio <strong>{stageName}</strong>?
    </p>
  </Modal>
);

const DeleteOpportunityModal = ({ open, loading, opportunityTitle, onOk, onCancel }) => (
  <Modal
    title="Excluir Oportunidade"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Sim, excluir"
    cancelText="Cancelar"
    okButtonProps={{ danger: true }}
    confirmLoading={loading}
  >
    <p>
      Tem certeza que deseja excluir a oportunidade <strong>{opportunityTitle}</strong>?
    </p>
    <p style={{ color: "#ff4d4f" }}>Esta ação não pode ser desfeita.</p>
  </Modal>
);

const CreateLabelModal = ({ open, loading, form, onOk, onCancel }) => (
  <Modal
    title="Novo rótulo"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Salvar"
    cancelText="Fechar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="color"
        label="Cor*"
        rules={[{ required: true, message: "Este campo é obrigatório" }]}
      >
        <Select placeholder="Selecione uma cor">
          {LABEL_COLORS.map((color) => (
            <Option key={color.value} value={color.value}>
              <Space>
                <span
                  style={{
                    display: "inline-block",
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: color.value
                  }}
                />
                {color.name}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="name"
        label="Nome do rótulo*"
        rules={[{ required: true, message: "Este campo é obrigatório" }]}
      >
        <Input placeholder="Nome do rótulo" />
      </Form.Item>
    </Form>
  </Modal>
);

const MoveOpportunityModal = ({ open, loading, form, stages, onOk, onCancel }) => (
  <Modal
    title="Mover Oportunidade"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Mover"
    cancelText="Cancelar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="stage_id"
        label="Mover para estágio"
        rules={[{ required: true, message: "Selecione o estágio!" }]}
      >
        <Select placeholder="Selecione o estágio">
          {stages.map((stage) => (
            <Option key={stage.id} value={stage.id}>
              {stage.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  </Modal>
);

const CreateOpportunityModal = ({
  open,
  loading,
  form,
  labels,
  onOk,
  onCancel,
  onCreateLabelClick,
  styles
}) => {
  return (
    <Modal
      title="Criar Nova Oportunidade"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Criar"
      cancelText="Fechar"
      confirmLoading={loading}
      styles={styles}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="title"
          label="Título*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <Input placeholder="Título" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descrição*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <TextArea
            rows={4}
            maxLength={300}
            placeholder="Descrição"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="label"
          label="Rótulo"
        >
          <Select
            placeholder="Selecione um rótulo"
            popupRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                  <Button
                    type="link"
                    block
                    onClick={onCreateLabelClick}
                    style={{ color: "#1890ff" }}
                  >
                    NOVO RÓTULO
                  </Button>
                </div>
              </>
            )}
          >
            {labels.map((label) => (
              <Option key={label.id} value={label.name}>
                <Space>
                  {label.color && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: label.color
                      }}
                    />
                  )}
                  {label.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const OpportunityDetailsModal = ({
  open,
  loading,
  opportunity,
  labels,
  notes,
  form,
  noteForm,
  onOk,
  onCancel,
  onAddNote,
  onCreateLabelClick,
  onDelete,
  styles
}) => {
  return (
    <Modal
      title={opportunity?.title || "Detalhes da Oportunidade"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Salvar Alterações"
      cancelText="Fechar"
      confirmLoading={loading}
      width={600}
      styles={styles}
      footer={[
        <Button
          key="delete"
          danger
          onClick={onDelete}
          style={{ float: "left" }}
        >
          Excluir
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Fechar
        </Button>,
        <Button key="submit" type="primary" onClick={onOk} loading={loading}>
          Salvar Alterações
        </Button>,
      ]}
    >
      {opportunity && (
        <div>
          <Form form={form} layout="vertical">
            <Form.Item
              name="title"
              label="Título*"
              rules={[{ required: true, message: "Este campo é obrigatório" }]}
            >
              <Input placeholder="Título" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Descrição*"
              rules={[{ required: true, message: "Este campo é obrigatório" }]}
            >
              <TextArea
                rows={4}
                maxLength={300}
                placeholder="Descrição"
                showCount
              />
            </Form.Item>

            <Form.Item
              name="label"
              label="Rótulo"
            >
              <Select 
                placeholder="Selecione um rótulo" 
                allowClear
                popupRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                      <Button
                        type="link"
                        block
                        onClick={onCreateLabelClick}
                        style={{ color: "#1890ff" }}
                      >
                        NOVO RÓTULO
                      </Button>
                    </div>
                  </>
                )}
              >
                {labels.map((label) => (
                  <Option key={label.id} value={label.name}>
                    <Space>
                      {label.color && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: label.color
                          }}
                        />
                      )}
                      {label.name}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>

          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Adicionar Comentário:</Text>
            <Form form={noteForm} onFinish={onAddNote} layout="vertical">
              <Form.Item
                name="content"
                rules={[{ required: true, message: "Digite um comentário!" }]}
              >
                <TextArea
                  rows={3}
                  placeholder="Digite seu comentário..."
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Adicionar Comentário
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div style={{ marginTop: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Histórico de Comentários:</Text>
            <div style={{ 
              maxHeight: notes.length > 4 ? "200px" : "auto",
              overflowY: notes.length > 4 ? "auto" : "visible",
              border: "1px solid #f0f0f0",
              borderRadius: 4,
              padding: 12
            }}>
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      marginBottom: 16,
                      paddingBottom: 16,
                      borderBottom: notes.indexOf(note) < notes.length - 1 ? "1px solid #f0f0f0" : "none"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text strong>{note.user_name || "Usuário"}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(note.created_at).format("DD/MM/YYYY [às] HH:mm")}
                      </Text>
                    </div>
                    <Text>{note.content}</Text>
                  </div>
                ))
              ) : (
                <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
                  Nenhum comentário ainda
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Componente principal
export default function SalesCRM() {
  // Estados
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveOpportunityModalOpen, setIsMoveOpportunityModalOpen] = useState(false);
  const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);
  const [isCreateOpportunityModalOpen, setIsCreateOpportunityModalOpen] = useState(false);
  const [isOpportunityDetailsModalOpen, setIsOpportunityDetailsModalOpen] = useState(false);
  const [isDeleteOpportunityModalOpen, setIsDeleteOpportunityModalOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [selectedOpportunityDetails, setSelectedOpportunityDetails] = useState(null);
  const [opportunityNotes, setOpportunityNotes] = useState([]);
  const [draggedOpportunity, setDraggedOpportunity] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [labels, setLabels] = useState([]);

  // Forms
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [opportunityForm] = Form.useForm();
  const [labelForm] = Form.useForm();
  const [opportunityDetailsForm] = Form.useForm();
  const [noteForm] = Form.useForm();

  // Funções de API
  const fetchStages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/sales/stages");
      setStages(res.data);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar estágios de venda");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await api.get("/sales/opportunities");
      setOpportunities(res.data);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar oportunidades");
    }
  }, [messageApi]);

  const fetchLabels = useCallback(async () => {
    try {
      const res = await api.get("/labels", {
        params: { is_active: true }
      });
      setLabels(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Handlers de estágios
  const handleCreateStage = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const maxOrder = stages.length > 0 
        ? Math.max(...stages.map(s => s.order_position || 0))
        : 0;
      
      await api.post("/sales/stages", {
        name: values.name,
        order_position: maxOrder + 1,
      });
      
      messageApi.success("Estágio criado com sucesso!");
      setIsCreateModalOpen(false);
      form.resetFields();
      await fetchStages();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao criar estágio!");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStage = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      await api.put(`/sales/stages/${selectedStage.id}`, {
        name: values.name,
      });
      
      messageApi.success("Estágio atualizado com sucesso!");
      setIsEditModalOpen(false);
      setSelectedStage(null);
      form.resetFields();
      await fetchStages();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao atualizar estágio!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStage = async () => {
    try {
      setLoading(true);
      await api.delete(`/sales/stages/${selectedStage.id}`);
      messageApi.success("Estágio removido com sucesso!");
      setIsDeleteModalOpen(false);
      setSelectedStage(null);
      await fetchStages();
      await fetchOpportunities();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao excluir estágio!");
    } finally {
      setLoading(false);
    }
  };

  const openEditStageModal = (stage) => {
    setSelectedStage(stage);
    form.setFieldsValue({ name: stage.name });
    setIsEditModalOpen(true);
  };

  const openDeleteStageModal = (stage) => {
    setSelectedStage(stage);
    setIsDeleteModalOpen(true);
  };

  // Handlers de rótulos
  const handleCreateLabel = async () => {
    try {
      setLoading(true);
      const values = await labelForm.validateFields();
      
      await api.post("/labels", {
        name: values.name,
        color: values.color,
      });
      
      messageApi.success("Rótulo criado com sucesso!");
      setIsNewLabelModalOpen(false);
      labelForm.resetFields();
      await fetchLabels();
      
      // Selecionar o novo rótulo no formulário de oportunidade (se o modal de criar estiver aberto)
      if (isCreateOpportunityModalOpen) {
        opportunityForm.setFieldsValue({ label: values.name });
      }
      
      // Selecionar o novo rótulo no formulário de detalhes (se o modal de detalhes estiver aberto)
      if (isOpportunityDetailsModalOpen) {
        opportunityDetailsForm.setFieldsValue({ label: values.name });
      }
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao criar rótulo!");
    } finally {
      setLoading(false);
    }
  };

  // Handlers de oportunidades
  const handleCreateOpportunity = async () => {
    try {
      setLoading(true);
      const values = await opportunityForm.validateFields();
      
      // Pegar o primeiro estágio (ordenado por order_position)
      const sortedStages = [...stages].sort((a, b) => 
        (a.order_position || 0) - (b.order_position || 0)
      );
      const firstStage = sortedStages.length > 0 ? sortedStages[0] : null;
      if (!firstStage) {
        messageApi.error("Não há estágios cadastrados. Crie um estágio primeiro!");
        setLoading(false);
        return;
      }
      
      const payload = {
        title: values.title,
        description: values.description || null,
        stage_id: firstStage.id,
        patient_id: null,
        label: values.label || null,
      };
      
      await api.post("/sales/opportunities", payload);
      
      messageApi.success("Oportunidade criada com sucesso!");
      setIsCreateOpportunityModalOpen(false);
      opportunityForm.resetFields();
      await fetchOpportunities();
    } catch (err) {
      console.error(err);
      if (err.errorFields) {
        // Erro de validação do formulário
        return;
      }
      messageApi.error(err.response?.data?.error || "Erro ao criar oportunidade!");
    } finally {
      setLoading(false);
    }
  };

  const handleMoveOpportunity = async () => {
    try {
      setLoading(true);
      const values = await opportunityForm.validateFields();
      
      await api.put(`/sales/opportunities/${selectedOpportunity.id}`, {
        stage_id: values.stage_id,
      });
      
      messageApi.success("Oportunidade movida com sucesso!");
      setIsMoveOpportunityModalOpen(false);
      setSelectedOpportunity(null);
      opportunityForm.resetFields();
      await fetchOpportunities();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao mover oportunidade!");
    } finally {
      setLoading(false);
    }
  };

  // Handlers de detalhes da oportunidade
  const fetchOpportunityDetails = async (opportunityId) => {
    try {
      setLoading(true);
      const [opportunityRes, notesRes] = await Promise.all([
        api.get(`/sales/opportunities/${opportunityId}`),
        api.get(`/sales/opportunities/${opportunityId}/notes`)
      ]);
      
      setSelectedOpportunityDetails(opportunityRes.data);
      setOpportunityNotes(notesRes.data);
      
      opportunityDetailsForm.setFieldsValue({
        title: opportunityRes.data.title,
        description: opportunityRes.data.description,
        label: opportunityRes.data.label
      });
      
      setIsOpportunityDetailsModalOpen(true);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao carregar detalhes da oportunidade");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOpportunityDetails = async () => {
    try {
      setLoading(true);
      const values = await opportunityDetailsForm.validateFields();
      
      await api.put(`/sales/opportunities/${selectedOpportunityDetails.id}`, {
        title: values.title,
        description: values.description,
        label: values.label || null,
      });
      
      messageApi.success("Oportunidade atualizada com sucesso!");
      await fetchOpportunities();
      
      // Fechar o modal após salvar
      setIsOpportunityDetailsModalOpen(false);
      setSelectedOpportunityDetails(null);
      setOpportunityNotes([]);
      opportunityDetailsForm.resetFields();
      noteForm.resetFields();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao atualizar oportunidade!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    try {
      const values = await noteForm.validateFields();
      
      await api.post("/sales/notes", {
        opportunity_id: selectedOpportunityDetails.id,
        content: values.content
      });
      
      messageApi.success("Comentário adicionado com sucesso!");
      noteForm.resetFields();
      
      // Atualizar lista de notas
      const notesRes = await api.get(`/sales/opportunities/${selectedOpportunityDetails.id}/notes`);
      setOpportunityNotes(notesRes.data);
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao adicionar comentário!");
    }
  };

  const handleDeleteOpportunity = async () => {
    try {
      setLoading(true);
      await api.delete(`/sales/opportunities/${selectedOpportunityDetails.id}`);
      
      messageApi.success("Oportunidade excluída com sucesso!");
      setIsDeleteOpportunityModalOpen(false);
      setIsOpportunityDetailsModalOpen(false);
      setSelectedOpportunityDetails(null);
      setOpportunityNotes([]);
      opportunityDetailsForm.resetFields();
      noteForm.resetFields();
      await fetchOpportunities();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao excluir oportunidade!");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeleteOpportunityModal = () => {
    setIsDeleteOpportunityModalOpen(true);
  };

  const handleCloseDeleteOpportunityModal = () => {
    setIsDeleteOpportunityModalOpen(false);
  };

  // Funções auxiliares
  const getOpportunitiesByStage = useCallback((stageId) => {
    return opportunities.filter(opp => opp.stage_id === stageId);
  }, [opportunities]);

  // Handlers de drag and drop
  const handleDragStart = (e, opportunity) => {
    setDraggedOpportunity(opportunity);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target);
    e.dataTransfer.setData("text/plain", "");
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedOpportunity && draggedOpportunity.stage_id !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverStageId(null);
    
    if (!draggedOpportunity || draggedOpportunity.stage_id === targetStageId) {
      setDraggedOpportunity(null);
      return;
    }

    try {
      setLoading(true);
      await api.put(`/sales/opportunities/${draggedOpportunity.id}`, {
        stage_id: targetStageId,
      });
      
      messageApi.success("Oportunidade movida com sucesso!");
      await fetchOpportunities();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao mover oportunidade!");
    } finally {
      setLoading(false);
      setDraggedOpportunity(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedOpportunity(null);
    setDragOverStageId(null);
    setTimeout(() => setIsDragging(false), 100);
  };

  // Effects
  useEffect(() => {
    fetchStages();
    fetchOpportunities();
    fetchLabels();
  }, [fetchStages, fetchOpportunities, fetchLabels]);

  // Handlers de modais
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    form.resetFields();
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStage(null);
    form.resetFields();
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedStage(null);
  };

  const handleCloseMoveOpportunityModal = () => {
    setIsMoveOpportunityModalOpen(false);
    setSelectedOpportunity(null);
    opportunityForm.resetFields();
  };

  const handleCloseCreateLabelModal = () => {
    setIsNewLabelModalOpen(false);
    labelForm.resetFields();
  };

  const handleOpenCreateModal = () => {
    form.resetFields();
    setSelectedStage(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateOpportunityModal = () => {
    opportunityForm.resetFields();
    setIsCreateOpportunityModalOpen(true);
  };

  const handleCloseCreateOpportunityModal = () => {
    setIsCreateOpportunityModalOpen(false);
    opportunityForm.resetFields();
  };

  const handleOpenCreateLabelModal = () => {
    setIsNewLabelModalOpen(true);
  };

  return (
    <div style={containerStyles}>
      {contextHolder}

      <div style={headerStyles}>
        <Title level={3} style={{ margin: 0 }}>Vendas</Title>
        <Button 
          type="primary" 
          onClick={handleOpenCreateOpportunityModal}
        >
          + Adicionar Oportunidade
        </Button>
      </div>

      <div style={kanbanBoardStyles}>
        {stages.map((stage) => {
          const stageOpportunities = getOpportunitiesByStage(stage.id);
          const isDragOver = dragOverStageId === stage.id && draggedOpportunity?.stage_id !== stage.id;
          
          return (
            <StageCard
              key={stage.id}
              stage={stage}
              opportunities={stageOpportunities}
              isDragOver={isDragOver}
              isDragging={isDragging}
              draggedOpportunity={draggedOpportunity}
              loading={loading}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onEditStage={openEditStageModal}
              onDeleteStage={openDeleteStageModal}
              onClickOpportunity={fetchOpportunityDetails}
            />
          );
        })}

        <AddStageCard onClick={handleOpenCreateModal} />
      </div>

      {/* Modais */}
      <CreateStageModal
        open={isCreateModalOpen}
        loading={loading}
        form={form}
        onOk={handleCreateStage}
        onCancel={handleCloseCreateModal}
      />

      <EditStageModal
        open={isEditModalOpen}
        loading={loading}
        form={form}
        onOk={handleEditStage}
        onCancel={handleCloseEditModal}
      />

      <DeleteStageModal
        open={isDeleteModalOpen}
        loading={loading}
        stageName={selectedStage?.name}
        onOk={handleDeleteStage}
        onCancel={handleCloseDeleteModal}
      />

      <CreateLabelModal
        open={isNewLabelModalOpen}
        loading={loading}
        form={labelForm}
        onOk={handleCreateLabel}
        onCancel={handleCloseCreateLabelModal}
      />

      <CreateOpportunityModal
        open={isCreateOpportunityModalOpen}
        loading={loading}
        form={opportunityForm}
        labels={labels}
        onOk={handleCreateOpportunity}
        onCancel={handleCloseCreateOpportunityModal}
        onCreateLabelClick={handleOpenCreateLabelModal}
        styles={{
          body: {
            maxHeight: "400px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
      />

      <MoveOpportunityModal
        open={isMoveOpportunityModalOpen}
        loading={loading}
        form={opportunityForm}
        stages={stages}
        onOk={handleMoveOpportunity}
        onCancel={handleCloseMoveOpportunityModal}
      />

      <OpportunityDetailsModal
        open={isOpportunityDetailsModalOpen}
        loading={loading}
        opportunity={selectedOpportunityDetails}
        labels={labels}
        stages={stages}
        notes={opportunityNotes}
        form={opportunityDetailsForm}
        noteForm={noteForm}
        onOk={handleUpdateOpportunityDetails}
        onCancel={() => {
          setIsOpportunityDetailsModalOpen(false);
          setSelectedOpportunityDetails(null);
          setOpportunityNotes([]);
          opportunityDetailsForm.resetFields();
          noteForm.resetFields();
        }}
        onAddNote={handleAddNote}
        onCreateLabelClick={handleOpenCreateLabelModal}
        onDelete={handleOpenDeleteOpportunityModal}
        styles={{
          body: {
            maxHeight: "500px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
      />

      <DeleteOpportunityModal
        open={isDeleteOpportunityModalOpen}
        loading={loading}
        opportunityTitle={selectedOpportunityDetails?.title}
        onOk={handleDeleteOpportunity}
        onCancel={handleCloseDeleteOpportunityModal}
      />
    </div>
  );
}