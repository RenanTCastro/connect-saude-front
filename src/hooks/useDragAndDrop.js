import { useState } from 'react';
import api from '../services/api';

export const useDragAndDrop = ({
  fetchOpportunities,
  messageApi,
  setLoading,
  isOpportunityDetailsModalOpen,
  selectedOpportunityDetails,
  setOpportunityNotes,
}) => {
  const [draggedOpportunity, setDraggedOpportunity] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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
      
      if (isOpportunityDetailsModalOpen && selectedOpportunityDetails?.id === draggedOpportunity.id) {
        try {
          const notesRes = await api.get(`/sales/opportunities/${draggedOpportunity.id}/notes`);
          setOpportunityNotes(notesRes.data);
        } catch (err) {
          console.error("Erro ao recarregar notas:", err);
        }
      }
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

  return {
    draggedOpportunity,
    dragOverStageId,
    isDragging,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};
