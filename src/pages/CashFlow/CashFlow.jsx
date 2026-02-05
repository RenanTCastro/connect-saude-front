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
} from "antd";
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  CheckCircleOutlined,
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
  const [isRecurring, setIsRecurring] = useState(false);
  
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
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpense = expenseData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const netBalance = totalIncome - totalExpense;
    
    setStats({ totalIncome, totalExpense, netBalance });
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
      const formData = {
        ...values,
        dueDate: values.dueDate?.format("YYYY-MM-DD"),
        firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
      };
      
      if (values.hasInstallments) {
        formData.installments = {
          count: values.installmentCount,
          firstDate: formData.firstInstallmentDate,
          interval: values.installmentInterval,
          intervalType: values.intervalType,
        };
      }
      
      await api.post("/cashflow/income", formData);
      messageApi.success("Receita criada com sucesso!");
      setIsIncomeModalOpen(false);
      incomeForm.resetFields();
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao criar receita");
    } finally {
      setLoading(false);
    }
  };

  // Handlers para Despesa
  const handleExpenseSubmit = async (values) => {
    try {
      setLoading(true);
      const formData = {
        ...values,
        dueDate: values.dueDate?.format("YYYY-MM-DD"),
        endDate: values.endDate?.format("YYYY-MM-DD"),
      };
      
      if (values.isRecurring) {
        formData.recurrence = {
          frequency: values.recurrenceFrequency,
          interval: values.recurrenceInterval,
          endDate: formData.endDate,
        };
      }
      
      await api.post("/cashflow/expense", formData);
      messageApi.success("Despesa criada com sucesso!");
      setIsExpenseModalOpen(false);
      expenseForm.resetFields();
      fetchPeriodData();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao criar despesa");
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

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <ArrowUpOutlined style={{ fontSize: 24, color: "#52c41a" }} />
                  <Text type="secondary">Total de Receitas</Text>
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
            <Col xs={24} sm={8}>
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <DollarOutlined
                    style={{
                      fontSize: 24,
                      color: stats.netBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  />
                  <Text type="secondary">Saldo Líquido</Text>
                  <Title
                    level={3}
                    style={{
                      margin: 0,
                      color: stats.netBalance >= 0 ? "#52c41a" : "#ff4d4f",
                    }}
                  >
                    R$ {stats.netBalance.toLocaleString("pt-BR", {
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

      {/* Modal de Nova Receita */}
      <Modal
        title="Nova Receita"
        open={isIncomeModalOpen}
        onOk={() => incomeForm.submit()}
        onCancel={() => {
          setIsIncomeModalOpen(false);
          incomeForm.resetFields();
          setHasInstallments(false);
        }}
        okText="Criar"
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
                    installmentInterval: undefined,
                  });
                }
              }}
            />
          </Form.Item>

          {hasInstallments && (
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
                label="Intervalo"
                rules={[{ required: true, message: "Selecione o intervalo!" }]}
              >
                <Select placeholder="Selecione o intervalo">
                  <Option value="daily">Diário</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensal</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="installmentInterval"
                label="Quantidade do Intervalo"
                rules={[
                  {
                    required: true,
                    message: "Informe a quantidade do intervalo!",
                  },
                ]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Modal de Nova Despesa */}
      <Modal
        title="Nova Despesa"
        open={isExpenseModalOpen}
        onOk={() => expenseForm.submit()}
        onCancel={() => {
          setIsExpenseModalOpen(false);
          expenseForm.resetFields();
          setIsRecurring(false);
        }}
        okText="Criar"
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
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Data de Vencimento"
            rules={[{ required: true, message: "Informe a data de vencimento!" }]}
          >
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
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

          <Form.Item name="isRecurring" valuePropName="checked">
            <Switch 
              checkedChildren="Recorrente" 
              unCheckedChildren="Única"
              onChange={(checked) => {
                setIsRecurring(checked);
                if (!checked) {
                  expenseForm.setFieldsValue({
                    recurrenceFrequency: undefined,
                    recurrenceInterval: undefined,
                    endDate: undefined,
                  });
                }
              }}
            />
          </Form.Item>

          {isRecurring && (
            <>
              <Form.Item
                name="recurrenceFrequency"
                label="Frequência"
                rules={[
                  {
                    required: true,
                    message: "Selecione a frequência!",
                  },
                ]}
              >
                <Select placeholder="Selecione a frequência">
                  <Option value="daily">Diária</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensal</Option>
                  <Option value="yearly">Anual</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="recurrenceInterval"
                label="Intervalo"
                rules={[
                  {
                    required: true,
                    message: "Informe o intervalo!",
                  },
                ]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="endDate"
                label="Data Final (Opcional)"
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}

