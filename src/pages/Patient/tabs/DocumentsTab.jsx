import { useState, useEffect } from "react";
import { Card, Typography, Row, Col, Spin } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  MedicineBoxOutlined,
  FileDoneOutlined,
  EditOutlined,
} from "@ant-design/icons";
import api from "../../../services/api";
import { DOCUMENT_TYPES } from "../../../utils/documentTemplates";
import DocumentEditor from "../../../components/DocumentEditor/DocumentEditor";
import "./DocumentsTab.css";

const { Title } = Typography;

const documentOptions = [
  {
    type: DOCUMENT_TYPES.CONTRACT,
    title: "Contrato",
    icon: <FileTextOutlined style={{ fontSize: 48 }} />,
    color: "#1890ff",
  },
  {
    type: DOCUMENT_TYPES.CONSENT,
    title: "Termo de Consentimento",
    icon: <CheckCircleOutlined style={{ fontSize: 48 }} />,
    color: "#52c41a",
  },
  {
    type: DOCUMENT_TYPES.PRESCRIPTION,
    title: "Receituário",
    icon: <MedicineBoxOutlined style={{ fontSize: 48 }} />,
    color: "#fa8c16",
  },
  {
    type: DOCUMENT_TYPES.CERTIFICATE,
    title: "Atestado",
    icon: <FileDoneOutlined style={{ fontSize: 48 }} />,
    color: "#722ed1",
  },
  {
    type: DOCUMENT_TYPES.CUSTOM,
    title: "Personalizado",
    icon: <EditOutlined style={{ fontSize: 48 }} />,
    color: "#8c8c8c",
  },
];

export default function DocumentsTab({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const response = await api.get(`/patients/${patientId}`);
        setPatient(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados do paciente:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleDocumentSelect = (type) => {
    setSelectedDocumentType(type);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setSelectedDocumentType(null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="documents-tab-container">
      <Title level={4} style={{ marginBottom: 24 }}>
        Selecione o tipo de documento
      </Title>

      <Row gutter={[16, 16]}>
        {documentOptions.map((option) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={option.type}>
            <Card
              hoverable
              className="document-type-card"
              onClick={() => handleDocumentSelect(option.type)}
              style={{
                textAlign: "center",
                cursor: "pointer",
                height: "100%",
              }}
            >
              <div
                style={{
                  color: option.color,
                  marginBottom: 16,
                }}
              >
                {option.icon}
              </div>
              <Title level={5} style={{ margin: 0 }}>
                {option.title}
              </Title>
            </Card>
          </Col>
        ))}
      </Row>

      {isEditorOpen && selectedDocumentType && (
        <DocumentEditor
          documentType={selectedDocumentType}
          patient={patient}
          open={isEditorOpen}
          onClose={handleEditorClose}
        />
      )}
    </div>
  );
}
