import { useState, useCallback } from 'react';
import { message } from 'antd';
import api from '../services/api';

export const useInventory = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const formatInventoryData = (items) => {
    return items.map((item) => ({
      key: item.id,
      name: item.name,
      quantity: item.quantity,
      ideal_quantity: item.ideal_quantity || null,
    }));
  };

  const fetchInventory = useCallback(async (searchName = "") => {
    try {
      setLoading(true);
      const res = await api.get("/inventory", {
        params: { name: searchName },
      });
      setData(formatInventoryData(res.data));
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar produtos no estoque");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const createItem = useCallback(async (values) => {
    try {
      setLoading(true);
      await api.post("/inventory", values);
      messageApi.success("Produto adicionado com sucesso!");
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao adicionar produto!");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const updateItem = useCallback(async (id, values) => {
    try {
      setLoading(true);
      await api.put(`/inventory/${id}`, values);
      messageApi.success("Produto atualizado com sucesso!");
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao atualizar produto!");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const deleteItem = useCallback(async (id) => {
    try {
      setLoading(true);
      await api.delete(`/inventory/${id}`);
      messageApi.success("Produto removido com sucesso!");
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao excluir produto!");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  const fetchHistory = useCallback(async (itemId) => {
    try {
      const res = await api.get(`/inventory/${itemId}/history`);
      return res.data;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar histórico");
      return null;
    }
  }, [messageApi]);

  const adjustQuantity = useCallback(async (id, operation, amount) => {
    try {
      setLoading(true);
      await api.put(`/inventory/${id}/adjust-quantity`, {
        operation, // 'add' ou 'subtract'
        amount
      });
      messageApi.success("Quantidade alterada com sucesso!");
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao alterar quantidade!");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  return {
    // Estados
    loading,
    data,
    messageApi,
    contextHolder,
    // Funções
    fetchInventory,
    createItem,
    updateItem,
    deleteItem,
    adjustQuantity,
    fetchHistory,
    setData,
  };
};
