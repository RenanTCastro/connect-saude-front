import { Form, Input, Button, Typography, message } from "antd";
import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Link, useNavigate} from "react-router-dom";
import { login } from "../../helper/auth";
import api from "../../services/api";

const { Title } = Typography;

import "./Styles.css"

export default function Login() {
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();

  const handleLogin = async values => {
    try {
      const res = await api.post('/login', values);
      login(res.data.token);
      navigate("/");
    } catch (err) {
      console.log(err)
      messageApi.error("Aconteceu algum erro, tente novamente mais tarde!");
    }
  };

  return (
    <div className="login-page">
     {contextHolder}

      <Title level={3}>Entrar na conta</Title>
      <Form
        name="login_form"
        className="login-form"
        initialValues={{
          remember: true,
        }}
        onFinish={handleLogin}
      >
        <Form.Item
          name="email"
          rules={[
            {
              required: true,
              message: 'Por favor, insira seu e-mail!',
            },
          ]}
        >
          <Input prefix={<MailOutlined className="site-form-item-icon" />} type="email" placeholder="E-mail" />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[
            { required: true, message: "Por favor, insira sua senha!" },
            { min: 8, message: "A senha deve ter no mínimo 8 caracteres!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            type="password"
            placeholder="Senha"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" className="login-form-button">
            Entrar
          </Button>
          Não tem conta? <Link to="/register">Criar conta</Link>
        </Form.Item>
      </Form>
    </div>
  );
}
