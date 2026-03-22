import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  DatePicker,
  Button,
  Checkbox,
  InputNumber,
  message,
  Modal,
  Row,
  Col,
  Space,
  List,
  Table,
  Tooltip,
} from "antd";
import { PlusOutlined, EditOutlined, PercentageOutlined, FilePdfOutlined, ArrowLeftOutlined, FileTextOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getTreatments,
  searchProcedures,
  getOdontogramAnnotations,
  createOdontogramAnnotation,
  updateOdontogramAnnotation,
  deleteOdontogramAnnotation,
} from "../../../services/treatmentService";
import { getBudgets, getBudget, createBudget, deleteBudget } from "../../../services/budgetService";
import TreatmentFormModal from "../../../components/TreatmentFormModal/TreatmentFormModal";
import DocumentEditor from "../../../components/DocumentEditor/DocumentEditor";
import OdontogramGrid from "../../../components/OdontogramGrid/OdontogramGrid";
import BudgetPDF from "../../../components/BudgetPDF/BudgetPDF";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { DOCUMENT_TYPES } from "../../../utils/documentTemplates";

const REGION_LABEL_TO_KEY = {
  Maxila: "maxila",
  Mandíbula: "mandibula",
  Face: "face",
  Arcadas: "arcadas",
  "Arcada superior": "arcada_superior",
  "Arcada inferior": "arcada_inferior",
};

function normalizeRegion(regionName) {
  if (!regionName) return null;
  return REGION_LABEL_TO_KEY[regionName] ?? regionName?.toLowerCase()?.replace(/\s+/g, "_");
}

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "R$ 0,00";
  return `R$ ${Number(value).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function getTreatmentDisplayName(t) {
  const proc = t.procedure_name || "Procedimento";
  const target = t.target_type === "dente" ? `Dente ${t.tooth_fdi}` : t.region_name || "";
  return target ? `${proc} (${target})` : proc;
}

export default function BudgetTab({ patientId, patient, isActive }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [viewMode, setViewMode] = useState("list"); // "list" | "create"
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState(null);
  const [deletingBudget, setDeletingBudget] = useState(false);

  const [treatments, setTreatments] = useState([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);
  const [allProcedures, setAllProcedures] = useState([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [hasInstallments, setHasInstallments] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [savingBudget, setSavingBudget] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedBudgetForContract, setSelectedBudgetForContract] = useState(null);
  const [dentition, setDentition] = useState("permanent");
  const [annotations, setAnnotations] = useState([]);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [previewBudget, setPreviewBudget] = useState(null);
  const [pdfAnnotations, setPdfAnnotations] = useState([]);

  const fetchBudgets = useCallback(async () => {
    if (!patientId) return;
    setLoadingBudgets(true);
    try {
      const data = await getBudgets(patientId);
      setBudgets(data);
    } catch (e) {
      messageApi.error("Erro ao carregar orçamentos.");
    } finally {
      setLoadingBudgets(false);
    }
  }, [patientId, messageApi]);

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

  const fetchProcedures = useCallback(async () => {
    setLoadingProcedures(true);
    try {
      const list = await searchProcedures("");
      setAllProcedures(list || []);
    } catch (e) {
      setAllProcedures([]);
      messageApi.error("Erro ao carregar procedimentos.");
    } finally {
      setLoadingProcedures(false);
    }
  }, [messageApi]);

  const fetchAnnotations = useCallback(async () => {
    if (!patientId) return;
    setLoadingAnnotations(true);
    try {
      const data = await getOdontogramAnnotations(patientId);
      setAnnotations(data || []);
    } catch (e) {
      messageApi.error("Erro ao carregar anotações.");
    } finally {
      setLoadingAnnotations(false);
    }
  }, [patientId, messageApi]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    if (viewMode === "create") {
      fetchTreatments();
      fetchProcedures();
      fetchAnnotations();
    }
  }, [viewMode, fetchTreatments, fetchProcedures, fetchAnnotations]);

  useEffect(() => {
    if (isActive && patientId) {
      fetchBudgets();
      if (viewMode === "create") {
        fetchTreatments();
        fetchAnnotations();
      }
    }
  }, [isActive, patientId, fetchBudgets, viewMode, fetchTreatments, fetchAnnotations]);

  const plannedTreatments = treatments.filter((t) => t.status === "planejado");
  const selectedTreatments = plannedTreatments.filter((t) => selectedTreatmentIds.includes(t.id));

  const getTreatmentsForTooth = (fdi) =>
    selectedTreatments.filter((t) => t.target_type === "dente" && String(t.tooth_fdi) === String(fdi));

  const getHasSelectedTreatmentForRegion = (regionKey) =>
    selectedTreatments.some(
      (t) => t.target_type === "regiao" && normalizeRegion(t.region_name) === regionKey
    );

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
    const hasSelectedTreatment = getTreatmentsForTooth(fdi).length > 0;
    surfaceCodes.forEach((code) => {
      const annot = annotations.find(
        (a) =>
          a.element_type === "tooth_surface" &&
          a.element_key === prefix + code &&
          a.dentition === dentition
      );
      if (annot) {
        result[code] = annot;
      } else if (hasSelectedTreatment) {
        result[code] = { status: "planned" };
      }
    });
    return result;
  };

  const handleSaveOdontogramAnnotation = async (elementKey, elementType, text, status, existingId) => {
    if (!patientId) return;
    try {
      if (existingId) {
        await updateOdontogramAnnotation(existingId, { annotation_text: text, status });
        messageApi.success("Anotação atualizada.");
      } else {
        await createOdontogramAnnotation(patientId, {
          dentition,
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
  const subtotal = selectedTreatments.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  const totalWithDiscount = Math.max(0, subtotal - (Number(discount) || 0));
  const remainingAfterDownPayment = hasInstallments
    ? Math.max(0, totalWithDiscount - (Number(downPayment) || 0))
    : totalWithDiscount;
  const valuePerInstallment =
    hasInstallments && (Number(installmentsCount) || 0) > 0
      ? remainingAfterDownPayment / (Number(installmentsCount) || 1)
      : 0;

  const handleToggleTreatment = (treatmentId, checked) => {
    setSelectedTreatmentIds((prev) =>
      checked ? [...prev, treatmentId] : prev.filter((id) => id !== treatmentId)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTreatmentIds(plannedTreatments.map((t) => t.id));
    } else {
      setSelectedTreatmentIds([]);
    }
  };

  const openAddTreatmentModal = () => {
    setEditingTreatment(null);
    setTreatmentModalOpen(true);
  };

  const openEditTreatmentModal = (treatment) => {
    setEditingTreatment(treatment);
    setTreatmentModalOpen(true);
  };

  const handleTreatmentModalSuccess = () => {
    fetchTreatments();
    setTreatmentModalOpen(false);
    setEditingTreatment(null);
  };

  const handleSaveBudget = async () => {
    try {
      const values = await form.validateFields();
      if (selectedTreatmentIds.length === 0) {
        messageApi.warning("Selecione ao menos um tratamento para o orçamento.");
        return;
      }

      setSavingBudget(true);
      await createBudget(patientId, {
        description: values.description || null,
        budget_date: values.budget_date ? values.budget_date.format("YYYY-MM-DD") : null,
        discount: Number(discount) || 0,
        down_payment: hasInstallments ? Number(downPayment) || 0 : 0,
        installments_count: hasInstallments ? Number(installmentsCount) || 1 : 1,
        treatment_ids: selectedTreatmentIds,
      });
      messageApi.success("Orçamento salvo com sucesso.");
      form.resetFields();
      setSelectedTreatmentIds([]);
      setDiscount(0);
      setShowDiscountInput(false);
      setHasInstallments(false);
      setDownPayment(0);
      setInstallmentsCount(1);
      setViewMode("list");
      fetchBudgets();
    } catch (e) {
      if (e.errorFields) return;
      messageApi.error(e.response?.data?.error || "Erro ao salvar orçamento.");
    } finally {
      setSavingBudget(false);
    }
  };

  const handleGeneratePdf = async (budget) => {
    try {
      const [fullBudget, annots] = await Promise.all([
        getBudget(budget.id),
        patientId ? getOdontogramAnnotations(patientId) : Promise.resolve([]),
      ]);
      setPreviewBudget(fullBudget);
      setPdfAnnotations(annots || []);
      setPdfPreviewOpen(true);
    } catch (e) {
      messageApi.error("Erro ao carregar orçamento para o PDF.");
    }
  };

  const handleContract = async (budget) => {
    try {
      const fullBudget = await getBudget(budget.id);
      setSelectedBudgetForContract(fullBudget);
      setContractModalOpen(true);
    } catch (e) {
      messageApi.error("Erro ao carregar orçamento para o contrato.");
    }
  };

  const openDeleteModal = (budget) => {
    setDeletingBudgetId(budget.id);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletingBudgetId(null);
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    setDeletingBudget(true);
    try {
      await deleteBudget(deletingBudgetId);
      messageApi.success("Orçamento excluído.");
      closeDeleteModal();
      fetchBudgets();
    } catch (e) {
      messageApi.error(e.response?.data?.error || "Erro ao excluir orçamento.");
    } finally {
      setDeletingBudget(false);
    }
  };

  const resetCreateForm = () => {
    form.resetFields();
    setSelectedTreatmentIds([]);
    setDiscount(0);
    setShowDiscountInput(false);
    setHasInstallments(false);
    setDownPayment(0);
    setInstallmentsCount(1);
    setViewMode("list");
  };

  if (viewMode === "create") {
    return (
      <div style={{ padding: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 24 }}>
        {contextHolder}

        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={resetCreateForm}
          style={{ padding: 0, marginBottom: -8, alignSelf: "flex-start" }}
        >
          Voltar para lista de orçamentos
        </Button>

        <Card size="small" title="Novo orçamento">
          <Form form={form} layout="vertical" initialValues={{ budget_date: dayjs() }}>
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item name="description" label="Descrição">
                  <Input placeholder="Descrição do orçamento" maxLength={500} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="budget_date" label="Data" rules={[{ required: true, message: "Informe a data" }]}>
                  <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
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
            highlightAnatomyForSelectedTreatment
            getHasSelectedTreatmentForRegion={getHasSelectedTreatmentForRegion}
          />
        </Card>

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card
              size="small"
              title="Tratamentos planejados"
              extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={openAddTreatmentModal}>
                  Adicionar tratamento
                </Button>
              }
            >
              {plannedTreatments.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: "#8c8c8c" }}>
                  Nenhum tratamento planejado. Clique em "Adicionar tratamento" para criar.
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <Checkbox
                      checked={selectedTreatmentIds.length === plannedTreatments.length && plannedTreatments.length > 0}
                      indeterminate={
                        selectedTreatmentIds.length > 0 && selectedTreatmentIds.length < plannedTreatments.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    >
                      Selecionar todos
                    </Checkbox>
                  </div>
                  <List
                    loading={loadingTreatments}
                    dataSource={plannedTreatments}
                    renderItem={(item) => (
                      <List.Item
                        style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
                        actions={[
                          <Button
                            key="edit"
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditTreatmentModal(item)}
                          >
                            Editar
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Checkbox
                              checked={selectedTreatmentIds.includes(item.id)}
                              onChange={(e) => handleToggleTreatment(item.id, e.target.checked)}
                            />
                          }
                          title={getTreatmentDisplayName(item)}
                          description={formatCurrency(item.value)}
                        />
                      </List.Item>
                    )}
                  />
                </>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card size="small" title="Resumo do orçamento">
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Valor total:</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>

                {!showDiscountInput ? (
                  <Button
                    type="dashed"
                    icon={<PercentageOutlined />}
                    onClick={() => setShowDiscountInput(true)}
                    block
                  >
                    Adicionar desconto
                  </Button>
                ) : (
                  <div>
                    <span style={{ display: "block", marginBottom: 8 }}>Desconto (R$):</span>
                    <InputNumber
                      min={0}
                      max={subtotal}
                      step={0.01}
                      value={discount}
                      onChange={(v) => setDiscount(v ?? 0)}
                      style={{ width: "100%" }}
                      prefix="R$"
                      decimalSeparator=","
                      thousandSeparator="."
                    />
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
                  <span>Total com desconto:</span>
                  <strong>{formatCurrency(totalWithDiscount)}</strong>
                </div>

                <div style={{ paddingTop: 16, borderTop: "1px solid #f0f0f0", marginTop: 8 }}>
                  <Checkbox
                    checked={hasInstallments}
                    onChange={(e) => {
                      setHasInstallments(e.target.checked);
                      if (!e.target.checked) {
                        setDownPayment(0);
                        setInstallmentsCount(1);
                      }
                    }}
                  >
                    Parcelar orçamento
                  </Checkbox>
                  {hasInstallments && (
                    <Row gutter={16} style={{ marginTop: 12 }}>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", marginBottom: 4 }}>Entrada (R$)</label>
                          <InputNumber
                            min={0}
                            max={totalWithDiscount}
                            step={0.01}
                            precision={2}
                            value={downPayment}
                            onChange={(v) => setDownPayment(v ?? 0)}
                            style={{ width: "100%" }}
                            prefix="R$"
                            placeholder="0,00"
                            decimalSeparator=","
                            thousandSeparator="."
                          />
                        </div>
                      </Col>
                      <Col xs={24} sm={12}>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: "block", marginBottom: 4 }}>Parcelas</label>
                          <InputNumber
                            min={1}
                            max={60}
                            value={installmentsCount}
                            onChange={(v) => setInstallmentsCount(v ?? 1)}
                            style={{ width: "100%" }}
                            placeholder="1"
                          />
                        </div>
                      </Col>
                      {installmentsCount > 1 && (
                        <Col xs={24}>
                          <div style={{ marginTop: 8 }}>
                            <span style={{ color: "#8c8c8c", fontSize: 12 }}>Valor por parcela: </span>
                            <strong>{formatCurrency(valuePerInstallment)}</strong>
                          </div>
                        </Col>
                      )}
                    </Row>
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        <Button type="primary" size="large" onClick={handleSaveBudget} loading={savingBudget} block>
          Salvar orçamento
        </Button>

        <TreatmentFormModal
          open={treatmentModalOpen}
          onCancel={() => {
            setTreatmentModalOpen(false);
            setEditingTreatment(null);
          }}
          onSuccess={handleTreatmentModalSuccess}
          patientId={patientId}
          initialValues={editingTreatment}
          allProcedures={allProcedures}
          loadingProcedures={loadingProcedures}
          messageApi={messageApi}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 24 }}>
      {contextHolder}

      <Card
        size="small"
        title="Orçamentos"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setViewMode("create")}>
            Adicionar novo orçamento
          </Button>
        }
      >
        {budgets.length === 0 && !loadingBudgets ? (
          <div style={{ padding: 48, textAlign: "center", color: "#8c8c8c" }}>
            Nenhum orçamento criado. Clique em "Adicionar novo orçamento" para começar.
          </div>
        ) : (
          <Table
            loading={loadingBudgets}
            dataSource={budgets}
            rowKey="id"
            columns={[
              {
                title: "Data",
                dataIndex: "budget_date",
                key: "budget_date",
                width: 120,
                render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "—"),
              },
              {
                title: "Descrição",
                dataIndex: "description",
                key: "description",
                ellipsis: true,
                render: (desc) => desc || "—",
              },
              {
                title: "Valor",
                dataIndex: "total",
                key: "total",
                width: 120,
                render: (v) => formatCurrency(v),
              },
              {
                title: "",
                key: "actions",
                width: 280,
                render: (_, record) => (
                  <Space size="small" wrap={false}>
                    <Tooltip title="Gerar orçamento">
                      <Button
                        type="default"
                        size="small"
                        icon={<FilePdfOutlined />}
                        onClick={() => handleGeneratePdf(record)}
                      >
                        Gerar orçamento
                      </Button>
                    </Tooltip>
                    <Tooltip title="Gerar contrato">
                      <Button
                        type="default"
                        size="small"
                        icon={<FileTextOutlined />}
                        onClick={() => handleContract(record)}
                      >
                        Gerar contrato
                      </Button>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <Button
                        type="default"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => openDeleteModal(record)}
                      >
                        Excluir
                      </Button>
                    </Tooltip>
                  </Space>
                ),
              },
            ]}
            pagination={false}
            size="small"
            scroll={{ x: "max-content" }}
          />
        )}
      </Card>

      <Modal
        title="Excluir orçamento?"
        open={deleteModalOpen}
        onOk={handleDeleteBudget}
        onCancel={closeDeleteModal}
        okText="Excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={deletingBudget}
      >
        <p>Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.</p>
      </Modal>

      {contractModalOpen && (
        <DocumentEditor
          documentType={DOCUMENT_TYPES.CONTRACT}
          patient={patient}
          budget={selectedBudgetForContract}
          open={contractModalOpen}
          onClose={() => {
            setContractModalOpen(false);
            setSelectedBudgetForContract(null);
          }}
        />
      )}

      <Modal
        title="Visualizar orçamento"
        open={pdfPreviewOpen}
        onCancel={() => {
          setPdfPreviewOpen(false);
          setPreviewBudget(null);
        }}
        width="90%"
        style={{ maxWidth: 900 }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setPdfPreviewOpen(false);
              setPreviewBudget(null);
              setPdfAnnotations([]);
            }}
          >
            Fechar
          </Button>,
          ...(previewBudget
            ? [
                <PDFDownloadLink
                  key="download"
                  document={
                <BudgetPDF
                  patient={patient}
                  budget={previewBudget}
                  dentition={dentition}
                  annotations={pdfAnnotations}
                />
              }
              fileName={`Orcamento_${previewBudget.budget_date ? dayjs(previewBudget.budget_date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")}.pdf`}
            >
              {({ loading }) => (
                <Button type="primary" loading={loading} icon={<FilePdfOutlined />}>
                  {loading ? "Gerando..." : "Baixar PDF"}
                </Button>
              )}
            </PDFDownloadLink>,
              ]
            : []),
        ]}
      >
        {previewBudget && (
          <div style={{ height: "75vh", overflow: "auto" }}>
            <PDFViewer width="100%" height="100%">
              <BudgetPDF
                patient={patient}
                budget={previewBudget}
                dentition={dentition}
                annotations={pdfAnnotations}
              />
            </PDFViewer>
          </div>
        )}
      </Modal>
    </div>
  );
}
