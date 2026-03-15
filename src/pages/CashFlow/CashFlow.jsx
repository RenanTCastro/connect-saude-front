import { useState, useEffect } from "react";
import { Tabs, Form, Typography } from "antd";
import dayjs from "dayjs";
import { useCashFlow } from "./hooks/useCashFlow";
import { PeriodTab } from "./components/PeriodTab/PeriodTab";
import { ReceivablesTab } from "./components/ReceivablesTab/ReceivablesTab";
import { IncomeFormModal } from "./components/IncomeFormModal/IncomeFormModal";
import { ExpenseFormModal } from "./components/ExpenseFormModal/ExpenseFormModal";
import { DeleteTransactionModal } from "./components/DeleteTransactionModal/DeleteTransactionModal";
import "./Styles.css";

const { Title } = Typography;

export default function CashFlow() {
  const [activeTab, setActiveTab] = useState("period");
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  
  // Estados para modais
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incomeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [hasInstallments, setHasInstallments] = useState(false);
  const [hasInstallmentsExpense, setHasInstallmentsExpense] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isEditingInstallment, setIsEditingInstallment] = useState(false);
  const [deleteTransaction, setDeleteTransaction] = useState(null);

  // Hook customizado
  const {
    loading,
    incomes,
    expenses,
    pendingInstallments,
    patients,
    stats,
    receivableStats,
    messageApi,
    contextHolder,
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
  } = useCashFlow();

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === "period") {
      fetchPeriodData(dateRange);
    } else {
      fetchReceivables();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange]);

  // Handlers para Receita
  const handleIncomeSubmit = async (values) => {
    if (editingIncome) {
      const success = await updateIncome(
        editingIncome.id,
        values,
        isEditingInstallment,
        dateRange
      );
      if (success) {
        setIsIncomeModalOpen(false);
        incomeForm.resetFields();
        setEditingIncome(null);
        setHasInstallments(false);
        setIsEditingInstallment(false);
      }
    } else {
      const success = await createIncome(values, dateRange);
      if (success) {
        setIsIncomeModalOpen(false);
        incomeForm.resetFields();
        setHasInstallments(false);
      }
    }
  };

  const handleEditIncome = (record) => {
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    
    if (isInstallment) {
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar a receita principal.");
        return;
      }
      
      const cleanTitle = record.title?.replace(/\s*\(\d+\/\d+\)$/, '') || "";
      
      setEditingIncome({
        id: record.transactionId,
        title: cleanTitle,
        description: record.description || "",
        patientId: record.patientId || undefined,
        paymentType: record.paymentType,
      });
      setIsEditingInstallment(true);
      
      incomeForm.setFieldsValue({
        title: cleanTitle,
        description: record.description || "",
        patientId: record.patientId || undefined,
        paymentType: record.paymentType,
      });
    } else {
      setEditingIncome(record);
      setIsEditingInstallment(false);
      
      incomeForm.setFieldsValue({
        title: record.title || "",
        description: record.description || "",
        amount: record.amount,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
        patientId: record.patientId || undefined,
        paymentType: record.paymentType,
      });
    }
    
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = async () => {
    if (!deleteTransaction) return;
    
    const success = await deleteIncome(
      deleteTransaction.id,
      deleteTransaction.isInstallment,
      deleteTransaction.deleteOption,
      dateRange
    );
    
    if (success) {
      setIsDeleteModalOpen(false);
      setDeleteTransaction(null);
    }
  };

  const handleDeleteIncomeClick = (record) => {
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    setDeleteTransaction({
      id: record.id,
      title: record.title,
      type: "income",
      isInstallment: isInstallment,
      installmentNumber: record.installmentNumber || null,
      transactionId: record.transactionId || null,
      deleteOption: isInstallment ? "single" : "all"
    });
    setIsDeleteModalOpen(true);
  };

  // Handlers para Despesa
  const handleExpenseSubmit = async (values) => {
    if (editingExpense) {
      const success = await updateExpense(
        editingExpense.id,
        values,
        isEditingInstallment,
        dateRange
      );
      if (success) {
        setIsExpenseModalOpen(false);
        expenseForm.resetFields();
        setEditingExpense(null);
        setHasInstallmentsExpense(false);
        setIsEditingInstallment(false);
      }
    } else {
      const success = await createExpense(values, dateRange);
      if (success) {
        setIsExpenseModalOpen(false);
        expenseForm.resetFields();
        setHasInstallmentsExpense(false);
      }
    }
  };

  const handleEditExpense = (record) => {
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    
    if (isInstallment) {
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar a despesa principal.");
        return;
      }
      
      const cleanTitle = record.title?.replace(/\s*\(\d+\/\d+\)$/, '') || "";
      
      setEditingExpense({
        id: record.transactionId,
        title: cleanTitle,
        description: record.description || "",
        paymentType: record.paymentType,
      });
      setIsEditingInstallment(true);
      
      expenseForm.setFieldsValue({
        title: cleanTitle,
        description: record.description || "",
        paymentType: record.paymentType,
      });
    } else {
      setEditingExpense(record);
      setIsEditingInstallment(false);
      
      expenseForm.setFieldsValue({
        title: record.title || "",
        description: record.description || "",
        amount: record.amount,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
        paymentType: record.paymentType,
      });
    }
    
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!deleteTransaction) return;
    
    const success = await deleteExpense(
      deleteTransaction.id,
      deleteTransaction.isInstallment,
      deleteTransaction.deleteOption,
      dateRange
    );
    
    if (success) {
      setIsDeleteModalOpen(false);
      setDeleteTransaction(null);
    }
  };

  const handleDeleteExpenseClick = (record) => {
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    setDeleteTransaction({
      id: record.id,
      title: record.title,
      type: "expense",
      isInstallment: isInstallment,
      installmentNumber: record.installmentNumber || null,
      transactionId: record.transactionId || null,
      deleteOption: isInstallment ? "single" : "all"
    });
    setIsDeleteModalOpen(true);
  };

  const tabsItems = [
    {
      key: "period",
      label: "Fluxo por Período",
      children: (
        <PeriodTab
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          stats={stats}
          incomes={incomes}
          expenses={expenses}
          loading={loading}
          onAddIncome={() => {
            setIsIncomeModalOpen(true);
            setEditingIncome(null);
            setIsEditingInstallment(false);
            setHasInstallments(false);
            incomeForm.resetFields();
          }}
          onAddExpense={() => {
            setIsExpenseModalOpen(true);
            setEditingExpense(null);
            setIsEditingInstallment(false);
            setHasInstallmentsExpense(false);
            expenseForm.resetFields();
          }}
          onEditIncome={handleEditIncome}
          onEditExpense={handleEditExpense}
          onDeleteIncome={handleDeleteIncomeClick}
          onDeleteExpense={handleDeleteExpenseClick}
          onTogglePaid={(record, type) => togglePaidStatus(record, type, dateRange)}
        />
      ),
    },
    {
      key: "receivables",
      label: "Saldo a Receber",
      children: (
        <ReceivablesTab
          receivableStats={receivableStats}
          pendingInstallments={pendingInstallments}
          loading={loading}
          onMarkAsPaid={markAsPaid}
        />
      ),
    },
  ];

  return (
    <div className="cashflow-container">
      {contextHolder}
      <Title level={3}>Fluxo de Caixa</Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabsItems}
        size="large"
      />

      {/* Modal de Nova/Editar Receita */}
      <IncomeFormModal
        open={isIncomeModalOpen}
        loading={loading}
        form={incomeForm}
        editingItem={editingIncome}
        isEditingInstallment={isEditingInstallment}
        patients={patients}
        onOk={handleIncomeSubmit}
        onCancel={() => {
          setIsIncomeModalOpen(false);
          incomeForm.resetFields();
          setHasInstallments(false);
          setEditingIncome(null);
          setIsEditingInstallment(false);
        }}
        onInstallmentToggle={(checked) => setHasInstallments(checked)}
      />

      {/* Modal de Nova/Editar Despesa */}
      <ExpenseFormModal
        open={isExpenseModalOpen}
        loading={loading}
        form={expenseForm}
        editingItem={editingExpense}
        isEditingInstallment={isEditingInstallment}
        onOk={handleExpenseSubmit}
        onCancel={() => {
          setIsExpenseModalOpen(false);
          expenseForm.resetFields();
          setHasInstallmentsExpense(false);
          setEditingExpense(null);
          setIsEditingInstallment(false);
        }}
        onInstallmentToggle={(checked) => setHasInstallmentsExpense(checked)}
      />

      {/* Modal de Confirmação de Exclusão */}
      <DeleteTransactionModal
        open={isDeleteModalOpen}
        loading={loading}
        transaction={deleteTransaction}
        onOk={() => {
          if (deleteTransaction?.type === "income") {
            handleDeleteIncome();
          } else {
            handleDeleteExpense();
          }
        }}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTransaction(null);
        }}
        onDeleteOptionChange={(option) => {
          setDeleteTransaction({ ...deleteTransaction, deleteOption: option });
        }}
      />
    </div>
  );
}
