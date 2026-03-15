import { useEffect, useState } from "react";
import { Card, Typography, Space, Select, Button, message } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import api from "../../../services/api";
import PatientForm from "../../../components/PatientForm/PatientForm";
import FormManager from "../../../components/FormManager/FormManager";

const { Text } = Typography;
const { Option } = Select;

export default function AnamnesisTab({ patientId }) {
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [forms, setForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoadingForms(true);
      const response = await api.get("/forms");
      setForms(response.data);
      // Se não houver formulário selecionado e houver formulários, selecionar o primeiro
      if (!selectedFormId && response.data.length > 0) {
        setSelectedFormId(response.data[0].id_form);
      }
      // Se o formulário selecionado não estiver na lista, selecionar o primeiro
      else if (selectedFormId && !response.data.find(f => f.id_form === selectedFormId) && response.data.length > 0) {
        setSelectedFormId(response.data[0].id_form);
      }
    } catch (error) {
      console.error("Erro ao buscar formulários:", error);
      messageApi.error("Erro ao carregar formulários.");
    } finally {
      setLoadingForms(false);
    }
  };

  const handleFormSelect = (formId) => {
    setSelectedFormId(formId);
    fetchForms();
  };

  return (
    <div>
      {contextHolder}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong>Selecione o formulário:</Text>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setIsManagerOpen(true)}
            >
              Gerenciar Formulários
            </Button>
          </div>
          <Select
            value={selectedFormId}
            onChange={setSelectedFormId}
            style={{ width: "100%", maxWidth: 400 }}
            loading={loadingForms}
            placeholder="Selecione um formulário"
            notFoundContent={forms.length === 0 ? "Nenhum formulário encontrado. Crie um novo!" : null}
          >
            {forms.map((form) => (
              <Option key={form.id_form} value={form.id_form}>
                {form.name || `Formulário ${form.id_form}`}
              </Option>
            ))}
          </Select>
        </Space>
      </Card>
      {selectedFormId && (
        <PatientForm patientId={patientId} formId={selectedFormId} key={selectedFormId} />
      )}
      {!selectedFormId && forms.length === 0 && (
        <Card>
          <Text type="secondary">
            Nenhum formulário disponível. Clique em "Gerenciar Formulários" para criar um novo.
          </Text>
        </Card>
      )}
      <FormManager
        open={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onFormSelect={handleFormSelect}
      />
    </div>
  );
}
