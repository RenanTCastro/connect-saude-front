import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import {
  Modal,
  Form,
  Input,
  Checkbox,
  Button,
  Space,
  Typography,
  message,
  AutoComplete,
  Tag,
  DatePicker,
} from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  CloseOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getDocumentTemplate, DOCUMENT_TYPES } from "../../utils/documentTemplates";
import { searchMedications } from "../../services/prescriptionMedicationService";
import DocumentPDF from "../DocumentPDF/DocumentPDF";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import dayjs from "dayjs";
import "./DocumentEditor.css";

const { Title } = Typography;
const { TextArea } = Input;
const MEDICATION_INPUT_MAX_LENGTH = 100;
const TEXTAREA_MAX_LENGTH = 1000;

/** Escapa texto para uso seguro em HTML */
function escapeHtml(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Converte quebras de linha em <p> */
function textToHtmlParagraphs(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .trim()
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

export default function DocumentEditor({
  documentType,
  patient,
  open,
  onClose,
}) {
  const [form] = Form.useForm();
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentBody, setDocumentBody] = useState("");
  const [hasPatientSignature, setHasPatientSignature] = useState(false);
  const [hasProfessionalSignature, setHasProfessionalSignature] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const lastDocumentTypeRef = useRef(null);
  const editorRef = useRef(null);

  // Medicamentos (somente para receituário)
  const [medicationSearchValue, setMedicationSearchValue] = useState("");
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [medicationOptions, setMedicationOptions] = useState([]);
  const [loadingMedications, setLoadingMedications] = useState(false);
  const medicationDebounceRef = useRef(null);

  // Receituário: prescrição e orientações
  const [prescriptionText, setPrescriptionText] = useState("");
  const [showOrientacoes, setShowOrientacoes] = useState(false);
  const [orientacoesText, setOrientacoesText] = useState("");

  // Atestado
  const [certificatePatientName, setCertificatePatientName] = useState("");
  const [certificateCpf, setCertificateCpf] = useState("");
  const [certificatePeriodoAte, setCertificatePeriodoAte] = useState(dayjs());
  const [certificateDiagnosticos, setCertificateDiagnosticos] = useState("");
  const [certificateRecomendacoes, setCertificateRecomendacoes] = useState("");
  const [certificateLocal, setCertificateLocal] = useState("");
  const [certificateData, setCertificateData] = useState(dayjs());

  const isPrescription = documentType === DOCUMENT_TYPES.PRESCRIPTION;
  const isCertificate = documentType === DOCUMENT_TYPES.CERTIFICATE;
  const isStructuredForm = isPrescription || isCertificate;

  const fetchMedicationOptions = useCallback(async (q) => {
    if (!q || String(q).trim().length < 2) {
      setMedicationOptions([]);
      return;
    }
    setLoadingMedications(true);
    try {
      const list = await searchMedications(q);
      setMedicationOptions(list || []);
    } catch {
      setMedicationOptions([]);
      messageApi.error("Erro ao buscar medicamentos.");
    } finally {
      setLoadingMedications(false);
    }
  }, [messageApi]);

  const onMedicationSearch = useCallback((value) => {
    const v = (value ?? "").slice(0, MEDICATION_INPUT_MAX_LENGTH);
    setMedicationSearchValue(v);
    if (medicationDebounceRef.current) clearTimeout(medicationDebounceRef.current);
    medicationDebounceRef.current = setTimeout(() => {
      fetchMedicationOptions(v);
    }, 300);
  }, [fetchMedicationOptions]);

  const medicationAutocompleteOptions = useMemo(() => {
    return medicationOptions.map((m) => ({
      value: String(m.id),
      label: m.apresentacao ? `${m.termo} – ${m.apresentacao}` : m.termo,
      medication: m,
    }));
  }, [medicationOptions]);

  const updateContent = useCallback(() => {
    if (editorRef.current) {
      setDocumentBody(editorRef.current.innerHTML);
    }
  }, []);

  const getMedicationLine = (med) =>
    `${med.termo}${med.apresentacao ? ` – ${med.apresentacao}` : ""}`;

  const handleAddMedication = useCallback((medication) => {
    const id = medication.id ?? `temp-${Date.now()}`;
    const med = { ...medication, id };
    if (selectedMedications.some((m) => String(m.id) === String(id))) return;
    setSelectedMedications((prev) => [...prev, med]);
    const line = getMedicationLine(med);
    setPrescriptionText((prev) => {
      const next = prev ? `${prev}\n${line}` : line;
      return next.slice(0, TEXTAREA_MAX_LENGTH);
    });
    setMedicationSearchValue("");
    setMedicationOptions([]);
  }, [selectedMedications]);

  const handleRemoveMedication = useCallback((medication) => {
    setSelectedMedications((prev) =>
      prev.filter((m) => String(m.id) !== String(medication.id))
    );
    setPrescriptionText((prev) =>
      prev
        .split("\n")
        .filter((line) => !line.includes(medication.termo))
        .join("\n")
        .trim()
    );
  }, []);

  const handleAddCustomMedication = useCallback(() => {
    const trimmed = medicationSearchValue?.trim();
    if (!trimmed || trimmed.length < 3) {
      messageApi.warning("Digite o termo do medicamento (mín. 3 caracteres).");
      return;
    }
    handleAddMedication({ termo: trimmed, apresentacao: null });
  }, [medicationSearchValue, handleAddMedication, messageApi]);

  const showAddCustom =
    medicationSearchValue?.trim().length >= 2 &&
    medicationAutocompleteOptions.every(
      (o) =>
        o.medication?.termo?.toLowerCase() !==
        medicationSearchValue?.trim().toLowerCase()
    );

  useEffect(() => {
    if (!open) {
      lastDocumentTypeRef.current = null;
      return;
    }

    if (documentType && lastDocumentTypeRef.current !== documentType) {
      setSelectedMedications([]);
      const template = getDocumentTemplate(documentType, patient);

      setDocumentTitle(template.title ?? "");
      setHasPatientSignature(template.hasPatientSignature ?? false);
      setHasProfessionalSignature(template.hasProfessionalSignature ?? false);

      if (isPrescription) {
        setPrescriptionText(template.defaultPrescriptionText ?? "");
        setShowOrientacoes(template.defaultShowOrientacoes ?? false);
        setOrientacoesText(template.defaultOrientacoesText ?? "");
      }

      if (isCertificate) {
        setCertificatePatientName(template.defaultPatientName ?? "");
        setCertificateCpf(template.defaultCpf ?? "");
        setCertificatePeriodoAte(template.defaultPeriodoAte ?? dayjs());
        setCertificateDiagnosticos(template.defaultDiagnosticos ?? "");
        setCertificateRecomendacoes(template.defaultRecomendacoes ?? "");
        setCertificateLocal(template.defaultLocal ?? "");
        setCertificateData(template.defaultData ?? dayjs());
      }

      if (!isStructuredForm) {
        setDocumentBody(template.body ?? "");
      }

      setTimeout(() => {
        form.setFieldsValue({
          title: template.title ?? "",
        });
        if (editorRef.current && !isStructuredForm) {
          editorRef.current.innerHTML = template.body ?? "";
        }
      }, 0);

      lastDocumentTypeRef.current = documentType;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentType]);

  const handleTitleChange = (e) => {
    setDocumentTitle(e.target.value);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleClose = () => {
    form.resetFields();
    setDocumentTitle("");
    setDocumentBody("");
    setHasPatientSignature(false);
    setHasProfessionalSignature(false);
    setShowPreview(false);
    setSelectedMedications([]);
    setMedicationSearchValue("");
    setMedicationOptions([]);
    setPrescriptionText("");
    setShowOrientacoes(false);
    setOrientacoesText("");
    setCertificatePatientName("");
    setCertificateCpf("");
    setCertificatePeriodoAte(dayjs());
    setCertificateDiagnosticos("");
    setCertificateRecomendacoes("");
    setCertificateLocal("");
    setCertificateData(dayjs());
    onClose();
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  const handleEditorInput = () => {
    updateContent();
  };

  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
    updateContent();
  };

  // Monta o body para PDF conforme o tipo de documento
  const buildBodyForPDF = useCallback(() => {
    if (isPrescription) {
      const patientLine = `<p><strong>Paciente:</strong> ${escapeHtml(patient?.full_name || "[NOME DO PACIENTE]")}</p>`;
      const dataLine = `<p><strong>Data:</strong> ${dayjs().format("DD/MM/YYYY")}</p>`;
      const prescLabel = `<p><strong>PRESCRIÇÃO:</strong></p>`;
      const prescContent = prescriptionText
        ? textToHtmlParagraphs(prescriptionText)
        : "<p></p>";
      let body = `${patientLine}${dataLine}${prescLabel}${prescContent}`;
      if (showOrientacoes && orientacoesText) {
        body += `<p><strong>ORIENTAÇÕES:</strong></p>${textToHtmlParagraphs(orientacoesText)}`;
      }
      return body;
    }

    if (isCertificate) {
      const patientName = certificatePatientName || patient?.full_name || "[NOME DO PACIENTE]";
      const cpf = certificateCpf || patient?.cpf || "[CPF]";
      const periodoStr = certificatePeriodoAte?.isValid?.()
        ? certificatePeriodoAte.format("DD/MM/YYYY")
        : dayjs().format("DD/MM/YYYY");
      const dataStr = certificateData?.isValid?.()
        ? certificateData.format("DD/MM/YYYY")
        : dayjs().format("DD/MM/YYYY");
      const local = certificateLocal || "";
      const diag = certificateDiagnosticos || "";
      const rec = certificateRecomendacoes || "";

      let body = `<p>Atesto para os devidos fins que o(a) paciente <strong>${escapeHtml(patientName)}</strong>, CPF ${escapeHtml(cpf)}, esteve sob meus cuidados no período até ${periodoStr}.</p>`;
      body += `<p><strong>DIAGNÓSTICO:</strong></p>${diag ? textToHtmlParagraphs(diag) : "<p></p>"}`;
      body += `<p><strong>RECOMENDAÇÕES:</strong></p>${rec ? textToHtmlParagraphs(rec) : "<p></p>"}`;
      body += `<p>Este atestado é válido para os fins a que se destina.</p>`;
      body += `<p><strong>Local e data:</strong> ${escapeHtml(local)}${local ? ", " : ""}${dataStr}</p>`;
      return body;
    }

    return (editorRef.current?.innerHTML ?? documentBody) || "";
  }, [
    isPrescription,
    isCertificate,
    patient,
    prescriptionText,
    showOrientacoes,
    orientacoesText,
    certificatePatientName,
    certificateCpf,
    certificatePeriodoAte,
    certificateDiagnosticos,
    certificateRecomendacoes,
    certificateLocal,
    certificateData,
    documentBody,
  ]);

  const getPdfFileName = () => {
    const base =
      documentTitle.trim() ||
      (isPrescription ? "Receituario" : isCertificate ? "Atestado" : "Documento");
    return `${base}_${dayjs().format("YYYY-MM-DD")}.pdf`;
  };

  const documentData = {
    title: documentTitle,
    body: buildBodyForPDF(),
    hasPatientSignature,
    hasProfessionalSignature,
    patient,
  };

  const renderPrescriptionForm = () => (
    <>
      <Form.Item label="Adicionar medicamento">
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          <Space.Compact style={{ width: "100%" }}>
            <AutoComplete
              value={medicationSearchValue}
              options={[
                ...medicationAutocompleteOptions,
                ...(showAddCustom
                  ? [
                      {
                        value: "__create__",
                        label: `Adicionar: "${medicationSearchValue?.trim()}"`,
                      },
                    ]
                  : []),
              ]}
              onSearch={onMedicationSearch}
              onSelect={(v) => {
                if (v === "__create__") {
                  handleAddCustomMedication();
                  return;
                }
                const opt = medicationAutocompleteOptions.find(
                  (o) => String(o.value) === v
                );
                if (opt?.medication) handleAddMedication(opt.medication);
              }}
              placeholder="Buscar por termo ou apresentação (mín. 3 caracteres)"
              style={{ flex: 1 }}
              filterOption={false}
              notFoundContent={loadingMedications ? "Buscando..." : null}
              maxLength={MEDICATION_INPUT_MAX_LENGTH}
            />
            {showAddCustom && (
              <Button
                type="default"
                onClick={handleAddCustomMedication}
                icon={<PlusOutlined />}
              >
                Adicionar
              </Button>
            )}
          </Space.Compact>
          {selectedMedications.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {selectedMedications.map((m) => (
                <Tag
                  key={m.id}
                  closable
                  onClose={() => handleRemoveMedication(m)}
                >
                  {m.termo}
                  {m.apresentacao ? ` – ${m.apresentacao}` : ""}
                </Tag>
              ))}
            </div>
          )}
        </Space>
      </Form.Item>

      <Form.Item label="Prescrição">
        <TextArea
          value={prescriptionText}
          onChange={(e) => setPrescriptionText(e.target.value)}
          placeholder="Preenchido automaticamente com os medicamentos adicionados. Você pode editar o texto."
          rows={6}
          maxLength={TEXTAREA_MAX_LENGTH}
          showCount
        />
      </Form.Item>

      <Form.Item>
        <Checkbox
          checked={showOrientacoes}
          onChange={(e) => setShowOrientacoes(e.target.checked)}
        >
          Mostrar orientações
        </Checkbox>
      </Form.Item>

      {showOrientacoes && (
        <Form.Item label="Orientações">
          <TextArea
            value={orientacoesText}
            onChange={(e) => setOrientacoesText(e.target.value)}
            placeholder="Digite as orientações ao paciente"
            rows={4}
            maxLength={TEXTAREA_MAX_LENGTH}
            showCount
          />
        </Form.Item>
      )}
    </>
  );

  const renderCertificateForm = () => (
    <>
      <Form.Item label="Paciente">
        <Input
          value={certificatePatientName}
          onChange={(e) => setCertificatePatientName(e.target.value)}
          placeholder="Nome do paciente"
        />
      </Form.Item>

      <Form.Item label="CPF">
        <Input
          value={certificateCpf}
          onChange={(e) => setCertificateCpf(e.target.value)}
          placeholder="CPF do paciente"
        />
      </Form.Item>

      <Form.Item label="Período até">
        <DatePicker
          value={certificatePeriodoAte}
          onChange={(d) => setCertificatePeriodoAte(d || dayjs())}
          format="DD/MM/YYYY"
          style={{ width: "100%" }}
        />
      </Form.Item>

      <Form.Item label="Diagnósticos">
        <TextArea
          value={certificateDiagnosticos}
          onChange={(e) => setCertificateDiagnosticos(e.target.value)}
          placeholder="Descreva o(s) diagnóstico(s)"
          rows={4}
          maxLength={TEXTAREA_MAX_LENGTH}
          showCount
        />
      </Form.Item>

      <Form.Item label="Recomendações">
        <TextArea
          value={certificateRecomendacoes}
          onChange={(e) => setCertificateRecomendacoes(e.target.value)}
          placeholder="Descreva as recomendações"
          rows={4}
          maxLength={TEXTAREA_MAX_LENGTH}
          showCount
        />
      </Form.Item>

      <Form.Item label="Local e data">
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={certificateLocal}
            onChange={(e) => setCertificateLocal(e.target.value)}
            placeholder="Local (ex: São Paulo)"
            style={{ flex: 1 }}
          />
          <DatePicker
            value={certificateData}
            onChange={(d) => setCertificateData(d || dayjs())}
            format="DD/MM/YYYY"
          />
        </Space.Compact>
      </Form.Item>
    </>
  );

  const renderRichTextEditor = () => (
    <Form.Item label="Corpo do Documento">
      <div className="rich-text-editor">
        <div className="editor-toolbar">
          <Space>
            <Button
              type="text"
              icon={<BoldOutlined />}
              onClick={() => execCommand("bold")}
              title="Negrito"
            />
            <Button
              type="text"
              icon={<ItalicOutlined />}
              onClick={() => execCommand("italic")}
              title="Itálico"
            />
            <Button
              type="text"
              icon={<UnderlineOutlined />}
              onClick={() => execCommand("underline")}
              title="Sublinhado"
            />
            <Button
              type="text"
              icon={<UnorderedListOutlined />}
              onClick={() => execCommand("insertUnorderedList")}
              title="Lista não ordenada"
            />
            <Button
              type="text"
              icon={<OrderedListOutlined />}
              onClick={() => execCommand("insertOrderedList")}
              title="Lista ordenada"
            />
            <span className="editor-toolbar-divider" />
            <Button
              type="text"
              onClick={() => execCommand("formatBlock", "h1")}
              title="Título 1"
            >
              H1
            </Button>
            <Button
              type="text"
              onClick={() => execCommand("formatBlock", "h2")}
              title="Título 2"
            >
              H2
            </Button>
            <Button
              type="text"
              onClick={() => execCommand("formatBlock", "h3")}
              title="Título 3"
            >
              H3
            </Button>
            <Button
              type="text"
              onClick={() => execCommand("formatBlock", "p")}
              title="Texto normal"
            >
              P
            </Button>
            <span className="editor-toolbar-divider" />
            <Button
              type="text"
              icon={<AlignLeftOutlined />}
              onClick={() => execCommand("justifyLeft")}
              title="Alinhar à esquerda"
            />
            <Button
              type="text"
              icon={<AlignCenterOutlined />}
              onClick={() => execCommand("justifyCenter")}
              title="Centralizar"
            />
            <Button
              type="text"
              icon={<AlignRightOutlined />}
              onClick={() => execCommand("justifyRight")}
              title="Alinhar à direita"
            />
          </Space>
        </div>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleEditorInput}
          onPaste={handleEditorPaste}
          className="editor-content"
          style={{
            minHeight: "300px",
            padding: "12px",
            border: "1px solid #d9d9d9",
            borderRadius: "0 0 6px 6px",
            outline: "none",
            overflowY: "auto",
          }}
          suppressContentEditableWarning={true}
        />
      </div>
    </Form.Item>
  );

  return (
    <>
      {contextHolder}
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width="90%"
        style={{ maxWidth: 1200 }}
        className="document-editor-modal"
      >
        <div className="document-editor-container">
          <Title level={4} style={{ marginBottom: 24 }}>
            Editar Documento
          </Title>

          <Form form={form} layout="vertical">
            <Form.Item label="Título do Documento" name="title">
              <Input
                placeholder="Digite o título do documento (opcional)"
                value={documentTitle}
                onChange={handleTitleChange}
                size="large"
              />
            </Form.Item>

            {isPrescription && renderPrescriptionForm()}
            {isCertificate && renderCertificateForm()}
            {!isStructuredForm && renderRichTextEditor()}

            <Form.Item>
              <Space direction="vertical" size="middle">
                <Checkbox
                  checked={hasPatientSignature}
                  onChange={(e) => setHasPatientSignature(e.target.checked)}
                >
                  Assinatura do Paciente
                </Checkbox>
                <Checkbox
                  checked={hasProfessionalSignature}
                  onChange={(e) => setHasProfessionalSignature(e.target.checked)}
                >
                  Assinatura do Profissional
                </Checkbox>
              </Space>
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Space>
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  onClick={handlePreview}
                  size="large"
                >
                  Visualizar
                </Button>
                <PDFDownloadLink
                  document={<DocumentPDF {...documentData} />}
                  fileName={getPdfFileName()}
                  style={{ textDecoration: "none" }}
                >
                  {({ loading: pdfLoading }) => (
                    <Button
                      type="primary"
                      icon={<FilePdfOutlined />}
                      loading={pdfLoading}
                      disabled={pdfLoading}
                      size="large"
                    >
                      {pdfLoading ? "Gerando PDF..." : "Exportar PDF"}
                    </Button>
                  )}
                </PDFDownloadLink>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleClose}
                  size="large"
                >
                  Fechar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {showPreview && (
        <Modal
          open={showPreview}
          onCancel={handleClosePreview}
          footer={[
            <Button key="close" onClick={handleClosePreview}>
              Fechar
            </Button>,
          ]}
          width="90%"
          style={{ maxWidth: 1000 }}
          title="Visualização do Documento"
        >
          <div style={{ height: "80vh", overflow: "auto" }}>
            <PDFViewer width="100%" height="100%">
              <DocumentPDF {...documentData} />
            </PDFViewer>
          </div>
        </Modal>
      )}
    </>
  );
}
