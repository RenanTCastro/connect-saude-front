import { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  Space,
  AutoComplete,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createProcedure, createTreatment, updateTreatment } from "../../services/treatmentService";

const { Text } = Typography;

const FDI_PERMANENT = [
  ...Array.from({ length: 8 }, (_, i) => String(11 + i)),
  ...Array.from({ length: 8 }, (_, i) => String(21 + i)),
  ...Array.from({ length: 8 }, (_, i) => String(31 + i)),
  ...Array.from({ length: 8 }, (_, i) => String(41 + i)),
];
const FDI_DECIDUOUS = [
  ...Array.from({ length: 5 }, (_, i) => String(51 + i)),
  ...Array.from({ length: 5 }, (_, i) => String(61 + i)),
  ...Array.from({ length: 5 }, (_, i) => String(71 + i)),
  ...Array.from({ length: 5 }, (_, i) => String(81 + i)),
];
const REGIONS = [
  { value: "Maxila", label: "Maxila" },
  { value: "Mandíbula", label: "Mandíbula" },
  { value: "Face", label: "Face" },
  { value: "Arcadas", label: "Arcadas" },
  { value: "Arcada superior", label: "Arcada superior" },
  { value: "Arcada inferior", label: "Arcada inferior" },
];

export default function TreatmentFormModal({
  open,
  onCancel,
  onSuccess,
  patientId,
  initialValues = null,
  allProcedures = [],
  loadingProcedures = false,
  messageApi,
}) {
  const [form] = Form.useForm();
  const [procedureSearchValue, setProcedureSearchValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(initialValues?.id);

  const procedureOptions = useMemo(() => {
    const term = (procedureSearchValue ?? "").trim().toLowerCase();
    if (term.length < 3) return [];
    const list = allProcedures.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.tuss_code && p.tuss_code.toLowerCase().includes(term))
    );
    return list.map((p) => ({
      value: p.id,
      label: p.tuss_code ? `${p.name} (${p.tuss_code})` : p.name,
      procedure: p,
    }));
  }, [allProcedures, procedureSearchValue]);

  const procedureAutocompleteOptions = useMemo(() => {
    const trimmed = procedureSearchValue?.trim() || "";
    const showCreate =
      trimmed.length >= 3 &&
      procedureOptions.every((o) => o.procedure?.name?.toLowerCase() !== trimmed.toLowerCase());
    return [
      ...procedureOptions.map((o) => ({ value: String(o.value), label: o.label })),
      ...(showCreate ? [{ value: "__create__", label: `Criar procedimento personalizado: "${trimmed}"` }] : []),
    ];
  }, [procedureOptions, procedureSearchValue]);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          plan_type: initialValues.plan_type || "particular",
          target_type: initialValues.target_type || "dente",
          tooth_fdi: initialValues.target_type === "dente" ? initialValues.tooth_fdi : null,
          region_name: initialValues.target_type === "regiao" ? initialValues.region_name : null,
          value: initialValues.value ?? null,
        });
        setProcedureSearchValue(initialValues.procedure_name || "");
        const found = allProcedures.find((p) => String(p.id) === String(initialValues.procedure_id));
        setSelectedProcedure(found || (initialValues.procedure_id ? { id: initialValues.procedure_id, name: initialValues.procedure_name || "" } : null));
      } else {
        form.resetFields();
        setProcedureSearchValue("");
        setSelectedProcedure(null);
      }
    }
  }, [open, initialValues, form, allProcedures]);

  const handleCreateCustomProcedure = async () => {
    const name = procedureSearchValue?.trim();
    if (!name) {
      messageApi?.warning("Digite o nome do procedimento.");
      return;
    }
    setCreatingProcedure(true);
    try {
      const created = await createProcedure({ name, is_custom: true });
      setSelectedProcedure(created);
      setProcedureSearchValue(created.name);
      messageApi?.success("Procedimento personalizado criado.");
    } catch (e) {
      messageApi?.error("Erro ao criar procedimento.");
    } finally {
      setCreatingProcedure(false);
    }
  };

  const handleFinish = async (values) => {
    if (!patientId) return;
    if (!selectedProcedure && !procedureSearchValue?.trim()) {
      messageApi?.warning("Informe ou busque um procedimento.");
      return;
    }

    setSubmitting(true);
    try {
      const targetType = values.target_type;
      const payload = {
        plan_type: values.plan_type,
        target_type: targetType,
        tooth_fdi: targetType === "dente" ? values.tooth_fdi : null,
        region_name: targetType === "regiao" ? values.region_name : null,
        value: values.value ?? null,
      };
      if (selectedProcedure) {
        payload.procedure_id = selectedProcedure.id;
        payload.procedure_name = selectedProcedure.name;
      } else {
        payload.procedure_name = procedureSearchValue.trim();
      }

      if (isEdit) {
        payload.status = initialValues.status;
        await updateTreatment(initialValues.id, payload);
        messageApi?.success("Tratamento atualizado.");
      } else {
        payload.status = "planejado";
        await createTreatment(patientId, payload);
        messageApi?.success("Tratamento adicionado.");
      }
      onSuccess?.();
      onCancel?.();
    } catch (e) {
      messageApi?.error(e.response?.data?.error || (isEdit ? "Erro ao atualizar tratamento." : "Erro ao adicionar tratamento."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setProcedureSearchValue("");
    setSelectedProcedure(null);
    onCancel?.();
  };

  return (
    <Modal
      open={open}
      title={isEdit ? "Editar tratamento" : "Adicionar tratamento"}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={720}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ plan_type: "particular", target_type: "dente" }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="plan_type" label="Plano / Particular" rules={[{ required: true }]}>
              <Select options={[{ value: "plano", label: "Plano" }, { value: "particular", label: "Particular" }]} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="target_type" label="Dente / Região" rules={[{ required: true }]}>
              <Select options={[{ value: "dente", label: "Dente" }, { value: "regiao", label: "Região" }]} />
            </Form.Item>
          </Col>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.target_type !== curr.target_type}>
            {({ getFieldValue }) =>
              getFieldValue("target_type") === "dente" ? (
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="tooth_fdi" label="Dente (FDI)" rules={[{ required: true }]}>
                    <Select
                      showSearch
                      placeholder="Selecione o dente"
                      optionFilterProp="label"
                      options={[
                        { label: "Permanente", options: FDI_PERMANENT.map((n) => ({ value: n, label: n })) },
                        { label: "Decíduo", options: FDI_DECIDUOUS.map((n) => ({ value: n, label: n })) },
                      ]}
                    />
                  </Form.Item>
                </Col>
              ) : (
                <Col xs={24} sm={12} md={6}>
                  <Form.Item name="region_name" label="Região" rules={[{ required: true }]}>
                    <Select options={REGIONS} placeholder="Maxila, Mandíbula, Face, Arcadas..." />
                  </Form.Item>
                </Col>
              )
            }
          </Form.Item>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="value" label="Valor">
              <InputNumber
                min={0}
                max={999999.99}
                step={0.01}
                style={{ width: "100%" }}
                prefix="R$"
                placeholder="0,00"
                decimalSeparator=","
                thousandSeparator="."
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24}>
            <div style={{ display: "flex", gap: 16, width: "100%", alignItems: "flex-start", flexWrap: "wrap" }}>
              <Form.Item label="Procedimento" required style={{ flex: "1 1 200px", marginBottom: 0, minWidth: 0 }}>
                <Space.Compact style={{ width: "100%" }}>
                  <AutoComplete
                    value={procedureSearchValue}
                    options={procedureAutocompleteOptions}
                    onSearch={(v) => setProcedureSearchValue(v ?? "")}
                    onSelect={(v) => {
                      if (v === "__create__") {
                        handleCreateCustomProcedure();
                        return;
                      }
                      const opt = procedureOptions.find((o) => String(o.value) === v);
                      if (opt?.procedure) setSelectedProcedure(opt.procedure);
                    }}
                    placeholder="Buscar por nome ou código TUSS (mín. 3 caracteres)"
                    style={{ width: "100%" }}
                    maxLength={100}
                    filterOption={false}
                    notFoundContent={loadingProcedures ? "Carregando..." : null}
                  />
                  {procedureSearchValue?.trim() && (
                    <Button type="default" onClick={handleCreateCustomProcedure} loading={creatingProcedure}>
                      + Criar
                    </Button>
                  )}
                </Space.Compact>
                {selectedProcedure && (
                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                    Selecionado: {selectedProcedure.name}
                    {selectedProcedure.tuss_code ? ` (${selectedProcedure.tuss_code})` : ""}
                  </Text>
                )}
              </Form.Item>
            </div>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col xs={24}>
            <Space>
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={submitting}>
                {isEdit ? "Salvar alterações" : "Adicionar tratamento"}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
