import { useState } from "react";
import { Card, Button, Space, Typography, Divider } from "antd";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import AnamnesisDocument from "../../components/AnamnesisPDF/AnamnesisDocument";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function TestPDF() {
  // Dados falsos para teste
  const mockPatient = {
    id: 1,
    full_name: "João Silva Santos",
    cpf: "12345678901",
    rg: "123456789",
    birth_date: "1990-05-15",
    age: 34,
    gender: "Masculino",
    phone: "11987654321",
    zip_code: "01234567",
    street: "Rua das Flores, 123",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    responsible_name: "Maria Silva Santos",
    responsible_cpf: "98765432100",
    responsible_phone: "11912345678",
    responsible_email: "maria.silva@email.com",
    responsible_relationship: "Mãe",
    plan_card_number: "123456789012",
    plan_holder: "João Silva Santos",
    plan_document: "12345678901",
  };

  const mockFormData = {
    id_form: 1,
    name: "Anamnese Clínica",
    description: "Formulário de avaliação inicial do paciente",
    type: "anamnese",
    questions: [
      {
        id_question: 1,
        question: "Você possui alguma alergia?",
        answer_type: "yes_no",
        required: true,
        has_comment: true,
        order: 1,
        is_alert: true,
      },
      {
        id_question: 2,
        question: "Você faz uso de medicamentos contínuos?",
        answer_type: "yes_no_unknown",
        required: true,
        has_comment: true,
        order: 2,
        is_alert: false,
      },
      {
        id_question: 3,
        question: "Descreva seu histórico médico",
        answer_type: "textarea",
        required: false,
        has_comment: false,
        order: 3,
        is_alert: false,
      },
      {
        id_question: 4,
        question: "Data da última consulta odontológica",
        answer_type: "date",
        required: false,
        has_comment: false,
        order: 4,
        is_alert: false,
      },
      {
        id_question: 5,
        question: "Quantos dentes você tem?",
        answer_type: "number",
        required: false,
        has_comment: false,
        order: 5,
        is_alert: false,
      },
      {
        id_question: 6,
        question: "Você fuma?",
        answer_type: "yes_no",
        required: true,
        has_comment: false,
        order: 6,
        is_alert: true,
      },
      {
        id_question: 7,
        question: "Nome do seu dentista anterior",
        answer_type: "text",
        required: false,
        has_comment: false,
        order: 7,
        is_alert: false,
      },
    ],
  };

  const mockAnswers = {
    1: {
      answer: "Sim",
      comment: "Alergia a penicilina e látex",
    },
    2: {
      answer: "Sim",
      comment: "Uso diário de anti-hipertensivo",
    },
    3: {
      answer: "Hipertensão arterial controlada, diabetes tipo 2",
      comment: null,
    },
    4: {
      answer: "2023-12-15",
      comment: null,
    },
    5: {
      answer: "28",
      comment: null,
    },
    6: {
      answer: "Não",
      comment: null,
    },
    7: {
      answer: "Dr. Carlos Mendes",
      comment: null,
    },
  };

  const [viewMode, setViewMode] = useState("viewer"); // "viewer" ou "download"

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3}>Teste do PDF - Anamnese</Title>
            <Text type="secondary">
              Esta página permite visualizar e testar o componente AnamnesisDocument com dados falsos.
            </Text>
          </div>

          <Divider />

          <Space>
            <Button
              type={viewMode === "viewer" ? "primary" : "default"}
              icon={<EyeOutlined />}
              onClick={() => setViewMode("viewer")}
            >
              Visualizar PDF
            </Button>
            <Button
              type={viewMode === "download" ? "primary" : "default"}
              icon={<DownloadOutlined />}
              onClick={() => setViewMode("download")}
            >
              Baixar PDF
            </Button>
          </Space>

          {viewMode === "viewer" && (
            <div style={{ border: "1px solid #d9d9d9", borderRadius: 4, overflow: "hidden" }}>
              <PDFViewer width="100%" height="800px">
                <AnamnesisDocument
                  patient={mockPatient}
                  formData={mockFormData}
                  answers={mockAnswers}
                />
              </PDFViewer>
            </div>
          )}

          {viewMode === "download" && (
            <div style={{ textAlign: "center", padding: 40 }}>
              <PDFDownloadLink
                document={
                  <AnamnesisDocument
                    patient={mockPatient}
                    formData={mockFormData}
                    answers={mockAnswers}
                  />
                }
                fileName={`Anamnese_Teste_${dayjs().format("YYYY-MM-DD")}.pdf`}
                style={{
                  textDecoration: "none",
                }}
              >
                {({ blob, url, loading, error }) => (
                  <Button
                    type="primary"
                    size="large"
                    icon={<DownloadOutlined />}
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? "Gerando PDF..." : "Baixar PDF de Teste"}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          )}

          <Divider />

          <Card size="small" title="Dados de Teste Utilizados">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>Paciente: </Text>
                <Text>{mockPatient.full_name}</Text>
              </div>
              <div>
                <Text strong>Formulário: </Text>
                <Text>{mockFormData.name}</Text>
              </div>
              <div>
                <Text strong>Total de Questões: </Text>
                <Text>{mockFormData.questions.length}</Text>
              </div>
              <div>
                <Text strong>Respostas Preenchidas: </Text>
                <Text>{Object.keys(mockAnswers).length}</Text>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
}
