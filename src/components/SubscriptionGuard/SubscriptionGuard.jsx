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
  const navigate = useNavigate();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/subscription/status");
      const status = res.data;
      setSubscriptionStatus(status);

      // Verificar se tem acesso - usar hasAccess do backend
      // (inclui trial gratuito de 7 dias sem cartão)
      let access = status.hasAccess === true;
      
      // Se status é canceled, SEMPRE sem acesso (não verificar data)
      if (status.status === "canceled") {
        access = false;
      }
      
      // Sem assinatura e não está em trial gratuito = sem acesso
      if (!status.hasSubscription && status.status !== "trialing") {
        access = false;
      }

      setHasAccess(access);
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
    navigate("/app/settings");
  };

  // Durante carregamento, não bloquear
  if (loading) {
    return children;
  }

  // Sempre renderizar children e modal; o modal abre quando !hasAccess (bloqueia acesso)
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
        open={!hasAccess}
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
                            Seu período de teste gratuito de 7 dias expirou.
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
                            Sua assinatura foi cancelada e expirou.
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
                      Por favor, renove sua assinatura para continuar usando o sistema.
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
                        Seu período de teste de 7 dias expirou.
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
            ) : subscriptionStatus?.trialExpired ? (
              <>
                <Alert
                  message="Período de teste expirado"
                  description={
                    <>
                      <p>
                        Seu período de teste gratuito de 7 dias expirou.
                      </p>
                      <p style={{ marginTop: "12px", marginBottom: 0 }}>
                        Para continuar usando o sistema, assine agora e cadastre seu cartão.
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
                  description="Para acessar o sistema, assine agora. Novos usuários ganham 7 dias grátis sem cadastrar cartão."
                  type="info"
                  showIcon
                  style={{ marginBottom: "24px", textAlign: "left" }}
                />
                <Paragraph>
                  Assine para continuar usando todas as funcionalidades do sistema.
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
              Você será redirecionado para o Stripe para cadastrar seu cartão e concluir a assinatura de forma segura.
            </Paragraph>
          </div>
        </Modal>
    </>
  );
}
