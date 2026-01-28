import { Form, Input, Button, Typography, message } from "antd";
import { LockOutlined, UserOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo_full.svg";

const { Title } = Typography;

import "./Styles.css";

export default function Register() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const handleRegister = async (values) => {
    try {
      console.log(values)
      await api.post('/register', values);
      navigate("/login");
    } catch (err) {
      console.log(err)
      messageApi.error("Aconteceu algum erro, tente novamente mais tarde!");
    }
  };

  return (
    <div className="register-page">
      {contextHolder}

      <div className="auth-logo">
        <img src={logo} alt="Connect Saúde" />
      </div>

      <Title level={3}>Criar conta</Title>
      <Form
        name="register_form"
        className="register-form"
        initialValues={{
          remember: true,
        }}
        onFinish={handleRegister}
      >
        <Form.Item
          name="name"
          rules={[{ required: true, message: "Por favor, insira seu nome!" }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Digite seu nome"
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
    </div>
  );
}
