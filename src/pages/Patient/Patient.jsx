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
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
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

      // Dados fake de consultas
      setAppointments([
        {
          id: 1,
          date: "2025-07-30T18:00:00Z",
          status: "Finalizada",
          professional_name: "Isadora Luísa",
        },
        {
          id: 2,
          date: "2025-08-12T10:00:00Z",
          status: "Agendada",
          professional_name: "Dra. Marina Alves",
        },
      ]);
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
      messageApi.error("Erro ao atualizar paciente.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/patients/${id}`);
      messageApi.success("Paciente excluído com sucesso!");
      navigate("/patient");
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao excluir paciente.");
    }
  };

  if (loading) return <Spin style={{ display: "block", margin: "80px auto" }} />;

  return (
    <div style={{ padding: 24 }}>
      {contextHolder}

      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/patient")}
        style={{ marginBottom: 8 }}
      >
        Voltar
      </Button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={3}>Paciente</Title>
        <Button type="default" icon={<EditOutlined />} onClick={handleEdit}>
          Editar
        </Button>
      </div>

      <Row gutter={16}>
        <Col span={12}>
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

        <Col span={12}>
          <Card title="Consultas" style={{ maxHeight: 400, overflowY: "auto" }}>
            {appointments.length === 0 ? (
              <Text type="secondary">Nenhuma consulta registrada.</Text>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} style={{ marginBottom: 16 }}>
                  <Text>{dayjs(appt.date).format("DD/MM/YYYY [às] HH:mm")}</Text>
                  <br />
                  <Text strong>{appt.status}</Text>
                  <Button type="link" style={{ paddingLeft: 8 }}>
                    Ver na agenda
                  </Button>
                  <Divider />
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Divider />
      <Card title="Faturas" style={{ marginTop: 12, minHeight: 120 }}>
        <Text type="secondary">Espaço reservado para faturas (em desenvolvimento)</Text>
      </Card>

      <Modal
        title="Editar Paciente"
        open={isEditModalOpen}
        onOk={handleUpdate}
        onCancel={() => setIsEditModalOpen(false)}
        okText="Salvar"
        cancelText="Cancelar"
        width={700}
        styles={{
          body: {
            maxHeight: "250px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
        footer={[
          <Button key="delete" danger icon={<DeleteOutlined />} onClick={() => setIsDeleteConfirmOpen(true)}>
            Excluir
          </Button>,
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

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="cpf"
              label="CPF"
              style={{ flex: 1 }}
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
              rules={[ { required: true, message: "Por favor, insira a data de nascimento!" }]}
            >
              <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item 
                name="zip_code" 
                label="CEP" 
                rules={[
                    { min: 8, message: "Digite um CEP válido."}
                ]}
                style={{ flex: "0.7" }}
            >
              <Input placeholder="CEP" maxLength={8}/>
            </Form.Item>
            <Form.Item name="street" label="Endereço" style={{ flex: 2 }}>
              <Input placeholder="Rua / Avenida" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="neighborhood" label="Bairro" style={{ flex: 1 }}>
              <Input placeholder="Bairro" maxLength={200}/>
            </Form.Item>

            <Form.Item name="city" label="Cidade" style={{ flex: 1 }}>
              <Input placeholder="Cidade" maxLength={200}/>
            </Form.Item>

            <Form.Item name="state" label="UF" style={{ flex: "0.5" }}>
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
