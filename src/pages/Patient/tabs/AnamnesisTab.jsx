import { useEffect, useState } from "react";
import { Card, Typography, Space, Select, message } from "antd";
import api from "../../../services/api";
import PatientForm from "../../../components/PatientForm/PatientForm";

const { Text } = Typography;
const { Option } = Select;

export default function AnamnesisTab({ patientId }) {
  const [selectedFormId, setSelectedFormId] = useState(1);
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchForms();
  }, []);

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

  return (
    <div>
      {contextHolder}
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
      <PatientForm patientId={patientId} formId={selectedFormId} key={selectedFormId} />
    </div>
  );
}
