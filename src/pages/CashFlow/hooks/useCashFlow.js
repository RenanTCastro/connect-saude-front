import { useState, useCallback } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import api from '../../../services/api';

export const useCashFlow = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    received: 0,
    toReceive: 0,
    paidExpenses: 0,
    toPayExpenses: 0,
    cashBalance: 0,
    projectedBalance: 0,
  });
  const [receivableStats, setReceivableStats] = useState({
    overdue: 0,
    thisMonth: 0,
    nextMonth: 0,
    future: 0,
    total: 0,
  });

  const calculateStats = useCallback((incomeData, expenseData) => {
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const received = incomeData
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const toReceive = incomeData
      .filter(item => !item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const totalExpense = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const paidExpenses = expenseData
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const toPayExpenses = expenseData
      .filter(item => !item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const netBalance = totalIncome - totalExpense;
    const cashBalance = received - paidExpenses;
    const projectedBalance = totalIncome - totalExpense;
    
    setStats({ 
      totalIncome, totalExpense, netBalance,
      received, toReceive, paidExpenses, toPayExpenses,
      cashBalance, projectedBalance,
    });
  }, []);

  const calculateReceivableStats = useCallback((installments) => {
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const endOfMonth = now.endOf("month");
    const nextMonthStart = now.add(1, "month").startOf("month");
    const nextMonthEnd = now.add(1, "month").endOf("month");
    
    let overdue = 0, thisMonth = 0, nextMonth = 0, future = 0;
    
    installments.forEach((inst) => {
      const dueDate = dayjs(inst.dueDate);
      const amount = inst.amount || 0;
      
      if (dueDate.isBefore(now, "day")) {
        overdue += amount;
      } else if (
        (dueDate.isAfter(startOfMonth) || dueDate.isSame(startOfMonth)) &&
        (dueDate.isBefore(endOfMonth) || dueDate.isSame(endOfMonth))
      ) {
        thisMonth += amount;
      } else if (
        (dueDate.isAfter(nextMonthStart) || dueDate.isSame(nextMonthStart)) &&
        (dueDate.isBefore(nextMonthEnd) || dueDate.isSame(nextMonthEnd))
      ) {
        nextMonth += amount;
      } else if (dueDate.isAfter(nextMonthEnd)) {
        future += amount;
      }
    });
    
    setReceivableStats({ 
      overdue, thisMonth, nextMonth, future, 
      total: overdue + thisMonth + nextMonth + future 
    });
  }, []);

  const fetchPeriodData = useCallback(async (dateRange) => {
    try {
      setLoading(true);
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");
      
      const res = await api.get("/cashflow/period", {
        params: { startDate, endDate },
      });
      
      setIncomes(res.data.incomes || []);
      setExpenses(res.data.expenses || []);
      calculateStats(res.data.incomes || [], res.data.expenses || []);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar dados do período");
    } finally {
      setLoading(false);
    }
  }, [messageApi, calculateStats]);

  const fetchReceivables = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/cashflow/receivables");
      setPendingInstallments(res.data || []);
      calculateReceivableStats(res.data || []);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar saldo a receber");
    } finally {
      setLoading(false);
    }
  }, [messageApi, calculateReceivableStats]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar pacientes");
    }
  }, [messageApi]);

  const createIncome = useCallback(async (values, dateRange) => {
    try {
      setLoading(true);
      const formData = {
        ...values,
        dueDate: values.dueDate?.format("YYYY-MM-DD"),
        firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
      };
      
      if (values.hasInstallments) {
        formData.installments = {
          count: values.installmentCount,
          firstDate: formData.firstInstallmentDate,
          interval: 1,
          intervalType: values.intervalType,
        };
      }
      
      await api.post("/cashflow/income", formData);
      messageApi.success("Receita criada com sucesso!");
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao criar receita");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const updateIncome = useCallback(async (id, values, isEditingInstallment, dateRange) => {
    try {
      setLoading(true);
      
      if (isEditingInstallment) {
        const formData = {
          title: values.title,
          description: values.description,
          paymentType: values.paymentType,
          patientId: values.patientId,
        };
        await api.put(`/cashflow/income/${id}`, formData);
        messageApi.success("Receita parcelada atualizada com sucesso!");
      } else {
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
        };
        await api.put(`/cashflow/income/${id}`, formData);
        messageApi.success("Receita atualizada com sucesso!");
      }
      
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao atualizar receita");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const deleteIncome = useCallback(async (id, isInstallment, deleteOption, dateRange) => {
    try {
      setLoading(true);
      
      if (isInstallment) {
        const installmentId = id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteOption }
        });
        messageApi.success(
          deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        await api.delete(`/cashflow/income/${id}`);
        messageApi.success("Receita deletada com sucesso!");
      }
      
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao deletar receita");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const createExpense = useCallback(async (values, dateRange) => {
    try {
      setLoading(true);
      const formData = {
        ...values,
        dueDate: values.dueDate?.format("YYYY-MM-DD"),
        firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
      };
      
      if (values.hasInstallments) {
        formData.installments = {
          count: values.installmentCount,
          firstDate: formData.firstInstallmentDate,
          interval: 1,
          intervalType: values.intervalType,
        };
      }
      
      await api.post("/cashflow/expense", formData);
      messageApi.success("Despesa criada com sucesso!");
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao criar despesa");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const updateExpense = useCallback(async (id, values, isEditingInstallment, dateRange) => {
    try {
      setLoading(true);
      
      if (isEditingInstallment) {
        const formData = {
          title: values.title,
          description: values.description,
          paymentType: values.paymentType,
        };
        await api.put(`/cashflow/expense/${id}`, formData);
        messageApi.success("Despesa parcelada atualizada com sucesso!");
      } else {
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
        };
        await api.put(`/cashflow/expense/${id}`, formData);
        messageApi.success("Despesa atualizada com sucesso!");
      }
      
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao atualizar despesa");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const deleteExpense = useCallback(async (id, isInstallment, deleteOption, dateRange) => {
    try {
      setLoading(true);
      
      if (isInstallment) {
        const installmentId = id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteOption }
        });
        messageApi.success(
          deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        await api.delete(`/cashflow/expense/${id}`);
        messageApi.success("Despesa deletada com sucesso!");
      }
      
      await fetchPeriodData(dateRange);
      return true;
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao deletar despesa");
      return false;
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const togglePaidStatus = useCallback(async (record, type, dateRange) => {
    try {
      setLoading(true);
      
      if (typeof record.id === 'string' && record.id.startsWith('installment_')) {
        const installmentId = record.id.replace('installment_', '');
        const res = await api.put(`/cashflow/installments/${installmentId}/pay`);
        messageApi.success(res.data.message);
      } else {
        const res = await api.put(`/cashflow/transactions/${record.id}/toggle-paid?type=${type}`);
        messageApi.success(res.data.message);
      }
      
      await fetchPeriodData(dateRange);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao alterar status de pagamento");
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchPeriodData]);

  const markAsPaid = useCallback(async (installmentId) => {
    try {
      setLoading(true);
      await api.put(`/cashflow/installments/${installmentId}/pay`);
      messageApi.success("Parcela marcada como paga!");
      await fetchReceivables();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao marcar parcela como paga");
    } finally {
      setLoading(false);
    }
  }, [messageApi, fetchReceivables]);

  return {
    // Estados
    loading,
    incomes,
    expenses,
    pendingInstallments,
    patients,
    stats,
    receivableStats,
    messageApi,
    contextHolder,
    // Funções
    fetchPeriodData,
    fetchReceivables,
    fetchPatients,
    createIncome,
    updateIncome,
    deleteIncome,
    createExpense,
    updateExpense,
    deleteExpense,
    togglePaidStatus,
    markAsPaid,
    setLoading,
  };
};
