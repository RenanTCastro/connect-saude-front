import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Spin,
  message,
  Alert,
  Divider,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Upload,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  StopOutlined,
  CheckOutlined,
  UserOutlined,
  PictureOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import { requestLogoUploadUrl, getLogoUrl, deleteLogo } from "../../services/profileService";
import "./Styles.css";

const { Title, Text, Paragraph } = Typography;

const MAX_LOGO_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const WhatsAppIcon = ({ size = 24, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function Settings() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form] = Form.useForm();
  const namePreview = Form.useWatch("name", form);

  // Verificar status da assinatura ao carregar
  useEffect(() => {
    fetchSubscriptionStatus();
    fetchProfile();
    
    // Verificar se veio redirecionado do Stripe
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    const canceled = urlParams.get("canceled");

    if (sessionId) {
      messageApi.success("Pagamento processado com sucesso!");
      // Limpar URL
      window.history.replaceState({}, document.title, "/settings");
      // Atualizar status
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    } else if (canceled) {
      messageApi.warning("Pagamento cancelado. Você pode tentar novamente quando quiser.");
      window.history.replaceState({}, document.title, "/settings");
    }
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscription/status");
      setSubscriptionStatus(res.data);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar status da assinatura");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await api.get("/me");
      setProfile(res.data);
      form.setFieldsValue({
        name: res.data.name ?? "",
        address: res.data.address ?? "",
        cro_number: res.data.cro_number ?? "",
        professional_phone: res.data.professional_phone ?? "",
        specialty: res.data.specialty ?? "",
      });
      if (res.data?.logo_s3_key) {
        try {
          const logoRes = await getLogoUrl();
          setLogoUrl(logoRes.url);
        } catch {
          setLogoUrl(null);
        }
      } else {
        setLogoUrl(null);
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar dados do perfil");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      setSavingProfile(true);
      const res = await api.put("/me", {
        name: values.name,
        address: values.address || null,
        cro_number: values.cro_number || null,
        professional_phone: values.professional_phone || null,
        specialty: values.specialty || null,
      });

      if (res.data?.user) {
        setProfile(res.data.user);
      }

      messageApi.success(res.data?.message || "Informações atualizadas com sucesso!");
    } catch (err) {
      console.error(err);
      const errorMessage =
        err.response?.data?.error || "Erro ao atualizar informações do perfil";
      messageApi.error(errorMessage);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoUpload = async (file) => {
    if (file.size > MAX_LOGO_SIZE) {
      messageApi.error("Arquivo muito grande! O tamanho máximo permitido é 15MB.");
      return false;
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      messageApi.error("Formato não permitido. Use JPEG, PNG ou WebP.");
      return false;
    }

    setUploadingLogo(true);
    try {
      const { uploadUrl, s3Key } = await requestLogoUploadUrl(file);

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "image/jpeg" },
      });

      if (!uploadRes.ok) {
        throw new Error("Falha no upload");
      }

      await api.put("/me", {
        name: form.getFieldValue("name"),
        address: form.getFieldValue("address") || null,
        cro_number: form.getFieldValue("cro_number") || null,
        professional_phone: form.getFieldValue("professional_phone") || null,
        specialty: form.getFieldValue("specialty") || null,
        logo_s3_key: s3Key,
      });

      const profileRes = await api.get("/me");
      setProfile(profileRes.data);
      const logoRes = await getLogoUrl();
      setLogoUrl(logoRes.url);
      messageApi.success("Logo atualizada com sucesso!");
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao fazer upload da logo");
    } finally {
      setUploadingLogo(false);
    }
    return false; // Prevent default upload behavior
  };

  const handleLogoRemove = async () => {
    try {
      await deleteLogo();
      setLogoUrl(null);
      setProfile((p) => (p ? { ...p, logo_s3_key: null } : null));
      messageApi.success("Logo removida com sucesso!");
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao remover logo");
    }
  };

  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/subscription/checkout");
      
      if (res.data.url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = res.data.url;
      } else {
        messageApi.error("Erro ao criar sessão de checkout");
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao iniciar processo de assinatura");
      setProcessing(false);
    }
  };

  const handleCancelSubscription = () => {
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/subscription/cancel");
      const isTrialing = subscriptionStatus?.status === "trialing";
      
      if (isTrialing) {
        messageApi.success("Renovação automática cancelada. Seu período de teste não será renovado.");
      } else {
        messageApi.success(res.data.message || "Assinatura cancelada com sucesso. Você terá acesso até o final do período atual.");
      }
      
      setIsCancelModalOpen(false);
      
      // Atualizar status após alguns segundos
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao cancelar assinatura");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelModal = () => {
    setIsCancelModalOpen(false);
  };

  const handleReactivateSubscription = async () => {
    try {
      setProcessing(true);
      const res = await api.post("/subscription/reactivate");
      messageApi.success(res.data.message || "Assinatura reativada com sucesso!");
      
      // Atualizar status após alguns segundos
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao reativar assinatura");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: "success", text: "Ativa", icon: <CheckCircleOutlined /> },
      trialing: { color: "processing", text: "Período de Teste", icon: <CheckCircleOutlined /> },
      inactive: { color: "default", text: "Inativa", icon: <CloseCircleOutlined /> },
      canceled: { color: "error", text: "Cancelada", icon: <CloseCircleOutlined /> },
      past_due: { color: "warning", text: "Vencida", icon: <CloseCircleOutlined /> },
    };

    const config = statusConfig[status] || statusConfig.inactive;
    return (
      <Tag color={config.color} icon={config.icon} style={{ fontSize: "14px", padding: "4px 12px" }}>
        {config.text}
      </Tag>
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return dayjs(date).format("DD/MM/YYYY");
  };

  return (
    <div className="settings-container">
      {contextHolder}
      
      <Modal
        title={subscriptionStatus?.status === "trialing" ? "Cancelar Renovação Automática" : "Cancelar Assinatura"}
        open={isCancelModalOpen}
        onOk={handleConfirmCancel}
        onCancel={handleCancelModal}
        okText="Sim, cancelar"
        cancelText="Não"
        okButtonProps={{ danger: true }}
        confirmLoading={processing}
      >
        <div>
          {subscriptionStatus?.status === "trialing" ? (
            <>
              <p>Tem certeza que deseja cancelar a renovação automática?</p>
              <p style={{ marginTop: "8px", color: "#666" }}>
                Seu período de teste gratuito expira em <strong>{formatDate(subscriptionStatus?.endDate)}</strong> e não será renovado automaticamente.
                Você continuará tendo acesso completo até essa data.
              </p>
            </>
          ) : (
            <>
              <p>Tem certeza que deseja cancelar sua assinatura?</p>
              <p style={{ marginTop: "8px", color: "#666" }}>
                Sua assinatura será cancelada ao final do período atual ({formatDate(subscriptionStatus?.endDate)}).
                Você continuará tendo acesso até esta data.
              </p>
            </>
          )}
        </div>
      </Modal>

      <Title level={2}>Configurações</Title>

      <Card
        title={
          <Space>
            <UserOutlined />
            <span>Informações do profissional / clínica</span>
          </Space>
        }
        style={{ marginBottom: "24px" }}
      >
        <Paragraph type="secondary" style={{ marginBottom: "16px" }}>
          Este nome será usado nos lembretes enviados via WhatsApp para seus clientes.
        </Paragraph>

        {profileLoading ? (
          <div style={{ textAlign: "center", padding: "16px" }}>
            <Spin />
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            initialValues={{
              name: profile?.name ?? "",
              address: profile?.address ?? "",
              cro_number: profile?.cro_number ?? "",
              professional_phone: profile?.professional_phone ?? "",
              specialty: profile?.specialty ?? "",
            }}
          >
            <Row gutter={24}>
              <Col xs={24} lg={12}>
                <Form.Item
                  name="name"
                  label="Nome do profissional ou clínica"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira o nome que será exibido para os pacientes!",
                    },
                  ]}
                >
                  <Input placeholder="Nome do profissional ou clínica" maxLength={200} />
                </Form.Item>

                <Form.Item name="address" label="Endereço de atendimento">
                  <Input.TextArea placeholder="Endereço completo (rua, número, bairro, cidade)" rows={3} maxLength={500} showCount />
                </Form.Item>

                <Form.Item name="cro_number" label="Número do CRO">
                  <Input placeholder="Ex: 12345-SP" maxLength={50} />
                </Form.Item>

                <Form.Item name="professional_phone" label="Telefone profissional">
                  <Input placeholder="(11) 99999-9999" maxLength={20} />
                </Form.Item>

                <Form.Item name="specialty" label="Especialidade">
                  <Input placeholder="Ex: Ortodontia" maxLength={100} />
                </Form.Item>

                <Form.Item label="Logo da clínica">
                  <Space direction="vertical" size="small">
                    {logoUrl ? (
                      <Space align="center">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          style={{ maxWidth: 120, maxHeight: 120, objectFit: "contain", borderRadius: 8, border: "1px solid #d9d9d9" }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={handleLogoRemove}
                          loading={uploadingLogo}
                        >
                          Remover logo
                        </Button>
                      </Space>
                    ) : (
                      <Upload
                        accept="image/jpeg,image/png,image/webp"
                        showUploadList={false}
                        beforeUpload={handleLogoUpload}
                        maxCount={1}
                      >
                        <Button icon={<PictureOutlined />} loading={uploadingLogo}>
                          Enviar logo (máx. 15MB)
                        </Button>
                      </Upload>
                    )}
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Formatos: JPEG, PNG ou WebP. Tamanho máximo: 15MB.
                    </Text>
                  </Space>
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={savingProfile}>
                  Salvar alterações
                </Button>
              </Col>
              <Col xs={24} lg={12}>
                <Paragraph type="secondary" style={{ marginBottom: "8px", fontSize: "13px" }}>
                  Prévia nas notificações WhatsApp:
                </Paragraph>
                <div className="whatsapp-mockup-container">
                  <div className="whatsapp-mockup">
                    <div className="whatsapp-mockup-header">
                      <div className="whatsapp-mockup-contact">
                        <WhatsAppIcon size={20} color="#ffffff" />
                        <div className="whatsapp-mockup-contact-info">
                          <Text strong style={{ color: "#ffffff" }}>Connect Saúde</Text>
                          <Text style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.9)" }}>online</Text>
                        </div>
                      </div>
                    </div>
                    <div className="whatsapp-mockup-messages">
                      <div className="whatsapp-message whatsapp-message-received">
                        <div className="whatsapp-message-bubble">
                          <Text>
                            Olá, [Nome do paciente].
                            <br />
                            <br />
                            Sua consulta está confirmada para dia 15/03/2024 às 14:00, na{" "}
                            {namePreview?.trim() || "Seu nome ou clínica"}.
                            <br />
                            <br />
                            Em caso de dúvidas ou necessidade de reagendamento, entre em contato com seu profissional de saúde.
                          </Text>
                        </div>
                        <Text type="secondary" className="whatsapp-message-time">10:30</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        )}
      </Card>

      <Card
        title={
          <Space>
            <CreditCardOutlined />
            <span>Assinatura</span>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSubscriptionStatus}
            loading={loading}
          >
            Atualizar
          </Button>
        }
        style={{ marginBottom: "24px" }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <Spin size="large" />
            <div style={{ marginTop: "16px" }}>
              <Text>Carregando informações da assinatura...</Text>
            </div>
          </div>
        ) : subscriptionStatus?.hasSubscription && (subscriptionStatus?.status === "active" || subscriptionStatus?.status === "trialing") ? (
          <>
            {subscriptionStatus?.status === "trialing" && !subscriptionStatus?.cancelAtPeriodEnd ? (
              <Alert
                message="Período de teste ativo"
                description={`Você está no período de teste gratuito de 7 dias. Seu teste expira em ${formatDate(subscriptionStatus.endDate)}. Após essa data, você será cobrado automaticamente.`}
                type="info"
                showIcon
                style={{ marginBottom: "24px" }}
              />
            ) : subscriptionStatus?.status === "trialing" && subscriptionStatus?.cancelAtPeriodEnd ? (
              <Alert
                message="Período de teste ativo"
                description={`Você está no período de teste gratuito de 7 dias. Seu teste expira em ${formatDate(subscriptionStatus.endDate)} e não será renovado. Você continuará tendo acesso até essa data.`}
                type="info"
                showIcon
                style={{ marginBottom: "24px" }}
              />
            ) : subscriptionStatus?.cancelAtPeriodEnd ? (
              <Alert
                message="Assinatura será cancelada"
                description={`Sua assinatura está ativa, mas será cancelada em ${formatDate(subscriptionStatus.endDate)}. Você pode reativar antes desta data.`}
                type="warning"
                showIcon
                style={{ marginBottom: "24px" }}
              />
            ) : (
              <Alert
                message="Sua assinatura está ativa"
                description="Você tem acesso completo a todas as funcionalidades do sistema."
                type="success"
                showIcon
                style={{ marginBottom: "24px" }}
              />
            )}

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text strong>Status: </Text>
                {getStatusTag(subscriptionStatus.status)}
              </div>

              <Divider style={{ margin: "16px 0" }} />

              <div>
                <Text strong>Data de início: </Text>
                <Text>{formatDate(subscriptionStatus.startDate)}</Text>
              </div>

              <div>
                <Text strong>
                  {subscriptionStatus?.status === "trialing" 
                    ? "Data de expiração do teste: " 
                    : subscriptionStatus?.cancelAtPeriodEnd 
                    ? "Data de expiração: " 
                    : "Próxima renovação: "}
                </Text>
                <Text>{formatDate(subscriptionStatus.endDate)}</Text>
              </div>

              {subscriptionStatus.subscriptionId && (
                <div>
                  <Text strong>ID da assinatura: </Text>
                  <Text code style={{ fontSize: "12px" }}>
                    {subscriptionStatus.subscriptionId.substring(0, 20)}...
                  </Text>
                </div>
              )}

              <Divider style={{ margin: "16px 0" }} />

              {subscriptionStatus?.cancelAtPeriodEnd ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckOutlined />}
                    onClick={handleReactivateSubscription}
                    loading={processing}
                    block
                  >
                    {subscriptionStatus?.status === "trialing" ? "Ativar Renovação Automática" : "Reativar Assinatura"}
                  </Button>
                  <Paragraph type="secondary" style={{ textAlign: "center", marginTop: "8px", fontSize: "12px" }}>
                    {subscriptionStatus?.status === "trialing"
                      ? `Ative a renovação automática para continuar usando após ${formatDate(subscriptionStatus?.endDate)}.`
                      : `Reative sua assinatura para continuar usando após ${formatDate(subscriptionStatus?.endDate)}.`}
                  </Paragraph>
                </>
              ) : (
                <>
                  <Button
                    danger
                    size="large"
                    icon={<StopOutlined />}
                    onClick={handleCancelSubscription}
                    loading={processing}
                    block
                  >
                    {subscriptionStatus?.status === "trialing" ? "Cancelar Renovação Automática" : "Cancelar Assinatura"}
                  </Button>
                  <Paragraph type="secondary" style={{ textAlign: "center", marginTop: "8px", fontSize: "12px" }}>
                    {subscriptionStatus?.status === "trialing"
                      ? `Seu período de teste não será renovado e expirará em ${formatDate(subscriptionStatus?.endDate)}.`
                      : `Ao cancelar, você continuará tendo acesso até ${formatDate(subscriptionStatus?.endDate)}.`}
                  </Paragraph>
                </>
              )}
            </Space>
          </>
        ) : (
          <>
            <Alert
              message="Assinatura não ativa"
              description={
                subscriptionStatus?.status === "canceled"
                  ? "Sua assinatura foi cancelada. Assine novamente para continuar usando o sistema."
                  : "Você ainda não possui uma assinatura ativa. Clique no botão abaixo para assinar e ter acesso a todas as funcionalidades."
              }
              type="info"
              showIcon
              style={{ marginBottom: "24px" }}
            />

            {subscriptionStatus?.status === "past_due" && (
              <Alert
                message="Pagamento pendente"
                description="Seu último pagamento não foi processado. Renove sua assinatura para continuar usando o sistema."
                type="warning"
                showIcon
                style={{ marginBottom: "24px" }}
              />
            )}

            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Text strong>Status: </Text>
                {getStatusTag(subscriptionStatus?.status || "inactive")}
              </div>

              {subscriptionStatus?.endDate && (
                <div>
                  <Text strong>Data de expiração: </Text>
                  <Text>{formatDate(subscriptionStatus.endDate)}</Text>
                </div>
              )}

              <Divider style={{ margin: "16px 0" }} />

              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handleSubscribe}
                loading={processing}
                block
              >
                {subscriptionStatus?.status === "canceled" || subscriptionStatus?.status === "past_due"
                  ? "Renovar Assinatura"
                  : "Assinar Agora"}
              </Button>

              <Paragraph type="secondary" style={{ textAlign: "center", marginTop: "16px" }}>
                Você será redirecionado para o Stripe para concluir o pagamento de forma segura.
              </Paragraph>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
}
