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
const MEDICATION_INPUT_MAX_LENGTH = 100;

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

  const isPrescription = documentType === DOCUMENT_TYPES.PRESCRIPTION;

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

  const insertMedicationIntoEditor = useCallback((medication) => {
    if (!editorRef.current) return;
    const container = editorRef.current.querySelector("[data-prescription-list]");
    if (!container) return;
    const line = `${medication.termo}${medication.apresentacao ? ` – ${medication.apresentacao}` : ""}`;
    const p = document.createElement("p");
    p.setAttribute("data-medication-id", String(medication.id));
    p.textContent = line;
    container.appendChild(p);
    updateContent();
  }, [updateContent]);

  const removeMedicationFromEditor = useCallback((medicationId) => {
    if (!editorRef.current) return;
    const el = editorRef.current.querySelector(`[data-medication-id="${medicationId}"]`);
    if (el) el.remove();
    updateContent();
  }, [updateContent]);

  const handleAddMedication = useCallback((medication) => {
    const id = medication.id ?? `temp-${Date.now()}`;
    const med = { ...medication, id };
    if (selectedMedications.some((m) => String(m.id) === String(id))) return;
    setSelectedMedications((prev) => [...prev, med]);
    insertMedicationIntoEditor(med);
    setMedicationSearchValue("");
    setMedicationOptions([]);
  }, [selectedMedications, insertMedicationIntoEditor]);

  const handleRemoveMedication = useCallback((medication) => {
    setSelectedMedications((prev) => prev.filter((m) => String(m.id) !== String(medication.id)));
    removeMedicationFromEditor(medication.id);
  }, [removeMedicationFromEditor]);

  const handleAddCustomMedication = useCallback(() => {
    const trimmed = medicationSearchValue?.trim();
    if (!trimmed || trimmed.length < 2) {
      messageApi.warning("Digite o termo do medicamento (mín. 2 caracteres).");
      return;
    }
    handleAddMedication({ termo: trimmed, apresentacao: null });
  }, [medicationSearchValue, handleAddMedication, messageApi]);

  const showAddCustom =
    medicationSearchValue?.trim().length >= 2 &&
    medicationAutocompleteOptions.every(
      (o) => o.medication?.termo?.toLowerCase() !== medicationSearchValue?.trim().toLowerCase()
    );

  useEffect(() => {
    if (!open) {
      lastDocumentTypeRef.current = null;
      return;
    }

    if (documentType && lastDocumentTypeRef.current !== documentType) {
      setSelectedMedications([]);
      const template = getDocumentTemplate(documentType, patient);
      setDocumentTitle(template.title);
      // Usar HTML diretamente no editor WYSIWYG
      setDocumentBody(template.body);
      setHasPatientSignature(template.hasPatientSignature);
      setHasProfessionalSignature(template.hasProfessionalSignature);
      
      // Usar setTimeout para evitar atualizações durante render
      setTimeout(() => {
        form.setFieldsValue({
          title: template.title,
          hasPatientSignature: template.hasPatientSignature,
          hasProfessionalSignature: template.hasProfessionalSignature,
        });
        
        // Atualizar conteúdo do editor
        if (editorRef.current) {
          editorRef.current.innerHTML = template.body;
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
    if (!documentTitle.trim()) {
      messageApi.warning("Por favor, preencha o título do documento");
      return;
    }
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
    onClose();
  };

  // Funções de formatação do editor
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
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    updateContent();
  };

  const documentData = {
    title: documentTitle,
    body: documentBody || "",
    hasPatientSignature,
    hasProfessionalSignature,
    patient,
  };

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
            <Form.Item
              label="Título do Documento"
              name="title"
              rules={[
                { required: true, message: "Por favor, insira o título!" },
              ]}
            >
              <Input
                placeholder="Digite o título do documento"
                value={documentTitle}
                onChange={handleTitleChange}
                size="large"
              />
            </Form.Item>

            {isPrescription && (
              <Form.Item label="Adicionar medicamento">
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  <Space.Compact style={{ width: "100%" }}>
                    <AutoComplete
                      value={medicationSearchValue}
                      options={[
                        ...medicationAutocompleteOptions,
                        ...(showAddCustom
                          ? [{ value: "__create__", label: `Adicionar: "${medicationSearchValue?.trim()}"` }]
                          : []),
                      ]}
                      onSearch={onMedicationSearch}
                      onSelect={(v) => {
                        if (v === "__create__") {
                          handleAddCustomMedication();
                          return;
                        }
                        const opt = medicationAutocompleteOptions.find((o) => String(o.value) === v);
                        if (opt?.medication) handleAddMedication(opt.medication);
                      }}
                      placeholder="Buscar por termo ou apresentação (mín. 2 caracteres)"
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
            )}

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
                  fileName={`${documentTitle || "Documento"}_${dayjs().format("YYYY-MM-DD")}.pdf`}
                  style={{ textDecoration: "none" }}
                >
                  {({ blob, url, loading: pdfLoading, error }) => (
                    <Button
                      type="primary"
                      icon={<FilePdfOutlined />}
                      loading={pdfLoading}
                      disabled={pdfLoading || !documentTitle.trim()}
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
