import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  message,
  Form,
  Modal,
  Input,
  Typography,
  DatePicker,
  Select,
} from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "./Styles.css";

const { Title } = Typography;
const { Option } = Select;

export default function Patients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchPatients = async (searchValue = "") => {
    try {
      setLoading(true);
      const res = await api.get("/patients", {
        params: searchValue ? { search: searchValue } : {},
      });

      console.log(res.data)
      const formatted = res.data.map((p) => ({
        key: p.id,
        full_name: p.full_name,
        cpf: p.cpf,
        phone: p.phone,
        gender: p.gender,
        neighborhood: p.neighborhood,
        age: p.age + " anos"
      }));

      setPatients(formatted);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar pacientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        birth_date: values.birth_date
          ? values.birth_date.format("YYYY-MM-DD")
          : null,
      };

      await api.post("/patients", payload);
      messageApi.success("Paciente criado com sucesso!");
      setIsModalOpen(false);
      fetchPatients();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao criar paciente.");
    }
  };

  const columns = [
    {
      title: "Nome completo",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Idade",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Bairro",
      dataIndex: "neighborhood",
      key: "neighborhood",
    },
    {
      title: "CPF",
      dataIndex: "cpf",
      key: "cpf",
      render: (cpf) => {
        if (!cpf) return "-";
        const digits = cpf.replace(/\D/g, "");

        if (digits.length === 11) {
          return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
        }

        return cpf;
      },
    },
    {
      title: "Telefone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      key: "action",
      align: "end",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/patients/${record.key}`)}
          >
            Ver mais
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}

      <Modal
        title="Adicionar Paciente"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        okText="Adicionar"
        cancelText="Cancelar"
        width={700}
        styles={{
          body: {
            maxHeight: "250px",
            overflowY: "auto",
            paddingRight: 12,
          },
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="full_name"
            label="Nome completo"
            rules={[{ required: true, message: "Informe o nome completo!" }]}
          >
            <Input placeholder="Nome completo" />
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
            <Form.Item name="zip_code" label="CEP" style={{ flex: "0.7" }}>
              <Input placeholder="CEP" />
            </Form.Item>
            <Form.Item name="street" label="Endereço" style={{ flex: 2 }}>
              <Input placeholder="Rua / Avenida" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item name="neighborhood" label="Bairro" style={{ flex: 1 }}>
              <Input placeholder="Bairro" />
            </Form.Item>

            <Form.Item name="city" label="Cidade" style={{ flex: 1 }}>
              <Input placeholder="Cidade" />
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

      <div style={{ marginBottom: 20 }}>
        <Title level={3}>Pacientes</Title>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Input.Search
            placeholder="Buscar por nome ou CPF..."
            allowClear
            enterButton="Buscar"
            onSearch={(value) => fetchPatients(value)}
            style={{ width: 300 }}
          />

          <Button
            type="primary"
            onClick={() => {
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            + Adicionar Paciente
          </Button>
        </div>
      </div>

      <Table
        dataSource={patients}
        columns={columns}
        loading={loading}
        pagination={false}
      />
    </div>
  );
}
