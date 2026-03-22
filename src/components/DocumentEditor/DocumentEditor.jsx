import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Button,
  Space,
  Typography,
  message,
  AutoComplete,
  Tag,
  DatePicker,
  TimePicker,
  Radio,
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
import api from "../../services/api";
import DocumentPDF from "../DocumentPDF/DocumentPDF";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
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
  budget = null,
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
  const lastBudgetIdRef = useRef(null);
  const templateBodyRef = useRef("");
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
  const [certificateEndereco, setCertificateEndereco] = useState("");
  const [certificateHoraInicio, setCertificateHoraInicio] = useState(
    () => dayjs().set("hour", 8).set("minute", 0).set("second", 0)
  );
  const [certificateHoraFim, setCertificateHoraFim] = useState(
    () => dayjs().set("hour", 9).set("minute", 0).set("second", 0)
  );
  const [certificateData, setCertificateData] = useState(dayjs());
  const [certificateDiasRepouso, setCertificateDiasRepouso] = useState(null);
  const [certificateLocal, setCertificateLocal] = useState("");

  // Termo de consentimento
  const [consentPatientName, setConsentPatientName] = useState("");
  const [consentDocumento, setConsentDocumento] = useState("");
  const [consentResponsavel, setConsentResponsavel] = useState("");
  const [consentNomeDentista, setConsentNomeDentista] = useState("");
  const [consentProcedimento, setConsentProcedimento] = useState("");
  const [consentRiscos, setConsentRiscos] = useState("");
  const [consentAutorizaImagem, setConsentAutorizaImagem] = useState(null);
  const [consentLocal, setConsentLocal] = useState("");
  const [consentData, setConsentData] = useState(dayjs());

  const isPrescription = documentType === DOCUMENT_TYPES.PRESCRIPTION;
  const isCertificate = documentType === DOCUMENT_TYPES.CERTIFICATE;
  const isConsent = documentType === DOCUMENT_TYPES.CONSENT;
  const isStructuredForm = isPrescription || isCertificate || isConsent;

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
      lastBudgetIdRef.current = null;
      templateBodyRef.current = "";
      return;
    }

    const budgetId = budget?.id ?? null;
    const shouldReload =
      documentType &&
      (lastDocumentTypeRef.current !== documentType || lastBudgetIdRef.current !== budgetId);

    if (shouldReload) {
      setSelectedMedications([]);
      const template = getDocumentTemplate(documentType, patient, budget);

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
        setCertificateEndereco(template.defaultEndereco ?? "");
        setCertificateHoraInicio(
          template.defaultHoraInicio ??
            dayjs().set("hour", 8).set("minute", 0).set("second", 0)
        );
        setCertificateHoraFim(
          template.defaultHoraFim ??
            dayjs().set("hour", 9).set("minute", 0).set("second", 0)
        );
        setCertificateData(template.defaultData ?? dayjs());
        setCertificateDiasRepouso(template.defaultDiasRepouso ?? null);
        setCertificateLocal(template.defaultLocal ?? "");
      }

      if (isConsent) {
        setConsentPatientName(template.defaultPatientName ?? "");
        setConsentDocumento(template.defaultDocumento ?? "");
        setConsentResponsavel(template.defaultResponsavel ?? "");
        setConsentNomeDentista(template.defaultNomeDentista ?? "");
        setConsentProcedimento(template.defaultProcedimento ?? "");
        setConsentRiscos(template.defaultRiscos ?? "");
        setConsentAutorizaImagem(template.defaultAutorizaImagem ?? null);
        setConsentLocal(template.defaultLocal ?? "");
        setConsentData(template.defaultData ?? dayjs());
        api
          .get("/me")
          .then((res) => {
            if (res.data?.name) {
              setConsentNomeDentista(res.data.name);
            }
          })
          .catch(() => {});
      }

      if (!isStructuredForm) {
        const body = template.body ?? "";
        templateBodyRef.current = body;
        setDocumentBody(body);
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
      lastBudgetIdRef.current = budgetId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, documentType, budget]);

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
    setCertificateEndereco("");
    setCertificateHoraInicio(
      dayjs().set("hour", 8).set("minute", 0).set("second", 0)
    );
    setCertificateHoraFim(
      dayjs().set("hour", 9).set("minute", 0).set("second", 0)
    );
    setCertificateData(dayjs());
    setCertificateDiasRepouso(null);
    setCertificateLocal("");
    setConsentPatientName("");
    setConsentDocumento("");
    setConsentResponsavel("");
    setConsentNomeDentista("");
    setConsentProcedimento("");
    setConsentRiscos("");
    setConsentAutorizaImagem(null);
    setConsentLocal("");
    setConsentData(dayjs());
    onClose();
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  /** Remove estilo vermelho de placeholders que foram preenchidos (texto não é mais [CAMPO]) */
  const normalizeFilledPlaceholders = useCallback(() => {
    if (!editorRef.current) return;
    const placeholders = editorRef.current.querySelectorAll(".doc-placeholder-unfilled");
    placeholders.forEach((el) => {
      const text = el.textContent?.trim() ?? "";
      if (text && !/^\[.+\]$/.test(text)) {
        el.classList.remove("doc-placeholder-unfilled");
      }
    });
  }, []);

  const handleEditorInput = () => {
    normalizeFilledPlaceholders();
    updateContent();
  };

  const handleEditorPaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
    normalizeFilledPlaceholders();
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
      const patientName =
        certificatePatientName || patient?.full_name || "[NOME]";
      const cpf = certificateCpf || patient?.cpf || "[CPF]";
      const endereco = certificateEndereco || (patient?.street
        ? [patient.street, patient.complement, patient.neighborhood, patient.city, patient.state]
            .filter(Boolean)
            .join(", ")
        : "[ENDEREÇO]");
      const horaInicio = certificateHoraInicio?.isValid?.()
        ? certificateHoraInicio.format("HH:mm")
        : "08:00";
      const horaFim = certificateHoraFim?.isValid?.()
        ? certificateHoraFim.format("HH:mm")
        : "09:00";
      const dataStr = certificateData?.isValid?.()
        ? certificateData.format("DD/MM/YYYY")
        : dayjs().format("DD/MM/YYYY");
      const local = certificateLocal || "";
      const diasRepouso = certificateDiasRepouso;

      let texto = `Atesto, para os devidos fins, que o(a) Sr(a). ${escapeHtml(patientName)}, portador(a) do CPF ${escapeHtml(cpf)}, residente à ${escapeHtml(endereco)}, esteve sob meus cuidados profissionais no período das ${horaInicio} às ${horaFim} do dia ${dataStr}`;
      if (diasRepouso != null && diasRepouso > 0) {
        texto += `, necessitando de ${diasRepouso} dias de repouso, a partir desta data`;
      }
      texto += ".";

      let body = `<p>${texto}</p>`;
      const localDataStr = local
        ? `${escapeHtml(local)}, ${dataStr}`
        : dataStr;
      body += `<p><strong>${escapeHtml(localDataStr)}</strong></p>`;
      return body;
    }

    if (isConsent) {
      const paciente = consentPatientName || patient?.full_name || "[NOME COMPLETO]";
      const doc = consentDocumento || patient?.cpf || "[000.000.000-00]";
      const resp = consentResponsavel || " - ";
      const dentista = consentNomeDentista || "[Nome do Dentista]";
      const procedimento = consentProcedimento || "";
      const riscos = consentRiscos || "";
      const local = consentLocal || "[Cidade/UF]";
      const dataObj = consentData?.isValid?.() ? consentData : dayjs();
      const dataDia = dataObj.format("DD");
      const dataMes = dataObj.locale("pt-br").format("MMMM");
      const dataAno = dataObj.format("YYYY");

      let body = `<h2>Termo de Consentimento Livre e Esclarecido</h2>`;

      body += `<h3>1. Identificação</h3>`;
      body += `<p><strong>Paciente:</strong> ${escapeHtml(paciente)}</p>`;
      body += `<p><strong>Documento (CPF/RG):</strong> ${escapeHtml(doc)}</p>`;
      body += `<p><strong>Responsável Legal (se aplicável):</strong> ${escapeHtml(resp)}</p>`;

      body += `<h3>2. Descrição do Procedimento</h3>`;
      body += `<p>Eu, acima identificado(a), autorizo o(a) Dr(a). ${escapeHtml(dentista)} e sua equipe assistente a realizar o seguinte procedimento/tratamento:</p>`;
      body += `<p><strong>Procedimento:</strong></p>`;
      body += procedimento ? textToHtmlParagraphs(procedimento) : `<p><em>(Espaço para o dentista descrever o tratamento de forma clara)</em></p>`;

      body += `<h3>3. Esclarecimentos e Riscos</h3>`;
      body += `<p>Fui devidamente informado(a) sobre a natureza do tratamento, seus objetivos e os riscos inerentes, tais como:</p>`;
      body += riscos ? textToHtmlParagraphs(riscos) : `<p><em>[Campo editável para riscos específicos: ex: edema, sensibilidade, sangramento, etc.]</em></p>`;
      body += `<p>Compreendo que, durante o ato operatório, situações imprevistas podem exigir procedimentos complementares aos inicialmente planejados.</p>`;

      body += `<h3>4. Responsabilidades do Paciente</h3>`;
      body += `<p>Estou ciente de que o sucesso do tratamento depende diretamente do cumprimento das orientações pós-operatórias e da manutenção da higiene bucal conforme prescrito. Comprometo-me a:</p>`;
      body += `<p>Informar fielmente meu histórico de saúde e uso de medicamentos.</p>`;
      body += `<p>Comparecer às consultas de retorno agendadas.</p>`;

      body += `<h3>5. Autorização de Uso de Imagem (Opcional)</h3>`;
      const marcarAutorizo = consentAutorizaImagem === true ? "X" : " ";
      const marcarNaoAutorizo = consentAutorizaImagem === false ? "X" : " ";
      body += `<p>( ${marcarAutorizo} ) Autorizo | ( ${marcarNaoAutorizo} ) Não autorizo o uso de fotografias ou radiografias do meu tratamento para fins de prontuário, estudos científicos ou documentação clínica, preservando sempre minha identidade.</p>`;

      body += `<h3>6. Declaração de Consentimento</h3>`;
      body += `<p>Declaro que tive a oportunidade de esclarecer todas as minhas dúvidas e que compreendo as informações aqui contidas. Por livre vontade, consinto com o tratamento proposto.</p>`;
      body += `<p><strong>Local e Data:</strong> ${escapeHtml(local)}, ${escapeHtml(dataDia)} de ${escapeHtml(dataMes)} de ${escapeHtml(dataAno)}.</p>`;

      return body;
    }

    const editorHtml = editorRef.current?.innerHTML?.trim();
    const body = editorHtml || documentBody || templateBodyRef.current;
    return body || "";
  }, [
    isPrescription,
    isCertificate,
    isConsent,
    patient,
    prescriptionText,
    showOrientacoes,
    orientacoesText,
    certificatePatientName,
    certificateCpf,
    certificateEndereco,
    certificateHoraInicio,
    certificateHoraFim,
    certificateData,
    certificateDiasRepouso,
    certificateLocal,
    consentPatientName,
    consentDocumento,
    consentResponsavel,
    consentNomeDentista,
    consentProcedimento,
    consentRiscos,
    consentAutorizaImagem,
    consentLocal,
    consentData,
    documentBody,
  ]);

  const getPdfFileName = () => {
    const base =
      documentTitle.trim() ||
      (isPrescription
        ? "Receituario"
        : isCertificate
          ? "Atestado"
          : isConsent
            ? "Termo_Consentimento"
            : "Documento");
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
      <Form.Item label="Nome do paciente">
        <Input
          value={certificatePatientName}
          onChange={(e) => setCertificatePatientName(e.target.value)}
          placeholder="Nome completo"
        />
      </Form.Item>

      <Form.Item label="CPF">
        <Input
          value={certificateCpf}
          onChange={(e) => setCertificateCpf(e.target.value)}
          placeholder="CPF do paciente"
        />
      </Form.Item>

      <Form.Item label="Endereço">
        <Input
          value={certificateEndereco}
          onChange={(e) => setCertificateEndereco(e.target.value)}
          placeholder="Endereço completo (rua, número, bairro, cidade)"
        />
      </Form.Item>

      <Form.Item label="Período">
        <Space.Compact style={{ width: "100%" }}>
          <TimePicker
            value={certificateHoraInicio}
            onChange={(t) => setCertificateHoraInicio(t || dayjs().set("hour", 8).set("minute", 0))}
            format="HH:mm"
            placeholder="Hora início"
            style={{ flex: 1 }}
          />
          <TimePicker
            value={certificateHoraFim}
            onChange={(t) => setCertificateHoraFim(t || dayjs().set("hour", 9).set("minute", 0))}
            format="HH:mm"
            placeholder="Hora fim"
            style={{ flex: 1 }}
          />
        </Space.Compact>
      </Form.Item>

      <Form.Item
        label="Dias de repouso"
        extra="Opcional. Se preenchido, inclui necessidade de repouso no atestado."
      >
        <InputNumber
          value={certificateDiasRepouso}
          onChange={setCertificateDiasRepouso}
          placeholder="Ex: 3"
          min={1}
          max={365}
          style={{ width: 120 }}
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
            placeholder="Data"
          />
        </Space.Compact>
      </Form.Item>
    </>
  );

  const renderConsentForm = () => (
    <>
      <Form.Item label="Nome do paciente">
        <Input
          value={consentPatientName}
          onChange={(e) => setConsentPatientName(e.target.value)}
          placeholder="Nome completo"
        />
      </Form.Item>

      <Form.Item label="Documento (CPF/RG)">
        <Input
          value={consentDocumento}
          onChange={(e) => setConsentDocumento(e.target.value)}
          placeholder="000.000.000-00"
        />
      </Form.Item>

      <Form.Item
        label="Responsável legal"
        extra="Opcional. Preencher quando aplicável (menores, tutelados)."
      >
        <Input
          value={consentResponsavel}
          onChange={(e) => setConsentResponsavel(e.target.value)}
          placeholder="Nome do Responsável"
        />
      </Form.Item>

      <Form.Item label="Nome do dentista">
        <Input
          value={consentNomeDentista}
          onChange={(e) => setConsentNomeDentista(e.target.value)}
          placeholder="Dr(a). Nome do Dentista"
        />
      </Form.Item>

      <Form.Item
        label="Procedimento"
        extra="Descreva o tratamento de forma clara para o paciente."
      >
        <TextArea
          value={consentProcedimento}
          onChange={(e) => setConsentProcedimento(e.target.value)}
          placeholder="Ex: restauração em resina no elemento 16, canal em 2 sessões..."
          rows={4}
          maxLength={TEXTAREA_MAX_LENGTH}
          showCount
        />
      </Form.Item>

      <Form.Item
        label="Riscos específicos"
        extra="Ex: edema, sensibilidade, sangramento, etc."
      >
        <TextArea
          value={consentRiscos}
          onChange={(e) => setConsentRiscos(e.target.value)}
          placeholder="Ex: edema, sensibilidade, sangramento, dor pós-operatória..."
          rows={4}
          maxLength={TEXTAREA_MAX_LENGTH}
          showCount
        />
      </Form.Item>

      <Form.Item
        label="Autorização de uso de imagem"
        extra="Fotografias ou radiografias para prontuário, estudos científicos ou documentação clínica."
      >
        <Radio.Group
          value={consentAutorizaImagem}
          onChange={(e) => setConsentAutorizaImagem(e.target.value)}
        >
          <Radio value={true}>Autorizo</Radio>
          <Radio value={false}>Não autorizo</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="Local e data">
        <Space.Compact style={{ width: "100%" }}>
          <Input
            value={consentLocal}
            onChange={(e) => setConsentLocal(e.target.value)}
            placeholder="Cidade/UF (ex: São Paulo/SP)"
            style={{ flex: 1 }}
          />
          <DatePicker
            value={consentData}
            onChange={(d) => setConsentData(d || dayjs())}
            format="DD/MM/YYYY"
            placeholder="Data"
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
            {isConsent && renderConsentForm()}
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
