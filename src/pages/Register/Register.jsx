import { Form, Input, Button, Typography, message, Modal, Checkbox } from "antd";
import { LockOutlined, UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../services/api";
import logo from "../../assets/logo_full.svg";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";

const { Title } = Typography;

import "./Styles.css";

const LGPD_DECLARATION = `Declaro que sou responsável pelo tratamento dos dados pessoais e sensíveis inseridos na plataforma Connect Saúde, possuindo base legal para sua coleta e utilização, incluindo consentimento dos pacientes quando necessário, conforme a Lei Geral de Proteção de Dados (LGPD).

Declaro ainda que utilizarei a plataforma exclusivamente para fins profissionais e em conformidade com a legislação vigente.`;

export default function Register() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [acceptLgpd, setAcceptLgpd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allAccepted = acceptLgpd && acceptTerms && acceptPrivacy;

  const openLegalModal = (values) => {
    const { confirmPassword, ...rest } = values;
    setPendingPayload(rest);
    setAcceptLgpd(false);
    setAcceptTerms(false);
    setAcceptPrivacy(false);
    setModalOpen(true);
  };

  const handleRegisterConfirm = async () => {
    if (!pendingPayload || !allAccepted) return;
    setSubmitting(true);
    try {
      await api.post("/register", {
        ...pendingPayload,
        accept_lgpd_responsibility: true,
        accept_terms_of_use: true,
        accept_privacy_policy: true,
      });
      messageApi.success("Conta criada com sucesso! Você pode fazer login agora.");
      setModalOpen(false);
      setPendingPayload(null);
      navigate("/login");
    } catch (err) {
      console.error("Erro ao registrar:", err);

      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Erro ao criar conta. Verifique os dados e tente novamente.";

      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setPendingPayload(null);
  };

  return (
    <div className="register-page">
      {contextHolder}

      <div className="auth-logo">
        <img src={logo} alt="Connect Saúde" />
      </div>

      <Title level={3}>Criar conta</Title>
      <Form
        form={form}
        name="register_form"
        className="register-form"
        initialValues={{
          remember: true,
        }}
        onFinish={openLegalModal}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: "Por favor, insira o nome que será exibido para os pacientes!"  }]}
          extra={
            <span className="register-extra-text">
              Nome usado nos lembretes via WhatsApp para seus clientes.
            </span>
          }
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Nome do profissional ou clínica" 
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Por favor, insira seu e-mail!' },
          ]}
        >
          <Input prefix={<MailOutlined/>} type="email" placeholder="E-mail" />
        </Form.Item>

        <Form.Item
          name="phone"
          rules={[
            { required: true, message: "Por favor, insira seu número de telefone!" },
            { pattern: /^[0-9]{10,11}$/, message: "Digite um número válido (somente números)." },
            { min: 11, message: "Digite um número válido." },
          ]}
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Telefone (Whatsapp)"
            maxLength={11}
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Por favor, insira sua senha!" },
            { min: 8, message: "A senha deve ter no mínimo 8 caracteres!" },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Crie uma senha"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Por favor, confirme sua senha!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("As senhas não coincidem!")
                );
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirme sua senha"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="register-form-button">
            Criar
          </Button>
          Já tem uma conta?  <Link to="/login">Entrar</Link>
        </Form.Item>
      </Form>

      <Modal
        title="Termo de responsabilidade do profissional"
        open={modalOpen}
        onCancel={handleModalCancel}
        footer={[
          <Button key="back" onClick={handleModalCancel}>
            Voltar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            disabled={!allAccepted}
            onClick={handleRegisterConfirm}
          >
            Confirmar cadastro
          </Button>,
        ]}
        width={560}
        destroyOnClose
        className="register-legal-modal"
      >
        <div className="register-legal-modal-body">
          <p className="register-legal-declaration">{LGPD_DECLARATION}</p>
          <Checkbox checked={acceptLgpd} onChange={(e) => setAcceptLgpd(e.target.checked)}>
            Li e aceito a declaração acima sobre tratamento de dados e uso profissional da plataforma.
          </Checkbox>
          <Checkbox checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)}>
            <span>
              Li e concordo com os{" "}
              <Link to="/termos-de-uso" target="_blank" rel="noopener noreferrer">
                Termos de Uso
              </Link>
              .
            </span>
          </Checkbox>
          <Checkbox checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)}>
            <span>
              Li e concordo com a{" "}
              <Link to="/politica-de-privacidade" target="_blank" rel="noopener noreferrer">
                Política de Privacidade
              </Link>
              .
            </span>
          </Checkbox>
        </div>
      </Modal>

      <WhatsAppButton />
    </div>
  );
}
