import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  ShoppingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../helper/auth";

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
        <div className="logo">Connect <br/> Saúde</div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          items={[
            {
              key: "1",
              icon: <HomeOutlined />,
              label: <Link to="/home">Home</Link>,
            },
            {
              key: "2",
              icon: <ShoppingOutlined />,
              label: <Link to="/inventory">Inventory</Link>,
            },
            {
              key: "3",
              icon: <UserOutlined />,
              label: <Link to="/profile">Profile</Link>,
            },
            {
              key: "4",
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
