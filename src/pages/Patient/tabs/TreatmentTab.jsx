import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  message,
  Table,
  AutoComplete,
  Space,
  Tag,
  DatePicker,
  Upload,
  Modal,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  FolderOpenOutlined,
  InboxOutlined,
  DownloadOutlined,
  FileOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  searchProcedures,
  createProcedure,
  getTreatments,
  createTreatment,
  updateTreatment,
  getOdontogramAnnotations,
  createOdontogramAnnotation,
  updateOdontogramAnnotation,
  deleteOdontogramAnnotation,
  getEvolutionFolder,
  getEvolutionEntries,
  createEvolutionEntry,
  deleteEvolutionEntry,
} from "../../../services/treatmentService";
import OdontogramGrid from "../../../components/OdontogramGrid/OdontogramGrid";
import { requestUploadUrl, confirmUpload, getAttachments, getDownloadUrl } from "../../../services/attachmentService";

const { Title, Text } = Typography;
const { TextArea } = Input;
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
  { value: "Superior", label: "Superior" },
  { value: "Inferior", label: "Inferior" },
  { value: "Hemiarcada", label: "Hemiarcada" },
];

const STATUS_OPTIONS = [
  { value: "planejado", label: "Planejado" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export default function TreatmentTab({ patientId }) {
  const [treatmentForm] = Form.useForm();
  const [evolutionForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [treatments, setTreatments] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [allProcedures, setAllProcedures] = useState([]);
  const [loadingAllProcedures, setLoadingAllProcedures] = useState(false);
  const [creatingProcedure, setCreatingProcedure] = useState(false);
  const [procedureSearchValue, setProcedureSearchValue] = useState("");
  const [selectedProcedure, setSelectedProcedure] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [dentition, setDentition] = useState("permanent");

  const [evolutionEntries, setEvolutionEntries] = useState([]);
  const [loadingEvolution, setLoadingEvolution] = useState(false);
  const [evolutionFolderId, setEvolutionFolderId] = useState(null);
  const [evolutionFile, setEvolutionFile] = useState(null);
  const [submittingEvolution, setSubmittingEvolution] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [evolutionViewEntry, setEvolutionViewEntry] = useState(null);
  const [evolutionViewAttachments, setEvolutionViewAttachments] = useState([]);
  const [loadingEvolutionView, setLoadingEvolutionView] = useState(false);

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

  const fetchEvolution = useCallback(async () => {
    if (!patientId) return;
    setLoadingEvolution(true);
    try {
      const data = await getEvolutionEntries(patientId);
      setEvolutionEntries(data);
    } catch (e) {
      messageApi.error("Erro ao carregar evolução.");
    } finally {
      setLoadingEvolution(false);
    }
  }, [patientId, messageApi]);

  useEffect(() => {
    fetchTreatments();
    fetchAnnotations();
    fetchEvolution();
  }, [fetchTreatments, fetchAnnotations, fetchEvolution]);

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
      setProcedureOptions([]);
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

  const onEvolutionFolderRequest = async () => {
    if (!patientId) return;
    try {
      const folder = await getEvolutionFolder(patientId);
      setEvolutionFolderId(folder.id);
      return folder.id;
    } catch (e) {
      messageApi.error("Erro ao obter pasta de evolução.");
      return null;
    }
  };

  const onEvolutionFinish = async (values) => {
    if (!patientId) return;
    setSubmittingEvolution(true);
    try {
      let folderId = evolutionFolderId;
      if (evolutionFile && !folderId) {
        folderId = await onEvolutionFolderRequest();
        if (folderId) {
          const { uploadUrl, fileId, s3Key, fileType } = await requestUploadUrl(patientId, evolutionFile, folderId);
          await fetch(uploadUrl, {
            method: "PUT",
            body: evolutionFile,
            headers: { "Content-Type": evolutionFile.type || "application/octet-stream" },
          });
          await confirmUpload(patientId, {
            fileId,
            s3Key,
            fileName: evolutionFile.name,
            fileType,
            fileSize: evolutionFile.size,
            folderId,
            mimeType: evolutionFile.type,
          });
        }
      }
      await createEvolutionEntry(patientId, {
        content: values.content || null,
        occurred_at: values.occurred_at ? dayjs(values.occurred_at).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        folder_id: folderId || null,
      });
      messageApi.success("Evolução registrada.");
      evolutionForm.resetFields();
      setEvolutionFolderId(null);
      setEvolutionFile(null);
      setIsEvolutionModalOpen(false);
      fetchEvolution();
    } catch (e) {
      messageApi.error(e.response?.data?.error || "Erro ao salvar evolução.");
    } finally {
      setSubmittingEvolution(false);
    }
  };

  const handleDeleteEvolution = async (id) => {
    try {
      await deleteEvolutionEntry(id);
      messageApi.success("Entrada removida.");
      fetchEvolution();
    } catch (e) {
      messageApi.error("Erro ao remover.");
    }
  };

  const openEvolutionView = useCallback(
    async (entry) => {
      setEvolutionViewEntry(entry);
      setEvolutionViewAttachments([]);
      if (entry?.folder_id && patientId) {
        setLoadingEvolutionView(true);
        try {
          const data = await getAttachments(patientId, entry.folder_id);
          setEvolutionViewAttachments(data.attachments || []);
        } catch (e) {
          messageApi.error("Erro ao carregar anexos.");
        } finally {
          setLoadingEvolutionView(false);
        }
      }
    },
    [patientId, messageApi]
  );

  const handleOpenAttachment = async (attachmentId) => {
    try {
      const { downloadUrl } = await getDownloadUrl(attachmentId);
      window.open(downloadUrl, "_blank");
    } catch (e) {
      messageApi.error("Erro ao abrir anexo.");
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
                      <Select options={REGIONS} placeholder="Superior, Inferior, Hemiarcada" />
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
            <Col xs={24} md={18}>
              <Form.Item label="Procedimento" required>
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
                    style={{ flex: 1 }}
                    maxLength={100}
                    filterOption={false}
                    notFoundContent={loadingAllProcedures ? "Carregando..." : null}
                  />
                  {procedureSearchValue?.trim() && (
                    <Button type="default" onClick={handleCreateCustomProcedure} loading={creatingProcedure}>
                      Criar personalizado
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
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label=" " colon={false}>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  Adicionar tratamento
                </Button>
              </Form.Item>
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

      <Card
        size="small"
        title="Evolução do paciente"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              evolutionForm.setFieldsValue({ occurred_at: dayjs() });
              setEvolutionFile(null);
              setIsEvolutionModalOpen(true);
            }}
          >
            Nova evolução
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {evolutionEntries.map((entry) => (
            <Card
              key={entry.id}
              size="small"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => openEvolutionView(entry)}
            >
              <Text type="secondary">{dayjs(entry.occurred_at).format("DD/MM/YYYY")}</Text>
              <div style={{ marginTop: 4 }}>{entry.content ? `${entry.content.slice(0, 80)}${entry.content.length > 80 ? "…" : ""}` : "—"}</div>
              {entry.folder_id ? (
                <Space style={{ marginTop: 8 }}>
                  <FolderOpenOutlined />
                  <Text type="secondary">Anexo na aba Anexos (pasta vinculada).</Text>
                </Space>
              ) : null}
              <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                <Button type="link" danger size="small" onClick={() => handleDeleteEvolution(entry.id)}>
                  Remover
                </Button>
              </div>
            </Card>
          ))}
        </Space>
      </Card>

      <Modal
        title="Evolução"
        open={!!evolutionViewEntry}
        onCancel={() => setEvolutionViewEntry(null)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {evolutionViewEntry && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <div>
              <Text type="secondary">Data</Text>
              <div>{dayjs(evolutionViewEntry.occurred_at).format("DD/MM/YYYY")}</div>
            </div>
            <div>
              <Text type="secondary">Descrição</Text>
              <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                {evolutionViewEntry.content || "—"}
              </div>
            </div>
            {evolutionViewEntry.folder_id && (
              <div>
                <Text type="secondary">Anexos</Text>
                {loadingEvolutionView ? (
                  <div style={{ marginTop: 8 }}>Carregando anexos...</div>
                ) : evolutionViewAttachments.length === 0 ? (
                  <div style={{ marginTop: 8 }}>Nenhum anexo nesta pasta (pode ter sido removido na aba Anexos).</div>
                ) : (
                  <Space direction="vertical" style={{ width: "100%", marginTop: 8 }}>
                    {evolutionViewAttachments.map((att) => (
                      <div key={att.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FileOutlined />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{att.file_name}</span>
                        <Button
                          type="link"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleOpenAttachment(att.id)}
                        >
                          Abrir
                        </Button>
                      </div>
                    ))}
                  </Space>
                )}
              </div>
            )}
          </Space>
        )}
      </Modal>

      <Modal
        title="Nova evolução"
        open={isEvolutionModalOpen}
        onCancel={() => {
          setIsEvolutionModalOpen(false);
          evolutionForm.resetFields();
          setEvolutionFile(null);
          setEvolutionFolderId(null);
        }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={evolutionForm}
          layout="vertical"
          onFinish={onEvolutionFinish}
          initialValues={{ occurred_at: dayjs() }}
        >
          <Form.Item name="content" label="Texto da evolução">
            <TextArea rows={4} placeholder="Registre a evolução do tratamento..." />
          </Form.Item>
          <Form.Item name="occurred_at" label="Data" rules={[{ required: true, message: "Informe a data." }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Anexo (será salvo em pasta na aba Anexos)">
            <Upload.Dragger
              maxCount={1}
              beforeUpload={(file) => {
                setEvolutionFile(file);
                return false;
              }}
              onRemove={() => setEvolutionFile(null)}
              fileList={evolutionFile ? [{ uid: "-1", name: evolutionFile.name }] : []}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">Clique ou arraste arquivo (pasta tratamento/tratamento_1 em Anexos)</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submittingEvolution}>
                Salvar evolução
              </Button>
              <Button
                onClick={() => {
                  setIsEvolutionModalOpen(false);
                  evolutionForm.resetFields();
                  setEvolutionFile(null);
                  setEvolutionFolderId(null);
                }}
              >
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
