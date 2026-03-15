import { useEffect, useState } from "react";
import { Button, Form, Typography } from "antd";
import api from "../../services/api";
import { useSalesCRM } from "../../hooks/useSalesCRM";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { StageCard } from "./components/StageCard/StageCard";
import { AddStageCard } from "./components/AddStageCard/AddStageCard";
import { CreateStageModal } from "./components/StageModals/CreateStageModal";
import { EditStageModal } from "./components/StageModals/EditStageModal";
import { CreateOpportunityModal } from "./components/OpportunityModals/CreateOpportunityModal";
import { OpportunityDetailsModal } from "./components/OpportunityModals/OpportunityDetailsModal";
import { MoveOpportunityModal } from "./components/OpportunityModals/MoveOpportunityModal";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import { LabelModal } from "../../components/LabelModal/LabelModal";
import { containerStyles, kanbanBoardStyles } from "./styles";

const { Title } = Typography;

export default function SalesCRM() {
  // Hooks customizados
  const {
    loading,
    stages,
    opportunities,
    labels,
    patients,
    messageApi,
    contextHolder,
    fetchStages,
    fetchOpportunities,
    fetchLabels,
    fetchPatients,
    getOpportunitiesByStage,
    setLoading,
  } = useSalesCRM();

  // Estados de modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMoveOpportunityModalOpen, setIsMoveOpportunityModalOpen] = useState(false);
  const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);
  const [isCreateOpportunityModalOpen, setIsCreateOpportunityModalOpen] = useState(false);
  const [isOpportunityDetailsModalOpen, setIsOpportunityDetailsModalOpen] = useState(false);
  const [isDeleteOpportunityModalOpen, setIsDeleteOpportunityModalOpen] = useState(false);

  // Estados de seleção
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [selectedOpportunityDetails, setSelectedOpportunityDetails] = useState(null);
  const [opportunityNotes, setOpportunityNotes] = useState([]);

  // Forms
  const [form] = Form.useForm();
  const [opportunityForm] = Form.useForm();
  const [labelForm] = Form.useForm();
  const [opportunityDetailsForm] = Form.useForm();
  const [noteForm] = Form.useForm();

  // Hook de drag and drop
  const {
    draggedOpportunity,
    dragOverStageId,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useDragAndDrop({
    fetchOpportunities,
    messageApi,
    setLoading,
    isOpportunityDetailsModalOpen,
    selectedOpportunityDetails,
    setOpportunityNotes,
  });

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
        patient_id: values.patient_id || null,
        estimated_value: values.estimated_value || null,
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
        patient_id: opportunityRes.data.patient_id || null,
        estimated_value: opportunityRes.data.estimated_value || null,
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
        patient_id: values.patient_id || null,
        estimated_value: values.estimated_value || null,
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

  // Effects
  useEffect(() => {
    fetchStages();
    fetchOpportunities();
    fetchLabels();
    fetchPatients();
  }, [fetchStages, fetchOpportunities, fetchLabels, fetchPatients]);

  return (
    <div style={containerStyles}>
      {contextHolder}

      <div>
        <Title level={3}>Vendas</Title>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div></div>
          <Button
            type="primary"
            onClick={() => {
              opportunityForm.resetFields();
              setIsCreateOpportunityModalOpen(true);
            }}
          >
            + Adicionar Oportunidade
          </Button>
        </div>
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
              labels={labels}
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

        <AddStageCard 
          onClick={() => {
            form.resetFields();
            setSelectedStage(null);
            setIsCreateModalOpen(true);
          }} 
        />
      </div>

      {/* Modais */}
      <CreateStageModal
        open={isCreateModalOpen}
        loading={loading}
        form={form}
        onOk={handleCreateStage}
        onCancel={() => {
          setIsCreateModalOpen(false);
          form.resetFields();
        }}
      />

      <EditStageModal
        open={isEditModalOpen}
        loading={loading}
        form={form}
        onOk={handleEditStage}
        onCancel={() => {
          setIsEditModalOpen(false);
          setSelectedStage(null);
          form.resetFields();
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        loading={loading}
        title="Excluir Estágio"
        itemName={selectedStage?.name}
        onOk={handleDeleteStage}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedStage(null);
        }}
      />

      <LabelModal
        open={isNewLabelModalOpen}
        loading={loading}
        form={labelForm}
        onOk={handleCreateLabel}
        onCancel={() => {
          setIsNewLabelModalOpen(false);
          labelForm.resetFields();
        }}
      />

      <CreateOpportunityModal
        open={isCreateOpportunityModalOpen}
        loading={loading}
        form={opportunityForm}
        labels={labels}
        patients={patients}
        onOk={handleCreateOpportunity}
        onCancel={() => {
          setIsCreateOpportunityModalOpen(false);
          opportunityForm.resetFields();
        }}
        onCreateLabelClick={() => setIsNewLabelModalOpen(true)}
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
        onCancel={() => {
          setIsMoveOpportunityModalOpen(false);
          setSelectedOpportunity(null);
          opportunityForm.resetFields();
        }}
      />

      <OpportunityDetailsModal
        open={isOpportunityDetailsModalOpen}
        loading={loading}
        opportunity={selectedOpportunityDetails}
        labels={labels}
        patients={patients}
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
        onCreateLabelClick={() => setIsNewLabelModalOpen(true)}
        onDelete={() => setIsDeleteOpportunityModalOpen(true)}
        styles={{
          body: {
            maxHeight: "500px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteOpportunityModalOpen}
        loading={loading}
        title="Excluir Oportunidade"
        itemName={selectedOpportunityDetails?.title}
        warningMessage="Esta ação não pode ser desfeita."
        onOk={handleDeleteOpportunity}
        onCancel={() => setIsDeleteOpportunityModalOpen(false)}
      />
    </div>
  );
}
