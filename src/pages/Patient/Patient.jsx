import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Spin,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  Tabs,
  Table,
  Switch,
  InputNumber,
  Tag,
  Radio,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import PatientForm from "../../components/PatientForm/PatientForm";
import { fetchAddressByCEP } from "../../utils/cep";
import "./Styles.css";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedFormId, setSelectedFormId] = useState(1);
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  
  // Estados para débitos
  const [incomes, setIncomes] = useState([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm] = Form.useForm();
  const [editingIncome, setEditingIncome] = useState(null);
  const [hasInstallments, setHasInstallments] = useState(false);
  const [isEditingInstallment, setIsEditingInstallment] = useState(false);
  const [deleteIncomeConfirm, setDeleteIncomeConfirm] = useState({ 
    open: false, 
    id: null, 
    title: null,
    isInstallment: false,
    deleteOption: "all"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);

      // Buscar consultas do paciente
      try {
        const appointmentsRes = await api.get(`/appointments`, {
          params: { patient_id: id, type: "consulta" }
        });
        setAppointments(appointmentsRes.data);
      } catch (appointmentErr) {
        console.error("Erro ao carregar consultas:", appointmentErr);
        setAppointments([]);
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao carregar dados do paciente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (activeTab === "form") {
      fetchForms();
    }
  }, [activeTab]);

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const response = await api.get("/forms");
      // Filtrar apenas os formulários com IDs 1, 2, 3 e 4
      const filteredForms = response.data.filter(form => [1, 2, 3, 4].includes(form.id_form));
      setForms(filteredForms);
      // Se o formulário selecionado não estiver na lista, selecionar o primeiro
      if (filteredForms.length > 0 && !filteredForms.find(f => f.id_form === selectedFormId)) {
        setSelectedFormId(filteredForms[0].id_form);
      }
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
      messageApi.error("Erro ao carregar formulários.");
    } finally {
      setLoadingForms(false);
    }
  };

  const handleEdit = () => {
    form.setFieldsValue({
      ...patient,
      birth_date: patient?.birth_date ? dayjs(patient.birth_date) : null,
    });
    setIsEditModalOpen(true);
  };

  const handleCEPBlur = async (e) => {
    const cep = e.target.value;
    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      return;
    }

    const addressData = await fetchAddressByCEP(cep);
    if (addressData) {
      form.setFieldsValue({
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      });
      messageApi.success("Endereço preenchido automaticamente!");
    } else {
      messageApi.warning("CEP não encontrado. Por favor, preencha o endereço manualmente.");
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        birth_date: values.birth_date
          ? values.birth_date.format("YYYY-MM-DD")
          : null,
      };

      await api.put(`/patients/${id}`, payload);
      messageApi.success("Paciente atualizado com sucesso!");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Erro ao atualizar paciente.";
      messageApi.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${id}`);
      messageApi.success("Paciente excluído com sucesso!");
      navigate("/app/patient");
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao excluir paciente.");
    }
  };

  // Funções para gerenciar débitos
  const fetchIncomes = async () => {
    try {
      setLoadingIncomes(true);
      const res = await api.get(`/patients/${id}/invoices`);
      // Transformar os dados para o formato esperado pela tabela
      const formattedIncomes = res.data.map((invoice) => {
        // Se for uma parcela (tem installment)
        if (invoice.installment) {
          return {
            id: `installment_${invoice.id}`,
            transactionId: invoice.transactionId,
            title: `${invoice.title} (${invoice.installment.current}/${invoice.installment.total})`,
            description: invoice.description,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            paymentDate: invoice.paymentDate,
            isPaid: invoice.isPaid,
            paymentType: invoice.paymentType,
            patientId: id,
            installmentNumber: invoice.installment.current,
          };
        }
        // Se for débito simples
        return {
          id: invoice.id,
          title: invoice.title,
          description: invoice.description,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          paymentDate: invoice.paymentDate,
          isPaid: invoice.isPaid,
          paymentType: invoice.paymentType,
          patientId: id,
        };
      });
      setIncomes(formattedIncomes);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar débitos do paciente.");
      setIncomes([]);
    } finally {
      setLoadingIncomes(false);
    }
  };

  useEffect(() => {
    if (activeTab === "incomes") {
      fetchIncomes();
    }
  }, [activeTab, id]);

  const handleIncomeSubmit = async (values) => {
    try {
      setLoadingIncomes(true);
      
      if (editingIncome) {
        // Editar débito existente
        if (isEditingInstallment) {
          // Para parcelas, enviar apenas os campos permitidos
          const formData = {
            title: values.title,
            description: values.description,
            paymentType: values.paymentType,
            patientId: id,
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Débito parcelado atualizado com sucesso!");
        } else {
          // Para débitos simples, enviar todos os campos
          const formData = {
            ...values,
            dueDate: values.dueDate?.format("YYYY-MM-DD"),
            patientId: id,
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Débito atualizado com sucesso!");
        }
      } else {
        // Criar novo débito
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
          firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
          patientId: id,
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
        messageApi.success("Débito criado com sucesso!");
      }
      
      setIsIncomeModalOpen(false);
      incomeForm.resetFields();
      setEditingIncome(null);
      setHasInstallments(false);
      setIsEditingInstallment(false);
      fetchIncomes();
    } catch (err) {
      console.error(err);
      messageApi.error(editingIncome ? "Erro ao atualizar débito" : "Erro ao criar débito");
    } finally {
      setLoadingIncomes(false);
    }
  };

  const handleEditIncome = (record) => {
    // Verificar se é uma parcela
    const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
    
    if (isInstallment) {
      // Para parcelas, usar o transactionId e mostrar apenas campos permitidos
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar o débito principal.");
        return;
      }
      
      // Remover o sufixo de parcela do título
      const cleanTitle = record.title?.replace(/\s*\(\d+\/\d+\)$/, '') || "";
      
      setEditingIncome({
        id: record.transactionId,
        title: cleanTitle,
        description: record.description || "",
        patientId: id,
        paymentType: record.paymentType,
      });
      setIsEditingInstallment(true);
      
      incomeForm.setFieldsValue({
        title: cleanTitle,
        description: record.description || "",
        patientId: id,
        paymentType: record.paymentType,
      });
    } else {
      // Para débitos simples, mostrar todos os campos
      setEditingIncome(record);
      setIsEditingInstallment(false);
      
      incomeForm.setFieldsValue({
        title: record.title || "",
        description: record.description || "",
        amount: record.amount,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
        patientId: id,
        paymentType: record.paymentType,
      });
    }
    
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = async () => {
    try {
      setLoadingIncomes(true);
      
      // Se for uma parcela, usar o endpoint de parcelas com a opção escolhida
      if (deleteIncomeConfirm.isInstallment) {
        const installmentId = deleteIncomeConfirm.id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteIncomeConfirm.deleteOption }
        });
        messageApi.success(
          deleteIncomeConfirm.deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteIncomeConfirm.deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        // Se for débito simples, deletar normalmente
        await api.delete(`/cashflow/income/${deleteIncomeConfirm.id}`);
        messageApi.success("Débito deletado com sucesso!");
      }
      
      setDeleteIncomeConfirm({ 
        open: false, 
        id: null, 
        title: null,
        isInstallment: false,
        deleteOption: "all"
      });
      fetchIncomes();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao deletar débito");
    } finally {
      setLoadingIncomes(false);
    }
  };

  const handleTogglePaidStatus = async (record) => {
    try {
      setLoadingIncomes(true);
      
      // Se for uma parcela (ID começa com "installment_"), usar endpoint de parcelas
      if (typeof record.id === 'string' && record.id.startsWith('installment_')) {
        const installmentId = record.id.replace('installment_', '');
        const res = await api.put(`/cashflow/installments/${installmentId}/pay`);
        messageApi.success(res.data.message);
      } else {
        // Se for transaction simples, usar endpoint de transactions
        const res = await api.put(`/cashflow/transactions/${record.id}/toggle-paid?type=income`);
        messageApi.success(res.data.message);
      }
      
      fetchIncomes();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao alterar status de pagamento");
    } finally {
      setLoadingIncomes(false);
    }
  };

  // Colunas da tabela de débitos
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
          onChange={() => handleTogglePaidStatus(record)}
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
              title={isInstallment ? "Editar débito parcelado (apenas alguns campos)" : "Editar"}
            >
              Editar
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
                setDeleteIncomeConfirm({ 
                  open: true, 
                  id: record.id, 
                  title: record.title,
                  isInstallment: isInstallment,
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

  if (loading) return <Spin style={{ display: "block", margin: "80px auto" }} />;

  return (
    <div style={{ padding: 24 }} className="patient-details-container">
      {contextHolder}

      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/app/patient")}
        style={{ marginBottom: 8 }}
      >
        Voltar
      </Button>

      <div className="patient-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <Title level={3}>Paciente</Title>
        <Space>
          <Button type="default" icon={<EditOutlined />} onClick={handleEdit} className="edit-button">
            Editar
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="delete-button"
          >
            Excluir
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "info",
            label: "Informações",
            children: (
              <>
                <Row gutter={16}>
                  <Col xs={24} sm={24} md={12}>
                    <Card title="Dados pessoais">
                      <p><Text strong>Código do paciente:</Text> {patient?.id}</p>
                      <p><Text strong>Nome:</Text> {patient?.full_name}</p>
                      <p><Text strong>Número do paciente:</Text> {patient?.patient_number}</p>
                      <p><Text strong>CPF:</Text> {formatCPF(patient?.cpf)}</p>
                      <p><Text strong>RG:</Text> {patient?.rg || "-"}</p>
                      <p><Text strong>Data de nascimento:</Text> {formatBirthDate(patient?.birth_date)}</p> 
                     <p><Text strong>Idade:</Text> {patient?.age} anos</p>
                      <p><Text strong>Sexo:</Text> {patient?.gender}</p>
                      <p><Text strong>Celular:</Text> {formatPhone(patient?.phone)}</p>
                      <p><Text strong>CEP:</Text> {patient?.zip_code || "-"}</p>
                      <p><Text strong>Endereço:</Text> {patient?.street}</p>
                      {patient?.complement && (
                        <p><Text strong>Complemento:</Text> {patient.complement}</p>
                      )}
                      <p><Text strong>Bairro:</Text> {patient?.neighborhood}</p>
                      <p><Text strong>Cidade:</Text> {patient?.city} - {patient?.state}</p>
                    </Card>
                  </Col>

                  <Col xs={24} sm={24} md={12}>
                    <Card title="Consultas" style={{ maxHeight: 400, overflowY: "auto" }}>
                      {appointments.length === 0 ? (
                        <Text type="secondary">Nenhuma consulta registrada.</Text>
                      ) : (
                        appointments.map((appt) => (
                          <div key={appt.id} style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                              <div style={{ flex: 1 }}>
                                <Text strong style={{ display: "block", marginBottom: 4 }}>
                                  {appt.title || "Consulta"}
                                </Text>
                                <Text style={{ display: "block", marginBottom: 4 }}>
                                  {dayjs(appt.start_datetime).format("DD/MM/YYYY [às] HH:mm")}
                                </Text>
                                {appt.description && (
                                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                                    {appt.description}
                                  </Text>
                                )}
                              </div>
                              <Text 
                                type={appt.status === "completed" ? "success" : appt.status === "cancelled" ? "danger" : "default"}
                                style={{ fontSize: 12 }}
                              >
                                {appt.status === "scheduled" ? "Agendada" : 
                                 appt.status === "completed" ? "Finalizada" : 
                                 appt.status === "cancelled" ? "Cancelada" : 
                                 appt.status || "Agendada"}
                              </Text>
                            </div>
                            <Button 
                              type="link" 
                              style={{ padding: 0 }}
                              onClick={() => navigate(`/app/appointment`)}
                            >
                              Ver na agenda
                            </Button>
                            {appt !== appointments[appointments.length - 1] && <Divider style={{ margin: "12px 0 0 0" }} />}
                          </div>
                        ))
                      )}
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                  <Col xs={24} sm={24} md={12}>
                    <Card title="Dados do Responsável">
                      {patient?.responsible_name ? (
                        <>
                          <p><Text strong>Nome:</Text> {patient?.responsible_name}</p>
                          <p><Text strong>CPF:</Text> {formatCPF(patient?.responsible_cpf)}</p>
                          <p><Text strong>Telefone:</Text> {formatPhone(patient?.responsible_phone)}</p>
                          {patient?.responsible_email && (
                            <p><Text strong>E-mail:</Text> {patient?.responsible_email}</p>
                          )}
                          {patient?.responsible_relationship && (
                            <p><Text strong>Grau de Parentesco:</Text> {patient?.responsible_relationship}</p>
                          )}
                        </>
                      ) : (
                        <Text type="secondary">Nenhum responsável cadastrado.</Text>
                      )}
                    </Card>
                  </Col>

                  <Col xs={24} sm={24} md={12}>
                    <Card title="Plano de Saúde">
                      {patient?.plan_card_number || patient?.plan_holder ? (
                        <>
                          {patient?.plan_card_number && (
                            <p><Text strong>Número da Carteirinha:</Text> {patient?.plan_card_number}</p>
                          )}
                          {patient?.plan_holder && (
                            <p><Text strong>Titular do Plano:</Text> {patient?.plan_holder}</p>
                          )}
                          {patient?.plan_document && (
                            <p><Text strong>Documento do Titular:</Text> {patient?.plan_document}</p>
                          )}
                          {patient?.observations && (
                            <div style={{ marginTop: 8 }}>
                              <Text strong>Observações:</Text>
                              <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{patient?.observations}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <Text type="secondary">Nenhuma informação de plano cadastrada.</Text>
                      )}
                    </Card>
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: "form",
            label: "Anamnese",
            children: (
              <div>
                <Card style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Text strong>Selecione o formulário:</Text>
                    <Select
                      value={selectedFormId}
                      onChange={setSelectedFormId}
                      style={{ width: "100%", maxWidth: 400 }}
                      loading={loadingForms}
                      placeholder="Selecione um formulário"
                    >
                      {forms.map((form) => (
                        <Option key={form.id_form} value={form.id_form}>
                          {form.name || `Formulário ${form.id_form}`}
                        </Option>
                      ))}
                    </Select>
                  </Space>
                </Card>
                <PatientForm patientId={id} formId={selectedFormId} key={selectedFormId} />
              </div>
            ),
          },
          {
            key: "incomes",
            label: "Débitos",
            children: (
              <div>
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Title level={4} style={{ margin: 0 }}>Débitos do Paciente</Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingIncome(null);
                      setHasInstallments(false);
                      setIsEditingInstallment(false);
                      incomeForm.resetFields();
                      incomeForm.setFieldsValue({ patientId: id });
                      setIsIncomeModalOpen(true);
                    }}
                  >
                    Novo Débito
                  </Button>
                </div>
                <Table
                  columns={incomeColumns}
                  dataSource={incomes}
                  loading={loadingIncomes}
                  pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
                  rowKey="id"
                  scroll={{ x: true }}
                  showHeader={incomes.length > 0}
                  locale={{ emptyText: "Nenhum débito registrado" }}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="Editar Paciente"
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        width="90%"
        style={{ maxWidth: 700 }}
        styles={{
          body: {
            maxHeight: "600px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>
            Cancelar
          </Button>,
          <Button key="ok" type="primary" onClick={handleUpdate}>
            Salvar
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Dados Pessoais",
                children: (
                  <>
                    <Form.Item
                      name="full_name"
                      label="Nome completo"
                      rules={[{ required: true, message: "Informe o nome completo!" }]}
                    >
                      <Input placeholder="Nome completo" maxLength={200}/>
                    </Form.Item>

                    <Form.Item 
                      name="gender" 
                      label="Gênero"
                      rules={[ { required: true, message: "Por favor, insira o gênero" }]}
                    >
                      <Select placeholder="Selecione o gênero">
                        <Option value="Masculino">Masculino</Option>
                        <Option value="Feminino">Feminino</Option>
                      </Select>
                    </Form.Item>

                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item
                        name="cpf"
                        label="CPF"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[
                          { required: true, message: "Informe o CPF!" },
                          { pattern: /^[0-9]{10,11}$/, message: "Somente números!" },
                          { min: 11, message: "Informe o CPF corretamente!" }
                        ]}
                      >
                        <Input placeholder="CPF (apenas números)" maxLength={11}/>
                      </Form.Item>

                      <Form.Item
                        name="rg"
                        label="RG"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[
                          { pattern: /^[0-9]*$/, message: "Somente números!" },
                          { 
                            validator: (_, value) => {
                              if (!value || value.length <= 11) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error("RG deve ter no máximo 11 dígitos!"));
                            }
                          }
                        ]}
                      >
                        <Input placeholder="RG (opcional, até 11 dígitos)" maxLength={11}/>
                      </Form.Item>
                    </div>

                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item
                        name="phone"
                        label="Telefone"
                        style={{ flex: 1 }}
                        rules={[
                          { required: true, message: "Por favor, insira o número de telefone!" },
                          { pattern: /^[0-9]{10,11}$/, message: "Digite um número válido (somente números)." },
                          { min: 11, message: "Digite um número válido." },
                        ]}
                        className="form-item-responsive"
                      >
                        <Input
                          placeholder="Telefone (Whatsapp)"
                          maxLength={11}
                        />
                      </Form.Item>

                      <Form.Item
                        name="birth_date"
                        label="Data de nascimento"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[ { required: true, message: "Por favor, insira a data de nascimento!" }]}
                      >
                        <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                      </Form.Item>
                    </div>

                    <Divider orientation="left" style={{ marginTop: 16, marginBottom: 16 }}>
                      <Text strong>Dados do Responsável (Opcional)</Text>
                    </Divider>

                    <Form.Item
                      name="responsible_name"
                      label="Nome do Responsável"
                    >
                      <Input placeholder="Nome completo do responsável" maxLength={200} />
                    </Form.Item>

                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item
                        name="responsible_cpf"
                        label="CPF do Responsável"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[
                          { pattern: /^[0-9]{0,11}$/, message: "Somente números!" },
                          { 
                            validator: (_, value) => {
                              if (!value || value.length === 0 || value.length === 11) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error("CPF deve ter 11 dígitos!"));
                            }
                          }
                        ]}
                      >
                        <Input placeholder="CPF (apenas números)" maxLength={11} />
                      </Form.Item>

                      <Form.Item
                        name="responsible_phone"
                        label="Telefone do Responsável"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[
                          { pattern: /^[0-9]{0,11}$/, message: "Digite um número válido (somente números)." },
                          { 
                            validator: (_, value) => {
                              if (!value || value.length === 0 || value.length >= 10) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error("Digite um número válido."));
                            }
                          }
                        ]}
                      >
                        <Input placeholder="Telefone (Whatsapp)" maxLength={11} />
                      </Form.Item>
                    </div>

                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item
                        name="responsible_email"
                        label="E-mail do Responsável"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                        rules={[
                          { type: "email", message: "Digite um e-mail válido!" }
                        ]}
                      >
                        <Input placeholder="E-mail do responsável" maxLength={255} />
                      </Form.Item>

                      <Form.Item
                        name="responsible_relationship"
                        label="Grau de Parentesco"
                        style={{ flex: 1 }}
                        className="form-item-responsive"
                      >
                        <Select placeholder="Selecione o grau de parentesco">
                          <Option value="Pai">Pai</Option>
                          <Option value="Mãe">Mãe</Option>
                          <Option value="Avô">Avô</Option>
                          <Option value="Avó">Avó</Option>
                          <Option value="Tio">Tio</Option>
                          <Option value="Tia">Tia</Option>
                          <Option value="Tutor">Tutor</Option>
                          <Option value="Outro">Outro</Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </>
                ),
              },
              {
                key: "2",
                label: "Endereço",
                children: (
                  <>
                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item 
                        name="zip_code" 
                        label="CEP" 
                        rules={[
                          { min: 8, message: "Digite um CEP válido."}
                        ]}
                        style={{ flex: "0.7" }}
                        className="form-item-responsive"
                      >
                        <Input 
                          placeholder="CEP" 
                          maxLength={8}
                          onBlur={handleCEPBlur}
                        />
                      </Form.Item>
                      <Form.Item name="street" label="Endereço" style={{ flex: 2 }} className="form-item-responsive">
                        <Input placeholder="Rua / Avenida" />
                      </Form.Item>
                    </div>

                    <Form.Item name="complement" label="Complemento" className="form-item-responsive">
                      <Input placeholder="Apartamento, bloco, sala, etc." maxLength={255}/>
                    </Form.Item>

                    <div className="form-row" style={{ display: "flex", gap: 12 }}>
                      <Form.Item name="neighborhood" label="Bairro" style={{ flex: 1 }} className="form-item-responsive">
                        <Input placeholder="Bairro" maxLength={200}/>
                      </Form.Item>

                      <Form.Item name="city" label="Cidade" style={{ flex: 1 }} className="form-item-responsive">
                        <Input placeholder="Cidade" maxLength={200}/>
                      </Form.Item>

                      <Form.Item name="state" label="UF" style={{ flex: "0.5" }} className="form-item-responsive">
                        <Select placeholder="UF">
                          {[
                            "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
                            "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
                            "RS","RO","RR","SC","SP","SE","TO",
                          ].map((uf) => (
                            <Option key={uf} value={uf}>
                              {uf}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </>
                ),
              },
              {
                key: "3",
                label: "Plano",
                children: (
                  <>
                    <Form.Item
                      name="plan_card_number"
                      label="Número da Carteirinha"
                    >
                      <Input placeholder="Número da carteirinha do plano" maxLength={50} />
                    </Form.Item>

                    <Form.Item
                      name="plan_holder"
                      label="Titular do Plano"
                    >
                      <Input placeholder="Nome do titular do plano" maxLength={255} />
                    </Form.Item>

                    <Form.Item
                      name="plan_document"
                      label="Documento do Titular"
                    >
                      <Input placeholder="CPF ou CNPJ do titular" maxLength={20} />
                    </Form.Item>

                    <Form.Item
                      name="observations"
                      label="Observações"
                    >
                      <TextArea
                        rows={4}
                        placeholder="Detalhes sobre o tipo de tratamento que este cliente estará aceito. Ex: Tratamento ortodôntico, implantes, etc."
                        maxLength={1000}
                        showCount
                      />
                    </Form.Item>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Modal de confirmação de exclusão */}
      <Modal
        title="Confirmar exclusão"
        open={isDeleteConfirmOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <Text>
          Tem certeza que deseja excluir o paciente <strong>{patient?.full_name}</strong>?
        </Text>
      </Modal>

      {/* Modal de Confirmação de Exclusão de Débito */}
      <Modal
        title="Confirmar Exclusão"
        open={deleteIncomeConfirm.open}
        onOk={handleDeleteIncome}
        onCancel={() => setDeleteIncomeConfirm({ 
          open: false, 
          id: null, 
          title: null,
          isInstallment: false,
          deleteOption: "all"
        })}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={loadingIncomes}
      >
        <div>
          <p style={{ marginBottom: 16 }}>
            Tem certeza que deseja excluir o débito <strong>{deleteIncomeConfirm.title}</strong>?
          </p>
          
          {deleteIncomeConfirm.isInstallment && (
            <div>
              <p style={{ marginBottom: 12, fontWeight: 500 }}>O que você deseja excluir?</p>
              <Radio.Group
                value={deleteIncomeConfirm.deleteOption}
                onChange={(e) => setDeleteIncomeConfirm({ ...deleteIncomeConfirm, deleteOption: e.target.value })}
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
                      Remove todas as parcelas deste débito
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Novo/Editar Débito */}
      <Modal
        title={editingIncome ? (isEditingInstallment ? "Editar Débito Parcelado" : "Editar Débito") : "Novo Débito"}
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
            <Input placeholder="Título do débito" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <TextArea rows={3} placeholder="Descrição do débito" />
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
                <strong>Nota:</strong> Ao editar um débito parcelado, você pode alterar apenas o título, descrição, tipo de pagamento e paciente. 
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
    </div>
  );
}

// Helpers
function formatCPF(cpf) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return cpf;
}

function formatPhone(phone) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
}

const formatBirthDate = (dateString) => {
  if (!dateString) return "-";
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
};