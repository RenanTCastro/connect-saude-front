import { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Button,
  Form,
  Input,
  Modal,
  Space,
  message,
  DatePicker,
  Upload,
} from "antd";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, FolderOpenOutlined, FileOutlined, DownloadOutlined, InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getEvolutionEntries,
  createEvolutionEntry,
  deleteEvolutionEntry,
  getEvolutionFolder,
} from "../../../services/treatmentService";
import { requestUploadUrl, confirmUpload, getAttachments, getDownloadUrl } from "../../../services/attachmentService";

const { Text } = Typography;
const { TextArea } = Input;

// Helpers
function formatCPF(cpf) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return cpf;
}

function formatPhone(phone) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
}

const formatBirthDate = (dateString) => {
  if (!dateString) return "-";
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
};

export default function InfoTab({ patient, patientId, appointments }) {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [evolutionForm] = Form.useForm();

  const [evolutionEntries, setEvolutionEntries] = useState([]);
  const [loadingEvolution, setLoadingEvolution] = useState(false);
  const [evolutionFolderId, setEvolutionFolderId] = useState(null);
  const [evolutionFile, setEvolutionFile] = useState(null);
  const [submittingEvolution, setSubmittingEvolution] = useState(false);
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [evolutionViewEntry, setEvolutionViewEntry] = useState(null);
  const [evolutionViewAttachments, setEvolutionViewAttachments] = useState([]);
  const [loadingEvolutionView, setLoadingEvolutionView] = useState(false);

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
    fetchEvolution();
  }, [fetchEvolution]);

  const onEvolutionFolderRequest = async () => {
    if (!patientId) return null;
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

  const openEvolutionView = async (entry) => {
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
  };

  const handleOpenAttachment = async (attachmentId) => {
    try {
      const { downloadUrl } = await getDownloadUrl(attachmentId);
      window.open(downloadUrl, "_blank");
    } catch (e) {
      messageApi.error("Erro ao abrir anexo.");
    }
  };

  return (
    <>
      {contextHolder}
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Dados pessoais">
            <p><Text strong>Código do paciente:</Text> {patient?.id}</p>
            <p><Text strong>Nome:</Text> {patient?.full_name}</p>
            <p><Text strong>Número do paciente:</Text> {patient?.patient_number}</p>
            <p><Text strong>CPF:</Text> {formatCPF(patient?.cpf)}</p>
            <p><Text strong>RG:</Text> {patient?.rg || "-"}</p>
            <p><Text strong>Data de nascimento:</Text> {formatBirthDate(patient?.birth_date)}</p> 
            <p><Text strong>Idade:</Text> {patient?.age} anos</p>
            <p><Text strong>Sexo:</Text> {patient?.gender}</p>
            <p><Text strong>Celular:</Text> {formatPhone(patient?.phone)}</p>
            <p><Text strong>CEP:</Text> {patient?.zip_code || "-"}</p>
            <p><Text strong>Endereço:</Text> {patient?.street}</p>
            {patient?.complement && (
              <p><Text strong>Complemento:</Text> {patient.complement}</p>
            )}
            <p><Text strong>Bairro:</Text> {patient?.neighborhood}</p>
            <p><Text strong>Cidade:</Text> {patient?.city} - {patient?.state}</p>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          <Card title="Consultas" style={{ maxHeight: 400, overflowY: "auto" }}>
            {appointments.length === 0 ? (
              <Text type="secondary">Nenhuma consulta registrada.</Text>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: "block", marginBottom: 4 }}>
                        {appt.title || "Consulta"}
                      </Text>
                      <Text style={{ display: "block", marginBottom: 4 }}>
                        {dayjs(appt.start_datetime).format("DD/MM/YYYY [às] HH:mm")}
                      </Text>
                      {appt.description && (
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {appt.description}
                        </Text>
                      )}
                    </div>
                    <Text 
                      type={appt.status === "completed" ? "success" : appt.status === "cancelled" ? "danger" : "default"}
                      style={{ fontSize: 12 }}
                    >
                      {appt.status === "scheduled" ? "Agendada" : 
                       appt.status === "completed" ? "Finalizada" : 
                       appt.status === "cancelled" ? "Cancelada" : 
                       appt.status || "Agendada"}
                    </Text>
                  </div>
                  <Button 
                    type="link" 
                    style={{ padding: 0 }}
                    onClick={() => navigate(`/app/appointment`)}
                  >
                    Ver na agenda
                  </Button>
                  {appt !== appointments[appointments.length - 1] && <Divider style={{ margin: "12px 0 0 0" }} />}
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Dados do Responsável">
            {patient?.responsible_name ? (
              <>
                <p><Text strong>Nome:</Text> {patient?.responsible_name}</p>
                <p><Text strong>CPF:</Text> {formatCPF(patient?.responsible_cpf)}</p>
                <p><Text strong>Telefone:</Text> {formatPhone(patient?.responsible_phone)}</p>
                {patient?.responsible_email && (
                  <p><Text strong>E-mail:</Text> {patient?.responsible_email}</p>
                )}
                {patient?.responsible_relationship && (
                  <p><Text strong>Grau de Parentesco:</Text> {patient?.responsible_relationship}</p>
                )}
              </>
            ) : (
              <Text type="secondary">Nenhum responsável cadastrado.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          <Card title="Plano de Saúde">
            {patient?.plan_card_number || patient?.plan_holder ? (
              <>
                {patient?.plan_card_number && (
                  <p><Text strong>Número da Carteirinha:</Text> {patient?.plan_card_number}</p>
                )}
                {patient?.plan_holder && (
                  <p><Text strong>Titular do Plano:</Text> {patient?.plan_holder}</p>
                )}
                {patient?.plan_document && (
                  <p><Text strong>Documento do Titular:</Text> {patient?.plan_document}</p>
                )}
                {patient?.observations && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Observações:</Text>
                    <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{patient?.observations}</p>
                  </div>
                )}
              </>
            ) : (
              <Text type="secondary">Nenhuma informação de plano cadastrada.</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
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
              {loadingEvolution ? (
                <Text type="secondary">Carregando evolução...</Text>
              ) : evolutionEntries.length === 0 ? (
                <Text type="secondary">Nenhuma evolução registrada.</Text>
              ) : (
                evolutionEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    size="small"
                    style={{ textAlign: "left", cursor: "pointer" }}
                    onClick={() => openEvolutionView(entry)}
                  >
                    <Text type="secondary">{dayjs(entry.occurred_at).format("DD/MM/YYYY")}</Text>
                    <div style={{ marginTop: 4 }}>
                      {entry.content ? `${entry.content.slice(0, 80)}${entry.content.length > 80 ? "…" : ""}` : "—"}
                    </div>
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
                ))
              )}
            </Space>
          </Card>
        </Col>
      </Row>

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
    </>
  );
}
