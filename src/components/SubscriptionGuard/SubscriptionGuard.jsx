import { useState, useEffect } from "react";
import { Modal, Button, Typography, Alert } from "antd";
import { CreditCardOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import dayjs from "dayjs";

const { Title, Paragraph, Text } = Typography;

export default function SubscriptionGuard({ children }) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  // Garantir que modal seja exibido quando não tem acesso
  useEffect(() => {
    if (!loading && !hasAccess) {
      setIsModalVisible(true);
    }
  }, [hasAccess, loading]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscription/status");
      const status = res.data;

      setSubscriptionStatus(status);

      // Verificar se tem acesso - usar hasAccess do backend
      let access = status.hasAccess === true;
      
      // Se status é canceled, SEMPRE sem acesso (não verificar data)
      if (status.status === "canceled") {
        access = false;
      }
      
      // Se não tem subscription ou está inactive, sem acesso
      if (!status.hasSubscription || status.status === "inactive") {
        access = false;
      }

      setHasAccess(access);

      // Se não tiver acesso, mostrar modal
      if (!access) {
        setIsModalVisible(true);
      } else {
        setIsModalVisible(false);
      }
    } catch (err) {
      console.error("Erro ao verificar assinatura:", err);
      // Em caso de erro, permitir acesso temporariamente para não bloquear completamente
      setHasAccess(true);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const res = await api.post("/subscription/checkout");
      
      if (res.data.url) {
        // Redirecionar para o checkout do Stripe
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Erro ao criar sessão de checkout:", err);
    }
  };

  const handleGoToSettings = () => {
    setIsModalVisible(false);
    navigate("/app/settings");
  };

  // Durante carregamento, não bloquear
  if (loading) {
    return children;
  }

  // Se não tiver acesso, mostrar apenas o modal (children ficam bloqueados visualmente)
  // Sempre renderizar o modal se não tiver acesso, independente do estado isModalVisible
  const shouldShowModal = !hasAccess;
  
  if (!hasAccess) {
    return (
      <>
        {children}
        <Modal
          title={
            <div style={{ textAlign: "center" }}>
              <LockOutlined style={{ fontSize: "48px", color: "#ff4d4f", marginBottom: "16px" }} />
              <Title level={3} style={{ margin: 0 }}>
                Acesso Restrito
              </Title>
            </div>
          }
          open={shouldShowModal || isModalVisible}
          onCancel={() => {}} // Não permitir fechar clicando fora
          closable={false}
          maskClosable={false}
          footer={null}
          width={600}
          centered
        >
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            {subscriptionStatus?.status === "canceled" && subscriptionStatus?.endDate ? (
              <>
                {subscriptionStatus?.isTrialing ? (
                  <>
                    <Alert
                      message="Período de teste expirado"
                      description={
                        <>
                          <p>
                            Seu período de teste gratuito de 7 dias expirou em{" "}
                            <strong>{dayjs(subscriptionStatus.endDate).format("DD/MM/YYYY")}</strong>.
                          </p>
                          <p style={{ marginTop: "12px", marginBottom: 0 }}>
                            Para continuar usando o sistema, é necessário assinar agora.
                          </p>
                        </>
                      }
                      type="warning"
                      showIcon
                      style={{ marginBottom: "24px", textAlign: "left" }}
                    />
                  </>
                ) : (
                  <>
                    <Alert
                      message="Sua assinatura expirou"
                      description={
                        <>
                          <p>
                            Sua assinatura foi cancelada e expirou em{" "}
                            <strong>{dayjs(subscriptionStatus.endDate).format("DD/MM/YYYY")}</strong>.
                          </p>
                          <p style={{ marginTop: "12px", marginBottom: 0 }}>
                            Para continuar usando o sistema, é necessário renovar sua assinatura.
                          </p>
                        </>
                      }
                      type="error"
                      showIcon
                      style={{ marginBottom: "24px", textAlign: "left" }}
                    />
                    <Paragraph>
                      Você não pode mais usar os 7 dias grátis. Por favor, renove sua assinatura para continuar.
                    </Paragraph>
                  </>
                )}
              </>
            ) : subscriptionStatus?.isTrialing && subscriptionStatus?.endDate ? (
              <>
                <Alert
                  message="Período de teste expirado"
                  description={
                    <>
                      <p>
                        Seu período de teste de 7 dias expirou em{" "}
                        <strong>{dayjs(subscriptionStatus.endDate).format("DD/MM/YYYY")}</strong>.
                      </p>
                      <p style={{ marginTop: "12px", marginBottom: 0 }}>
                        Para continuar usando o sistema, é necessário assinar agora.
                      </p>
                    </>
                  }
                  type="warning"
                  showIcon
                  style={{ marginBottom: "24px", textAlign: "left" }}
                />
              </>
            ) : (
              <>
                <Alert
                  message="Assinatura necessária"
                  description="Para acessar o sistema, você precisa ter uma assinatura ativa. Comece seu teste grátis de 7 dias agora!"
                  type="info"
                  showIcon
                  style={{ marginBottom: "24px", textAlign: "left" }}
                />
                <Paragraph>
                  Assine agora e ganhe <strong>7 dias grátis</strong> para testar todas as funcionalidades do sistema.
                  Após o período de teste, você será cobrado automaticamente.
                </Paragraph>
              </>
            )}

            <div style={{ marginTop: "32px" }}>
              <Button
                type="primary"
                size="large"
                icon={<CreditCardOutlined />}
                onClick={handleSubscribe}
                block
                style={{ marginBottom: "12px" }}
              >
                {subscriptionStatus?.status === "canceled" || subscriptionStatus?.status === "past_due"
                  ? "Renovar Assinatura"
                  : "Assinar Agora"}
              </Button>
              <Button
                type="default"
                size="large"
                onClick={handleGoToSettings}
                block
              >
                Ir para Configurações
              </Button>
            </div>

            <Paragraph type="secondary" style={{ marginTop: "24px", fontSize: "12px" }}>
              Você será redirecionado para o Stripe para concluir o pagamento de forma segura.
              {subscriptionStatus?.status !== "canceled" && (
                <> O cartão será cobrado apenas após os 7 dias de teste grátis.</>
              )}
            </Paragraph>
          </div>
        </Modal>
      </>
    );
  }

  // Se tiver acesso, renderizar children normalmente
  return children;
}
