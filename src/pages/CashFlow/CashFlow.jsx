import { useState, useEffect } from "react";
import {
  Tabs,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  Space,
  Typography,
  Tag,
  message,
  Row,
  Col,
  Radio,
} from "antd";
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import "./Styles.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CashFlow() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("period");
  
  // Estados para modais
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [incomeForm] = Form.useForm();
  const [expenseForm] = Form.useForm();
  const [hasInstallments, setHasInstallments] = useState(false);
  const [hasInstallmentsExpense, setHasInstallmentsExpense] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isEditingInstallment, setIsEditingInstallment] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ 
    open: false, 
    type: null, 
    id: null, 
    title: null,
    isInstallment: false,
    installmentNumber: null,
    transactionId: null,
    deleteOption: "all" // "single", "from-this", "all"
  });
  
  // Estados para filtros e dados
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("month"),
    dayjs().endOf("month"),
  ]);
  
  // Estados de dados
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    received: 0, // Recebido
    toReceive: 0, // A Receber
    paidExpenses: 0, // Despesas Pagas
    toPayExpenses: 0, // Despesas a Pagar
    cashBalance: 0, // Saldo em Caixa
    projectedBalance: 0, // Saldo Projetado
  });
  
  // Estado de saldo a receber
  const [receivableStats, setReceivableStats] = useState({
    overdue: 0,
    thisMonth: 0,
    nextMonth: 0,
    future: 0,
    total: 0,
  });

  // Fetch dados do período
  const fetchPeriodData = async () => {
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
  };

  // Fetch saldo a receber
  const fetchReceivables = async () => {
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
  };

  const calculateStats = (incomeData, expenseData) => {
    // Receitas
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const received = incomeData
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const toReceive = incomeData
      .filter(item => !item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Despesas
    const totalExpense = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const paidExpenses = expenseData
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    const toPayExpenses = expenseData
      .filter(item => !item.isPaid)
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Saldos
    const netBalance = totalIncome - totalExpense;
    const cashBalance = received - paidExpenses; // Saldo em Caixa
    const projectedBalance = totalIncome - totalExpense; // Saldo Projetado
    
    setStats({ 
      totalIncome, 
      totalExpense, 
      netBalance,
      received,
      toReceive,
      paidExpenses,
      toPayExpenses,
      cashBalance,
      projectedBalance,
    });
  };

  const calculateReceivableStats = (installments) => {
    const now = dayjs();
    const startOfMonth = now.startOf("month");
    const endOfMonth = now.endOf("month");
    const nextMonthStart = now.add(1, "month").startOf("month");
    const nextMonthEnd = now.add(1, "month").endOf("month");
    
    let overdue = 0;
    let thisMonth = 0;
    let nextMonth = 0;
    let future = 0;
    
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
    
    const total = overdue + thisMonth + nextMonth + future;
    
    setReceivableStats({ overdue, thisMonth, nextMonth, future, total });
  };

  // Fetch pacientes
  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar pacientes");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (activeTab === "period") {
      fetchPeriodData();
    } else {
      fetchReceivables();
    }
  }, [activeTab, dateRange]);

  // Handlers para Receita
  const handleIncomeSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (editingIncome) {
        // Editar receita existente
        if (isEditingInstallment) {
          // Para parcelas, enviar apenas os campos permitidos
          const formData = {
            title: values.title,
            description: values.description,
            paymentType: values.paymentType,
            patientId: values.patientId,
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Receita parcelada atualizada com sucesso!");
        } else {
          // Para receitas simples, enviar todos os campos
          const formData = {
            ...values,
            dueDate: values.dueDate?.format("YYYY-MM-DD"),
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Receita atualizada com sucesso!");
        }
      } else {
        // Criar nova receita
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
          firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
        };
        
        if (values.hasInstallments) {
          formData.installments = {
            count: values.installmentCount,
            firstDate: formData.firstInstallmentDate,
            interval: 1, // Intervalo fixo de 1
            intervalType: values.intervalType,
          };
        }
        
        await api.post("/cashflow/income", formData);
        messageApi.success("Receita criada com sucesso!");
      }
      
      setIsIncomeModalOpen(false);
      incomeForm.resetFields();
      setEditingIncome(null);
      setHasInstallments(false);
      setIsEditingInstallment(false);
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error(editingIncome ? "Erro ao atualizar receita" : "Erro ao criar receita");
    } finally {
      setLoading(false);
    }
  };

  const handleEditIncome = (record) => {
    // Verificar se é uma parcela
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    
    if (isInstallment) {
      // Para parcelas, usar o transactionId e mostrar apenas campos permitidos
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar a receita principal.");
        return;
      }
      
      // Remover o sufixo de parcela do título (ex: "Consulta (1/3)" -> "Consulta")
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
      // Para receitas simples, mostrar todos os campos
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
    try {
      setLoading(true);
      
      // Se for uma parcela, usar o endpoint de parcelas com a opção escolhida
      if (deleteConfirm.isInstallment) {
        const installmentId = deleteConfirm.id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteConfirm.deleteOption }
        });
        messageApi.success(
          deleteConfirm.deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteConfirm.deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        // Se for receita simples, deletar normalmente
        await api.delete(`/cashflow/income/${deleteConfirm.id}`);
        messageApi.success("Receita deletada com sucesso!");
      }
      
      setDeleteConfirm({ 
        open: false, 
        type: null, 
        id: null, 
        title: null,
        isInstallment: false,
        installmentNumber: null,
        transactionId: null,
        deleteOption: "all"
      });
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao deletar receita");
    } finally {
      setLoading(false);
    }
  };

  // Handlers para Despesa
  const handleExpenseSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (editingExpense) {
        // Editar despesa existente
        if (isEditingInstallment) {
          // Para parcelas, enviar apenas os campos permitidos
          const formData = {
            title: values.title,
            description: values.description,
            paymentType: values.paymentType,
          };
          await api.put(`/cashflow/expense/${editingExpense.id}`, formData);
          messageApi.success("Despesa parcelada atualizada com sucesso!");
        } else {
          // Para despesas simples, enviar todos os campos
          const formData = {
            ...values,
            dueDate: values.dueDate?.format("YYYY-MM-DD"),
          };
          await api.put(`/cashflow/expense/${editingExpense.id}`, formData);
          messageApi.success("Despesa atualizada com sucesso!");
        }
      } else {
        // Criar nova despesa
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
          firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
        };
        
        if (values.hasInstallments) {
          formData.installments = {
            count: values.installmentCount,
            firstDate: formData.firstInstallmentDate,
            interval: 1, // Intervalo fixo de 1
            intervalType: values.intervalType,
          };
        }
        
        await api.post("/cashflow/expense", formData);
        messageApi.success("Despesa criada com sucesso!");
      }
      
      setIsExpenseModalOpen(false);
      expenseForm.resetFields();
      setEditingExpense(null);
      setHasInstallmentsExpense(false);
      setIsEditingInstallment(false);
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error(editingExpense ? "Erro ao atualizar despesa" : "Erro ao criar despesa");
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (record) => {
    // Verificar se é uma parcela
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    
    if (isInstallment) {
      // Para parcelas, usar o transactionId e mostrar apenas campos permitidos
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar a despesa principal.");
        return;
      }
      
      // Remover o sufixo de parcela do título (ex: "Aluguel (1/3)" -> "Aluguel")
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
      // Para despesas simples, mostrar todos os campos
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
    try {
      setLoading(true);
      
      // Se for uma parcela, usar o endpoint de parcelas com a opção escolhida
      if (deleteConfirm.isInstallment) {
        const installmentId = deleteConfirm.id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteConfirm.deleteOption }
        });
        messageApi.success(
          deleteConfirm.deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteConfirm.deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        // Se for despesa simples, deletar normalmente
        await api.delete(`/cashflow/expense/${deleteConfirm.id}`);
        messageApi.success("Despesa deletada com sucesso!");
      }
      
      setDeleteConfirm({ 
        open: false, 
        type: null, 
        id: null, 
        title: null,
        isInstallment: false,
        installmentNumber: null,
        transactionId: null,
        deleteOption: "all"
      });
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao deletar despesa");
    } finally {
      setLoading(false);
    }
  };

  // Handler para marcar parcela como paga
  const handleMarkAsPaid = async (installmentId) => {
    try {
      setLoading(true);
      await api.put(`/cashflow/installments/${installmentId}/pay`);
      messageApi.success("Parcela marcada como paga!");
      fetchReceivables();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao marcar parcela como paga");
    } finally {
      setLoading(false);
    }
  };

  // Handler para toggle do status de pagamento
  const handleTogglePaidStatus = async (record, type) => {
    try {
      setLoading(true);
      
      // Se for uma parcela (ID começa com "installment_"), usar endpoint de parcelas
      if (typeof record.id === 'string' && record.id.startsWith('installment_')) {
        const installmentId = record.id.replace('installment_', '');
        const res = await api.put(`/cashflow/installments/${installmentId}/pay`);
        messageApi.success(res.data.message);
      } else {
        // Se for transaction simples, usar endpoint de transactions
        const res = await api.put(`/cashflow/transactions/${record.id}/toggle-paid?type=${type}`);
        messageApi.success(res.data.message);
      }
      
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao alterar status de pagamento");
    } finally {
      setLoading(false);
    }
  };

  // Colunas da tabela de receitas
  const incomeColumns = [
    {
      title: "Data",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Paciente",
      dataIndex: "patientName",
      key: "patientName",
    },
    {
      title: "Tipo",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (type) => (
        <Tag color={type === "Dinheiro" ? "green" : type === "PIX" ? "blue" : "purple"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          R$ {Number(value).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
      align: "right",
    },
    {
      title: "Pago",
      key: "isPaid",
      render: (_, record) => (
        <Switch
          checked={record.isPaid || false}
          onChange={() => handleTogglePaidStatus(record, "income")}
          checkedChildren="Sim"
          unCheckedChildren="Não"
        />
      ),
      align: "center",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
        return (
          <Space>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => handleEditIncome(record)}
              size="small"
              title={isInstallment ? "Editar receita parcelada (apenas alguns campos)" : "Editar"}
            >
              Editar
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
                setDeleteConfirm({ 
                  open: true, 
                  type: "income", 
                  id: record.id, 
                  title: record.title,
                  isInstallment: isInstallment,
                  installmentNumber: record.installmentNumber || null,
                  transactionId: record.transactionId || null,
                  deleteOption: isInstallment ? "single" : "all"
                });
              }}
              size="small"
            >
              Excluir
            </Button>
          </Space>
        );
      },
      align: "right",
    },
  ];

  // Colunas da tabela de despesas
  const expenseColumns = [
    {
      title: "Data",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tipo",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (type) => (
        <Tag color={type === "Dinheiro" ? "green" : type === "PIX" ? "blue" : "purple"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Text strong style={{ color: "#ff4d4f" }}>
          R$ {Number(value).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
      align: "right",
    },
    {
      title: "Pago",
      key: "isPaid",
      render: (_, record) => (
        <Switch
          checked={record.isPaid || false}
          onChange={() => handleTogglePaidStatus(record, "expense")}
          checkedChildren="Sim"
          unCheckedChildren="Não"
        />
      ),
      align: "center",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
        return (
          <Space>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => handleEditExpense(record)}
              size="small"
              title={isInstallment ? "Editar despesa parcelada (apenas alguns campos)" : "Editar"}
            >
              Editar
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
                setDeleteConfirm({ 
                  open: true, 
                  type: "expense", 
                  id: record.id, 
                  title: record.title,
                  isInstallment: isInstallment,
                  installmentNumber: record.installmentNumber || null,
                  transactionId: record.transactionId || null,
                  deleteOption: isInstallment ? "single" : "all"
                });
              }}
              size="small"
            >
              Excluir
            </Button>
          </Space>
        );
      },
      align: "right",
    },
  ];

  // Colunas da tabela de saldo a receber
  const receivableColumns = [
    {
      title: "Vencimento",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => {
        const isOverdue = dayjs(date).isBefore(dayjs(), "day");
        return (
          <Text style={{ color: isOverdue ? "#ff4d4f" : undefined }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Paciente",
      dataIndex: "patientName",
      key: "patientName",
    },
    {
      title: "Parcela",
      dataIndex: "installment",
      key: "installment",
      render: (inst) => `${inst.current}/${inst.total}`,
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value, record) => {
        const isOverdue = dayjs(record.dueDate).isBefore(dayjs(), "day");
        return (
          <Text strong style={{ color: isOverdue ? "#ff4d4f" : "#52c41a" }}>
            R$ {Number(value).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        );
      },
      align: "right",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => handleMarkAsPaid(record.id)}
          size="small"
          className="mark-paid-button"
        >
          Marcar como Paga
        </Button>
      ),
    },
  ];

  const tabsItems = [
    {
      key: "period",
      label: "Fluxo por Período",
      children: (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text strong>Selecione o período:</Text>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
                style={{ width: "100%", maxWidth: 300 }}
              />
            </Space>
          </div>

          {/* Receitas */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <ArrowUpOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <Text type="secondary">Receita Total</Text>
                  <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                    R$ {stats.totalIncome.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <Text type="secondary">Recebido</Text>
                  <Title level={3} style={{ margin: 0, color: "#52c41a" }}>
                    R$ {stats.received.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <ArrowUpOutlined style={{ fontSize: 24, color: "#1890ff" }} />
                  <Text type="secondary">A Receber</Text>
                  <Title level={3} style={{ margin: 0, color: "#1890ff" }}>
                    R$ {stats.toReceive.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Despesas */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <CheckCircleOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                  <Text type="secondary">Despesas Pagas</Text>
                  <Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
                    R$ {stats.paidExpenses.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <ArrowDownOutlined style={{ fontSize: 24, color: "#faad14" }} />
                  <Text type="secondary">Despesas a Pagar</Text>
                  <Title level={3} style={{ margin: 0, color: "#faad14" }}>
                    R$ {stats.toPayExpenses.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <ArrowDownOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />
                  <Text type="secondary">Total de Despesas</Text>
                  <Title level={3} style={{ margin: 0, color: "#ff4d4f" }}>
                    R$ {stats.totalExpense.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* Saldos */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <DollarOutlined
                    style={{
                      fontSize: 24,
                      color: stats.cashBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  />
                  <Text type="secondary">Saldo em Caixa</Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color: stats.cashBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    R$ {stats.cashBalance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <DollarOutlined
                    style={{
                      fontSize: 24,
                      color: stats.projectedBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  />
                  <Text type="secondary">Saldo Projetado</Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color: stats.projectedBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    R$ {stats.projectedBalance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Title>
                </Space>
              </Card>
            </Col>
          </Row>

          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 16,
                }}
                className="section-header"
              >
                <Title level={4} style={{ margin: 0 }}>
                  Receitas
                </Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setIsIncomeModalOpen(true)}
                  block
                  className="mobile-button"
                >
                  Nova Receita
                </Button>
              </div>
              <div className="table-wrapper">
                <Table
                  columns={incomeColumns}
                  dataSource={incomes}
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
                  rowKey="id"
                  scroll={{ x: true }}
                  showHeader={incomes.length > 0}
                  locale={{ emptyText: "Nenhum dado disponível" }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 16,
                }}
                className="section-header"
              >
                <Title level={4} style={{ margin: 0 }}>
                  Despesas
                </Title>
                <Button
                  type="primary"
                  danger
                  icon={<PlusOutlined />}
                  onClick={() => setIsExpenseModalOpen(true)}
                  block
                  className="mobile-button"
                >
                  Nova Despesa
                </Button>
              </div>
              <div className="table-wrapper">
                <Table
                  columns={expenseColumns}
                  dataSource={expenses}
                  loading={loading}
                  pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
                  rowKey="id"
                  scroll={{ x: true }}
                  showHeader={expenses.length > 0}
                  locale={{ emptyText: "Nenhum dado disponível" }}
                />
              </div>
            </div>
          </Space>
        </div>
      ),
    },
    {
      key: "receivables",
      label: "Saldo a Receber",
      children: (
        <div>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              Saldo Total a Receber
            </Title>
            <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
              R$ {receivableStats.total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Title>
          </Card>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={6}>
              <Card>
                <Text type="secondary">Vencidas</Text>
                <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
                  R$ {receivableStats.overdue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Title>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Text type="secondary">Este Mês</Text>
                <Title level={4} style={{ margin: 0 }}>
                  R$ {receivableStats.thisMonth.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Title>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Text type="secondary">Próximo Mês</Text>
                <Title level={4} style={{ margin: 0 }}>
                  R$ {receivableStats.nextMonth.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Title>
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Text type="secondary">Futuro</Text>
                <Title level={4} style={{ margin: 0 }}>
                  R$ {receivableStats.future.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Title>
              </Card>
            </Col>
          </Row>

          <Title level={4} style={{ marginBottom: 16 }}>
            Parcelas Pendentes
          </Title>
          <div className="table-wrapper">
            <Table
              columns={receivableColumns}
              dataSource={pendingInstallments}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
              rowKey="id"
              scroll={{ x: true }}
              showHeader={pendingInstallments.length > 0}
              locale={{ emptyText: "Nenhum dado disponível" }}
              rowClassName={(record) =>
                dayjs(record.dueDate).isBefore(dayjs(), "day")
                  ? "overdue-row"
                  : ""
              }
            />
          </div>
        </div>
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

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        title="Confirmar Exclusão"
        open={deleteConfirm.open}
        onOk={() => {
          if (deleteConfirm.type === "income") {
            handleDeleteIncome();
          } else {
            handleDeleteExpense();
          }
        }}
        onCancel={() => setDeleteConfirm({ 
          open: false, 
          type: null, 
          id: null, 
          title: null,
          isInstallment: false,
          installmentNumber: null,
          transactionId: null,
          deleteOption: "all"
        })}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
      >
        <div>
          <p style={{ marginBottom: 16 }}>
            Tem certeza que deseja excluir {deleteConfirm.type === "income" ? "a receita" : "a despesa"} <strong>{deleteConfirm.title}</strong>?
          </p>
          
          {deleteConfirm.isInstallment && (
            <div>
              <p style={{ marginBottom: 12, fontWeight: 500 }}>O que você deseja excluir?</p>
              <Radio.Group
                value={deleteConfirm.deleteOption}
                onChange={(e) => setDeleteConfirm({ ...deleteConfirm, deleteOption: e.target.value })}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio value="single">
                    <strong>Apenas esta parcela</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove apenas a parcela selecionada
                    </div>
                  </Radio>
                  <Radio value="from-this">
                    <strong>Esta e as próximas</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove esta parcela e todas as parcelas futuras
                    </div>
                  </Radio>
                  <Radio value="all">
                    <strong>Toda a recorrência</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove todas as parcelas desta receita
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Nova/Editar Receita */}
      <Modal
        title={editingIncome ? (isEditingInstallment ? "Editar Receita Parcelada" : "Editar Receita") : "Nova Receita"}
        open={isIncomeModalOpen}
        onOk={() => incomeForm.submit()}
        onCancel={() => {
          setIsIncomeModalOpen(false);
          incomeForm.resetFields();
          setHasInstallments(false);
          setEditingIncome(null);
          setIsEditingInstallment(false);
        }}
        okText={editingIncome ? "Salvar" : "Criar"}
        cancelText="Cancelar"
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={incomeForm}
          layout="vertical"
          onFinish={handleIncomeSubmit}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Informe o título!" }]}
          >
            <Input placeholder="Título da receita" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <TextArea rows={3} placeholder="Descrição da receita" />
          </Form.Item>

          {!isEditingInstallment && (
            <>
              <Form.Item
                name="amount"
                label="Valor"
                rules={[{ required: true, message: "Informe o valor!" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  prefix="R$"
                  placeholder="0,00"
                  decimalSeparator=","
                  thousandSeparator="."
                />
              </Form.Item>

              <Form.Item
                name="dueDate"
                label="Data de Vencimento"
                rules={[{ required: !hasInstallments, message: "Informe a data de vencimento!" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabled={hasInstallments}
                />
              </Form.Item>
            </>
          )}

          {isEditingInstallment && (
            <div style={{ 
              padding: "12px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "4px",
              marginBottom: "16px"
            }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <strong>Nota:</strong> Ao editar uma receita parcelada, você pode alterar apenas o título, descrição, tipo de pagamento e paciente. 
                O valor e as datas das parcelas não podem ser alterados.
              </Text>
            </div>
          )}

          <Form.Item name="patientId" label="Paciente">
            <Select
              placeholder="Selecione o paciente"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {patients.map((patient) => (
                <Option key={patient.id} value={patient.id} label={patient.full_name}>
                  {patient.full_name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="paymentType"
            label="Tipo de Pagamento"
            rules={[{ required: true, message: "Selecione o tipo de pagamento!" }]}
          >
            <Select placeholder="Selecione o tipo">
              <Option value="Dinheiro">Dinheiro</Option>
              <Option value="PIX">PIX</Option>
              <Option value="Cartão">Cartão</Option>
              <Option value="Transferência">Transferência</Option>
            </Select>
          </Form.Item>

          {!editingIncome && !isEditingInstallment && (
            <Form.Item name="hasInstallments" valuePropName="checked">
              <Switch 
                checkedChildren="Parcelado" 
                unCheckedChildren="À vista"
                onChange={(checked) => {
                  setHasInstallments(checked);
                  if (!checked) {
                    incomeForm.setFieldsValue({
                      installmentCount: undefined,
                      firstInstallmentDate: undefined,
                      intervalType: undefined,
                    });
                  }
                }}
              />
            </Form.Item>
          )}

          {hasInstallments && !editingIncome && !isEditingInstallment && (
            <>
              <Form.Item
                name="installmentCount"
                label="Número de Parcelas"
                rules={[
                  {
                    required: true,
                    message: "Informe o número de parcelas!",
                  },
                ]}
              >
                <InputNumber min={2} max={60} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="firstInstallmentDate"
                label="Data da Primeira Parcela"
                rules={[
                  {
                    required: true,
                    message: "Informe a data da primeira parcela!",
                  },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item
                name="intervalType"
                label="Intervalo entre Parcelas"
                rules={[{ required: true, message: "Selecione o intervalo!" }]}
              >
                <Select placeholder="Selecione o intervalo">
                  <Option value="daily">Diário</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensal</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Modal de Nova/Editar Despesa */}
      <Modal
        title={editingExpense ? (isEditingInstallment ? "Editar Despesa Parcelada" : "Editar Despesa") : "Nova Despesa"}
        open={isExpenseModalOpen}
        onOk={() => expenseForm.submit()}
        onCancel={() => {
          setIsExpenseModalOpen(false);
          expenseForm.resetFields();
          setHasInstallmentsExpense(false);
          setEditingExpense(null);
          setIsEditingInstallment(false);
        }}
        okText={editingExpense ? "Salvar" : "Criar"}
        cancelText="Cancelar"
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={expenseForm}
          layout="vertical"
          onFinish={handleExpenseSubmit}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Informe o título!" }]}
          >
            <Input placeholder="Título da despesa" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <TextArea rows={3} placeholder="Descrição da despesa" />
          </Form.Item>

          {!isEditingInstallment && (
            <>
              <Form.Item
                name="amount"
                label="Valor"
                rules={[{ required: true, message: "Informe o valor!" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  prefix="R$"
                  placeholder="0,00"
                  decimalSeparator=","
                  thousandSeparator="."
                />
              </Form.Item>

              <Form.Item
                name="dueDate"
                label="Data de Vencimento"
                rules={[{ required: !hasInstallmentsExpense, message: "Informe a data de vencimento!" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabled={hasInstallmentsExpense}
                />
              </Form.Item>
            </>
          )}

          {isEditingInstallment && (
            <div style={{ 
              padding: "12px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "4px",
              marginBottom: "16px"
            }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <strong>Nota:</strong> Ao editar uma despesa parcelada, você pode alterar apenas o título, descrição e tipo de pagamento. 
                O valor e as datas das parcelas não podem ser alterados.
              </Text>
            </div>
          )}

          <Form.Item
            name="paymentType"
            label="Tipo de Pagamento"
            rules={[{ required: true, message: "Selecione o tipo de pagamento!" }]}
          >
            <Select placeholder="Selecione o tipo">
              <Option value="Dinheiro">Dinheiro</Option>
              <Option value="PIX">PIX</Option>
              <Option value="Cartão">Cartão</Option>
              <Option value="Transferência">Transferência</Option>
            </Select>
          </Form.Item>

          {!editingExpense && !isEditingInstallment && (
            <Form.Item name="hasInstallments" valuePropName="checked">
              <Switch 
                checkedChildren="Parcelado" 
                unCheckedChildren="À vista"
                onChange={(checked) => {
                  setHasInstallmentsExpense(checked);
                  if (!checked) {
                    expenseForm.setFieldsValue({
                      installmentCount: undefined,
                      firstInstallmentDate: undefined,
                      intervalType: undefined,
                    });
                  }
                }}
              />
            </Form.Item>
          )}

          {hasInstallmentsExpense && !editingExpense && !isEditingInstallment && (
            <>
              <Form.Item
                name="installmentCount"
                label="Número de Parcelas"
                rules={[
                  {
                    required: true,
                    message: "Informe o número de parcelas!",
                  },
                ]}
              >
                <InputNumber min={2} max={60} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="firstInstallmentDate"
                label="Data da Primeira Parcela"
                rules={[
                  {
                    required: true,
                    message: "Informe a data da primeira parcela!",
                  },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item
                name="intervalType"
                label="Intervalo entre Parcelas"
                rules={[{ required: true, message: "Selecione o intervalo!" }]}
              >
                <Select placeholder="Selecione o intervalo">
                  <Option value="daily">Diário</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensal</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

