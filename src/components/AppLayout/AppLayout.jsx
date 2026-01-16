import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  InboxOutlined,
  DollarOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../helper/auth";
import logo from "../../assets/logo.svg";

import "./Styles.css";

const { Content, Sider } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible>
        <div className="logo">
          <img src={logo} alt="Connect Saúde"/>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            {
              key: "1",
              icon: <HomeOutlined />,
              label: <Link to="/">Home</Link>,
            },
            {
              key: "2",
              icon: <CalendarOutlined />,
              label: <Link to="/appointment">Agenda</Link>,
            },
            {
              key: "3",
              icon: <TeamOutlined />,
              label: <Link to="/patient">Pacientes</Link>,
            },
            {
              key: "4",
              icon: <ShoppingOutlined />,
              label: <Link to="/sales">Vendas</Link>,
            },
            {
              key: "5",
              icon: <InboxOutlined />,
              label: <Link to="/inventory">Estoque</Link>,
            },
            {
              key: "6",
              icon: <LogoutOutlined />,
              label: "Sair",
              onClick: handleLogout,
            },
          ]}
        />
      </Sider>

      <Layout>
        <Content style={{ margin: "16px" }}>
          <div
            style={{
              padding: 24,
              borderRadius: 5,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
