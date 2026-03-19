import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Modal,
  message,
  Table,
  AutoComplete,
  Space,
  Tag,
  Row,
  Col,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  searchProcedures,
  createProcedure,
  getTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  getOdontogramAnnotations,
  createOdontogramAnnotation,
  updateOdontogramAnnotation,
  deleteOdontogramAnnotation,
} from "../../../services/treatmentService";
import OdontogramGrid from "../../../components/OdontogramGrid/OdontogramGrid";

const { Title, Text } = Typography;
const { Option } = Select;

// FDI: permanente 11-18, 21-28, 31-38, 41-48; decíduo 51-55, 61-65, 71-75, 81-85
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

const STATUS_OPTIONS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export default function TreatmentTab({ patientId }) {
  const [treatmentForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [treatments, setTreatments] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [allProcedures, setAllProcedures] = useState([]);
  const [loadingAllProcedures, setLoadingAllProcedures] = useState(false);
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  const [procedureSearchValue, setProcedureSearchValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  // --- Exclusão de tratamento (modal) ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTreatmentId, setDeletingTreatmentId] = useState(null);
  const [deletingTreatment, setDeletingTreatment] = useState(false);

  // --- Edição de tratamento (modal) ---
  const [editForm] = Form.useForm();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [editProcedureSearchValue, setEditProcedureSearchValue] = useState("");
  const [editSelectedProcedure, setEditSelectedProcedure] = useState(null);
  const [creatingEditProcedure, setCreatingEditProcedure] = useState(false);

  const [annotations, setAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [dentition, setDentition] = useState("permanent");

  const fetchTreatments = useCallback(async () => {
    if (!patientId) return;
    setLoadingTreatments(true);
    try {
      const data = await getTreatments(patientId);
      setTreatments(data);
    } catch (e) {
      messageApi.error("Erro ao carregar tratamentos.");
    } finally {
      setLoadingTreatments(false);
    }
  }, [patientId, messageApi]);

  const fetchAnnotations = useCallback(async () => {
    if (!patientId) return;
    setLoadingAnnotations(true);
    try {
      const data = await getOdontogramAnnotations(patientId);
      setAnnotations(data);
    } catch (e) {
      messageApi.error("Erro ao carregar anotações.");
    } finally {
      setLoadingAnnotations(false);
    }
  }, [patientId, messageApi]);

  useEffect(() => {
    fetchTreatments();
    fetchAnnotations();
  }, [fetchTreatments, fetchAnnotations]);

  const fetchAllProcedures = useCallback(async () => {
    setLoadingAllProcedures(true);
    try {
      const list = await searchProcedures("");
      setAllProcedures(list || []);
    } catch (e) {
      setAllProcedures([]);
      messageApi.error("Erro ao carregar procedimentos.");
    } finally {
      setLoadingAllProcedures(false);
    }
  }, [messageApi]);

  useEffect(() => {
    fetchAllProcedures();
  }, [fetchAllProcedures]);

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

  const onProcedureSearch = useCallback((value) => {
    setProcedureSearchValue(value ?? "");
  }, []);

  const onProcedureSelect = (value, option) => {
    if (option?.procedure) {
      setSelectedProcedure(option.procedure);
    } else {
      setSelectedProcedure(null);
    }
  };

  const handleCreateCustomProcedure = async () => {
    const name = procedureSearchValue?.trim();
    if (!name) {
      messageApi.warning("Digite o nome do procedimento.");
      return;
    }
    setCreatingProcedure(true);
    try {
      const created = await createProcedure({ name, is_custom: true });
      setAllProcedures((prev) => [...prev, created]);
      setSelectedProcedure(created);
      setProcedureSearchValue(created.name);
      messageApi.success("Procedimento personalizado criado.");
    } catch (e) {
      messageApi.error("Erro ao criar procedimento.");
    } finally {
      setCreatingProcedure(false);
    }
  };

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

  // Autocomplete para procedimento no modal de edição
  const editProcedureOptions = useMemo(() => {
    const term = (editProcedureSearchValue ?? "").trim().toLowerCase();
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
  }, [allProcedures, editProcedureSearchValue]);

  const editProcedureAutocompleteOptions = useMemo(() => {
    const trimmed = editProcedureSearchValue?.trim() || "";
    const showCreate =
      trimmed.length >= 3 &&
      editProcedureOptions.every((o) => o.procedure?.name?.toLowerCase() !== trimmed.toLowerCase());
    return [
      ...editProcedureOptions.map((o) => ({ value: String(o.value), label: o.label })),
      ...(showCreate
        ? [{ value: "__create__", label: `Criar procedimento personalizado: "${trimmed}"` }]
        : []),
    ];
  }, [editProcedureOptions, editProcedureSearchValue]);

  const handleCreateCustomProcedureForEdit = async () => {
    const name = editProcedureSearchValue?.trim();
    if (!name) {
      messageApi.warning("Digite o nome do procedimento.");
      return;
    }
    setCreatingEditProcedure(true);
    try {
      const created = await createProcedure({ name, is_custom: true });
      setAllProcedures((prev) => [...prev, created]);
      setEditSelectedProcedure(created);
      setEditProcedureSearchValue(created.name);
      messageApi.success("Procedimento personalizado criado.");
    } catch (e) {
      messageApi.error("Erro ao criar procedimento.");
    } finally {
      setCreatingEditProcedure(false);
    }
  };

  const onTreatmentFinish = async (values) => {
    if (!patientId) return;
    if (!selectedProcedure && !procedureSearchValue?.trim()) {
      messageApi.warning("Informe ou busque um procedimento.");
      return;
    }
    try {
      const targetType = values.target_type;
      const payload = {
        plan_type: values.plan_type,
        target_type: targetType,
        tooth_fdi: targetType === "dente" ? values.tooth_fdi : null,
        region_name: targetType === "regiao" ? values.region_name : null,
        value: values.value ?? null,
        status: "planejado",
      };
      if (selectedProcedure) {
        payload.procedure_id = selectedProcedure.id;
        payload.procedure_name = selectedProcedure.name;
      } else if (procedureSearchValue?.trim()) {
        payload.procedure_name = procedureSearchValue.trim();
      }
      await createTreatment(patientId, payload);
      messageApi.success("Tratamento adicionado.");
      treatmentForm.resetFields();
      setSelectedProcedure(null);
      setProcedureSearchValue("");
      fetchTreatments();
    } catch (e) {
      messageApi.error(e.response?.data?.error || "Erro ao adicionar tratamento.");
    }
  };

  const handleStatusChange = async (treatmentId, status) => {
    try {
      await updateTreatment(treatmentId, { status });
      messageApi.success("Status atualizado.");
      fetchTreatments();
    } catch (e) {
      messageApi.error("Erro ao atualizar status.");
    }
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingTreatment(null);
    setEditSelectedProcedure(null);
    setEditProcedureSearchValue("");
    editForm.resetFields();
  };

  const openEditModal = (treatment) => {
    if (!treatment) return;

    setEditingTreatment(treatment);
    setEditModalOpen(true);

    editForm.setFieldsValue({
      plan_type: treatment.plan_type,
      target_type: treatment.target_type,
      tooth_fdi: treatment.target_type === "dente" ? treatment.tooth_fdi : null,
      region_name: treatment.target_type === "regiao" ? treatment.region_name : null,
      value: treatment.value ?? null,
    });

    setEditProcedureSearchValue(treatment.procedure_name || "");
    if (treatment.procedure_id) {
      const found = allProcedures.find((p) => String(p.id) === String(treatment.procedure_id));
      setEditSelectedProcedure(
        found || { id: treatment.procedure_id, name: treatment.procedure_name || "" }
      );
    } else {
      setEditSelectedProcedure(null);
    }
  };

  const onEditTreatmentFinish = async (values) => {
    if (!patientId) return;
    if (!editingTreatment) return;

    if (!editSelectedProcedure && !editProcedureSearchValue?.trim()) {
      messageApi.warning("Informe ou busque um procedimento.");
      return;
    }

    try {
      const targetType = values.target_type;
      const payload = {
        plan_type: values.plan_type,
        target_type: targetType,
        tooth_fdi: targetType === "dente" ? values.tooth_fdi : null,
        region_name: targetType === "regiao" ? values.region_name : null,
        value: values.value ?? null,
      };

      if (editSelectedProcedure) {
        payload.procedure_id = editSelectedProcedure.id;
        payload.procedure_name = editSelectedProcedure.name;
      } else {
        payload.procedure_id = null;
        payload.procedure_name = editProcedureSearchValue.trim();
      }

      await updateTreatment(editingTreatment.id, payload);
      messageApi.success("Tratamento atualizado.");
      closeEditModal();
      fetchTreatments();
    } catch (e) {
      messageApi.error(e.response?.data?.error || "Erro ao atualizar tratamento.");
    }
  };

  const openDeleteModal = (treatmentId) => {
    setDeletingTreatmentId(treatmentId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingTreatmentId(null);
  };

  const handleDeleteTreatment = async () => {
    if (!deletingTreatmentId) return;
    setDeletingTreatment(true);
    try {
      await deleteTreatment(deletingTreatmentId);
      messageApi.success("Tratamento excluído.");
      closeDeleteModal();
      fetchTreatments();
    } catch (e) {
      messageApi.error(e.response?.data?.error || "Erro ao excluir tratamento.");
    } finally {
      setDeletingTreatment(false);
    }
  };

  const treatmentColumns = [
    { title: "Tipo", dataIndex: "plan_type", key: "plan_type", render: (v) => (v === "plano" ? "Plano" : "Particular") },
    {
      title: "Dente/Região",
      key: "target",
      render: (_, r) => r.target_type === "dente" ? r.tooth_fdi : r.region_name,
    },
    {
      title: "Procedimento",
      key: "procedure",
      render: (_, r) => r.procedure_name || (r.procedure_id ? "—" : "—"),
    },
    { title: "Valor", dataIndex: "value", key: "value", render: (v) => (v != null ? `R$ ${Number(v).toFixed(2)}` : "—") },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          size="small"
          style={{ width: 140 }}
          onChange={(v) => handleStatusChange(record.id, v)}
          options={STATUS_OPTIONS}
        />
      ),
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => openEditModal(record)}>
            Editar
          </Button>
          <Button size="small" danger onClick={() => openDeleteModal(record.id)}>
            Excluir
          </Button>
        </Space>
      ),
    },
  ];

  const getAnnotationFor = (elementKey, elementType) =>
    annotations.find(
      (a) =>
        a.element_key === elementKey &&
        a.element_type === elementType &&
        a.dentition === dentition
    );

  const getSurfaceAnnotationsForTooth = (fdi) => {
    const prefix = `${fdi}-`;
    const surfaceCodes = ["B", "D", "L", "M", "O"];
    const result = {};
    surfaceCodes.forEach((code) => {
      const annot = annotations.find(
        (a) =>
          a.element_type === "tooth_surface" &&
          a.element_key === prefix + code &&
          a.dentition === dentition
      );
      if (annot) result[code] = annot;
    });
    return result;
  };

  const getTreatmentsForTooth = (fdi) =>
    treatments.filter((t) => t.target_type === "dente" && t.tooth_fdi === fdi);
  const getTreatmentsForRegion = (regionName) =>
    treatments.filter((t) => t.target_type === "regiao" && t.region_name === regionName);

  const handleSaveOdontogramAnnotation = async (elementKey, elementType, text, status, existingId) => {
    if (!patientId) return;
    try {
      if (existingId) {
        await updateOdontogramAnnotation(existingId, { annotation_text: text, status });
        messageApi.success("Anotação atualizada.");
      } else {
        await createOdontogramAnnotation(patientId, {
          dentition: dentition,
          element_type: elementType,
          element_key: elementKey,
          annotation_text: text,
          status: status || null,
        });
        messageApi.success("Anotação adicionada.");
      }
      fetchAnnotations();
    } catch (e) {
      messageApi.error("Erro ao salvar anotação.");
    }
  };

  const handleDeleteOdontogramAnnotation = async (annotationId) => {
    try {
      await deleteOdontogramAnnotation(annotationId);
      messageApi.success("Anotação removida.");
      fetchAnnotations();
    } catch (e) {
      messageApi.error("Erro ao remover anotação.");
    }
  };

  const handleSaveSurfaceAnnotation = async (fdi, surface, status, annotationText) => {
    if (!patientId) return;
    const elementKey = `${fdi}-${surface}`;
    const existing = annotations.find(
      (a) =>
        a.element_type === "tooth_surface" &&
        a.element_key === elementKey &&
        a.dentition === dentition
    );
    try {
      if (existing) {
        await updateOdontogramAnnotation(existing.id, { status, annotation_text: annotationText ?? null });
        messageApi.success("Anotação da face atualizada.");
      } else {
        await createOdontogramAnnotation(patientId, {
          dentition,
          element_type: "tooth_surface",
          element_key: elementKey,
          annotation_text: annotationText ?? null,
          status,
        });
        messageApi.success("Anotação da face adicionada.");
      }
      fetchAnnotations();
    } catch (e) {
      messageApi.error("Erro ao salvar anotação da face.");
    }
  };

  return (
    <div style={{ padding: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 24 }}>
      {contextHolder}

      <Card size="small" title="Adicionar tratamento">
        <Form
          form={treatmentForm}
          layout="vertical"
          onFinish={onTreatmentFinish}
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
                <Select
                  options={[
                    { value: "dente", label: "Dente" },
                    { value: "regiao", label: "Região" },
                  ]}
                />
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
                      onSearch={onProcedureSearch}
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
                      notFoundContent={loadingAllProcedures ? "Carregando..." : null}
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
                <Form.Item label=" " colon={false} style={{ marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                    Adicionar tratamento
                  </Button>
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card size="small" title="Lista de tratamentos">
        <Table
          dataSource={treatments}
          loading={loadingTreatments}
          rowKey="id"
          columns={treatmentColumns}
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
        />
      </Card>

      <Modal
        open={editModalOpen}
        title="Editar tratamento"
        onCancel={closeEditModal}
        footer={null}
        destroyOnClose
        width={720}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={onEditTreatmentFinish}
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
          </Row>

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

          <Row gutter={16}>
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
                      value={editProcedureSearchValue}
                      options={editProcedureAutocompleteOptions}
                      onSearch={(v) => setEditProcedureSearchValue(v ?? "")}
                      onSelect={(v) => {
                        if (v === "__create__") {
                          handleCreateCustomProcedureForEdit();
                          return;
                        }
                        const opt = editProcedureOptions.find((o) => String(o.value) === v);
                        if (opt?.procedure) setEditSelectedProcedure(opt.procedure);
                      }}
                      placeholder="Buscar por nome ou código TUSS (mín. 3 caracteres)"
                      style={{ width: "100%" }}
                      maxLength={100}
                      filterOption={false}
                      notFoundContent={loadingAllProcedures ? "Carregando..." : null}
                    />
                    {editProcedureSearchValue?.trim() && (
                      <Button type="default" onClick={handleCreateCustomProcedureForEdit} loading={creatingEditProcedure}>
                        + Criar
                      </Button>
                    )}
                  </Space.Compact>
                  {editSelectedProcedure && (
                    <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                      Selecionado: {editSelectedProcedure.name}
                      {editSelectedProcedure.tuss_code ? ` (${editSelectedProcedure.tuss_code})` : ""}
                    </Text>
                  )}
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col xs={24}>
              <Space>
                <Button onClick={closeEditModal}>Cancelar</Button>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  Salvar alterações
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="Excluir tratamento?"
        open={deleteModalOpen}
        onOk={handleDeleteTreatment}
        onCancel={closeDeleteModal}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={deletingTreatment}
      >
        <p>Esta ação remove o tratamento permanentemente.</p>
      </Modal>

      <Card size="small" title="Odontograma">
        <OdontogramGrid
          inline
          dentition={dentition}
          onDentitionChange={setDentition}
          annotations={annotations}
          getAnnotationFor={getAnnotationFor}
          getSurfaceAnnotationsForTooth={getSurfaceAnnotationsForTooth}
          getTreatmentsForTooth={getTreatmentsForTooth}
          onSaveAnnotation={handleSaveOdontogramAnnotation}
          onSaveSurfaceAnnotation={handleSaveSurfaceAnnotation}
          onDeleteAnnotation={handleDeleteOdontogramAnnotation}
          onDeleteSurfaceAnnotation={handleDeleteOdontogramAnnotation}
        />
      </Card>
    </div>
  );
}
