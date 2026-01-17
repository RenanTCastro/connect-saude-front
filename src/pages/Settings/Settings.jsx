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
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  ReloadOutlined,
  StopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import "./Styles.css";

const { Title, Text, Paragraph } = Typography;

export default function Settings() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Verificar status da assinatura ao carregar
  useEffect(() => {
    fetchSubscriptionStatus();
    
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>
          <Text>Carregando informações da assinatura...</Text>
        </div>
      </div>
    );
  }

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
        {subscriptionStatus?.hasSubscription && (subscriptionStatus?.status === "active" || subscriptionStatus?.status === "trialing") ? (
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
