import { useState, useCallback } from 'react';
import { message } from 'antd';
import api from '../services/api';

export const useSalesCRM = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [labels, setLabels] = useState([]);
  const [patients, setPatients] = useState([]);

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

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const getOpportunitiesByStage = useCallback((stageId) => {
    return opportunities.filter(opp => opp.stage_id === stageId);
  }, [opportunities]);

  return {
    // Estados
    loading,
    stages,
    opportunities,
    labels,
    patients,
    messageApi,
    contextHolder,
    // Funções
    fetchStages,
    fetchOpportunities,
    fetchLabels,
    fetchPatients,
    getOpportunitiesByStage,
    setLoading,
    setStages,
    setOpportunities,
  };
};
