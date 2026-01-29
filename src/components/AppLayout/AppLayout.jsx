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
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../../helper/auth";
import logo from "../../assets/logo.svg";
import WhatsAppButton from "../WhatsAppButton/WhatsAppButton";

import "./Styles.css";

const { Content, Sider } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
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
    navigate("/");
  };

  // Determinar qual item está ativo baseado na rota atual
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/app" || path === "/app/") return ["1"];
    if (path === "/app/appointment") return ["2"];
    if (path.startsWith("/app/patient")) return ["3"];
    if (path === "/app/sales") return ["4"];
    if (path === "/app/inventory") return ["5"];
    if (path === "/app/settings") return ["6"];
    return [];
  };

  const menuItems = [
    {
      key: "1",
      icon: <HomeOutlined />,
      label: <Link to="/app" onClick={() => setMobileMenuOpen(false)}>Home</Link>,
    },
    {
      key: "2",
      icon: <CalendarOutlined />,
      label: <Link to="/app/appointment" onClick={() => setMobileMenuOpen(false)}>Agenda</Link>,
    },
    {
      key: "3",
      icon: <TeamOutlined />,
      label: <Link to="/app/patient" onClick={() => setMobileMenuOpen(false)}>Pacientes</Link>,
    },
    {
      key: "4",
      icon: <ShoppingOutlined />,
      label: <Link to="/app/sales" onClick={() => setMobileMenuOpen(false)}>Vendas</Link>,
    },
    {
      key: "5",
      icon: <InboxOutlined />,
      label: <Link to="/app/inventory" onClick={() => setMobileMenuOpen(false)}>Estoque</Link>,
    },
    {
      key: "6",
      icon: <SettingOutlined />,
      label: <Link to="/app/settings" onClick={() => setMobileMenuOpen(false)}>Configurações</Link>,
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
        selectedKeys={getSelectedKey()}
        items={menuItems}
        className="custom-menu"
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
          style={{ background: "#1677ff" }}
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
          bodyStyle={{ padding: 0, background: "#1677ff" }}
          width={280}
        >
          <div className="drawer-logo">
            <img src={logo} alt="Connect Saúde"/>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKey()}
            items={menuItems}
            className="custom-menu"
          />
        </Drawer>
      )}

      {/* Botão de WhatsApp fixo */}
      <WhatsAppButton />
    </Layout>
  );
}
