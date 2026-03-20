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
  Row,
  Col,
  Space,
  List,
} from "antd";
import { PlusOutlined, EditOutlined, PercentageOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getTreatments } from "../../../services/treatmentService";
import { searchProcedures } from "../../../services/treatmentService";
import { createBudget } from "../../../services/budgetService";
import TreatmentFormModal from "../../../components/TreatmentFormModal/TreatmentFormModal";

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "R$ 0,00";
  return `R$ ${Number(value).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function getTreatmentDisplayName(t) {
  const proc = t.procedure_name || "Procedimento";
  const target = t.target_type === "dente" ? `Dente ${t.tooth_fdi}` : t.region_name || "";
  return target ? `${proc} (${target})` : proc;
}

export default function BudgetTab({ patientId, isActive }) {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

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

  useEffect(() => {
    fetchTreatments();
    fetchProcedures();
  }, [fetchTreatments, fetchProcedures]);

  useEffect(() => {
    if (isActive && patientId) {
      fetchTreatments();
    }
  }, [isActive, patientId, fetchTreatments]);

  const plannedTreatments = treatments.filter((t) => t.status === "planejado");

  const selectedTreatments = plannedTreatments.filter((t) => selectedTreatmentIds.includes(t.id));
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
    } catch (e) {
      if (e.errorFields) return;
      messageApi.error(e.response?.data?.error || "Erro ao salvar orçamento.");
    } finally {
      setSavingBudget(false);
    }
  };

  return (
    <div style={{ padding: "0 0 24px 0", display: "flex", flexDirection: "column", gap: 24 }}>
      {contextHolder}

      <Card size="small" title="Dados do orçamento">
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
