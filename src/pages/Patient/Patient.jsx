import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Typography,
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
  Divider,
} from "antd";
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import { fetchAddressByCEP } from "../../utils/cep";
import InfoTab from "./tabs/InfoTab";
import AnamnesisTab from "./tabs/AnamnesisTab";
import IncomesTab from "./tabs/IncomesTab";
import ImagesTab from "./tabs/ImagesTab";
import DocumentsTab from "./tabs/DocumentsTab";
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
            children: <InfoTab patient={patient} appointments={appointments} />,
          },
          {
            key: "form",
            label: "Anamnese",
            children: <AnamnesisTab patientId={id} />,
          },
          {
            key: "incomes",
            label: "Débitos",
            children: <IncomesTab patientId={id} />,
          },
          {
            key: "images",
            label: "Anexos",
            children: <ImagesTab patientId={id} />,
          },
          {
            key: "documents",
            label: "Documentos",
            children: <DocumentsTab patientId={id} />,
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

    </div>
  );
}
