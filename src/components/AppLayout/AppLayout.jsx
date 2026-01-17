import { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer } from "antd";
import {
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
  ShoppingOutlined,
  InboxOutlined,
  DollarOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../helper/auth";
import logo from "../../assets/logo.svg";

import "./Styles.css";

const { Content, Sider } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      key: "1",
      icon: <HomeOutlined />,
      label: <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>,
    },
    {
      key: "2",
      icon: <CalendarOutlined />,
      label: <Link to="/appointment" onClick={() => setMobileMenuOpen(false)}>Agenda</Link>,
    },
    {
      key: "3",
      icon: <TeamOutlined />,
      label: <Link to="/patient" onClick={() => setMobileMenuOpen(false)}>Pacientes</Link>,
    },
    {
      key: "4",
      icon: <ShoppingOutlined />,
      label: <Link to="/sales" onClick={() => setMobileMenuOpen(false)}>Vendas</Link>,
    },
    {
      key: "5",
      icon: <InboxOutlined />,
      label: <Link to="/inventory" onClick={() => setMobileMenuOpen(false)}>Estoque</Link>,
    },
    {
      key: "6",
      icon: <SettingOutlined />,
      label: <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>Configurações</Link>,
    },
    {
      key: "7",
      icon: <LogoutOutlined />,
      label: "Sair",
      onClick: () => {
        handleLogout();
        setMobileMenuOpen(false);
      },
    },
  ];

  const menuContent = (
    <>
      <div className="logo">
        <img src={logo} alt="Connect Saúde"/>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={["1"]}
        items={menuItems}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth={isMobile ? 0 : 80}
        >
          {menuContent}
        </Sider>
      )}

      <Layout>
        {isMobile && (
          <div className="mobile-header">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-button"
            />
            <div className="mobile-logo">
              <img src={logo} alt="Connect Saúde"/>
            </div>
          </div>
        )}
        <Content style={{ margin: isMobile ? "8px" : "16px" }}>
          <div
            style={{
              padding: isMobile ? 12 : 24,
              borderRadius: 5,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>

      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          bodyStyle={{ padding: 0, background: "#001529" }}
          width={280}
        >
          <div className="drawer-logo">
            <img src={logo} alt="Connect Saúde"/>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={["1"]}
            items={menuItems}
          />
        </Drawer>
      )}
    </Layout>
  );
}
