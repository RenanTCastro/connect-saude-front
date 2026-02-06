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
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import "./Styles.css";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);

      // Buscar faturas do paciente
      try {
        const invoicesRes = await api.get(`/patients/${id}/invoices`);
        setInvoices(invoicesRes.data);
      } catch (invoiceErr) {
        console.error("Erro ao carregar faturas:", invoiceErr);
        setInvoices([]);
      }

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

  const handleEdit = () => {
    form.setFieldsValue({
      ...patient,
      birth_date: patient?.birth_date ? dayjs(patient.birth_date) : null,
    });
    setIsEditModalOpen(true);
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

      <Row gutter={16}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Dados pessoais">
            <p><Text strong>Código do paciente:</Text> {patient?.id}</p>
            <p><Text strong>Nome:</Text> {patient?.full_name}</p>
            <p><Text strong>Número do paciente:</Text> {patient?.patient_number}</p>
            <p><Text strong>CPF:</Text> {formatCPF(patient?.cpf)}</p>
            <p><Text strong>Data de nascimento:</Text> {dayjs(patient?.birth_date).format("DD/MM/YYYY")}</p>
            <p><Text strong>Idade:</Text> {patient?.age} anos</p>
            <p><Text strong>Sexo:</Text> {patient?.gender}</p>
            <p><Text strong>Celular:</Text> {formatPhone(patient?.phone)}</p>
            <p><Text strong>CEP:</Text> {patient?.zip_code || "-"}</p>
            <p><Text strong>Endereço:</Text> {patient?.street}</p>
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

      <Divider />
      <Card title="Faturas" style={{ marginTop: 12, minHeight: 120 }}>
        {invoices.length === 0 ? (
          <Text type="secondary">Nenhuma fatura registrada.</Text>
        ) : (
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {invoices.map((invoice) => (
              <div key={invoice.id} style={{ marginBottom: 16, padding: 12, border: "1px solid #f0f0f0", borderRadius: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ display: "block", marginBottom: 4 }}>{invoice.title}</Text>
                    {invoice.description && (
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                        {invoice.description}
                      </Text>
                    )}
                    {invoice.installment.total > 1 && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Parcela {invoice.installment.current} de {invoice.installment.total}
                      </Text>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Text strong style={{ fontSize: 16, color: invoice.isPaid ? "#52c41a" : "#ff4d4f", display: "block" }}>
                      R$ {invoice.amount.toFixed(2).replace(".", ",")}
                    </Text>
                    <Text 
                      type={invoice.isPaid ? "success" : "danger"} 
                      style={{ fontSize: 12, display: "block", marginTop: 4 }}
                    >
                      {invoice.isPaid ? "Paga" : "Pendente"}
                    </Text>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8c8c8c" }}>
                  <Text>
                    <Text strong>Vencimento:</Text> {dayjs(invoice.dueDate).format("DD/MM/YYYY")}
                  </Text>
                  {invoice.paymentDate && (
                    <Text>
                      <Text strong>Pagamento:</Text> {dayjs(invoice.paymentDate).format("DD/MM/YYYY")}
                    </Text>
                  )}
                  {invoice.paymentType && (
                    <Text>
                      <Text strong>Forma:</Text> {invoice.paymentType}
                    </Text>
                  )}
                </div>
                {invoice !== invoices[invoices.length - 1] && <Divider style={{ margin: "12px 0 0 0" }} />}
              </div>
            ))}
          </div>
        )}
      </Card>

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
            maxHeight: "450px",
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
              name="phone"
              label="Telefone"
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
              <Input placeholder="CEP" maxLength={8}/>
            </Form.Item>
            <Form.Item name="street" label="Endereço" style={{ flex: 2 }} className="form-item-responsive">
              <Input placeholder="Rua / Avenida" />
            </Form.Item>
          </div>

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
