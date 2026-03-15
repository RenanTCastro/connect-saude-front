import { useState, useEffect } from "react";
import { Button, Typography, Row, Col, Card, Space, Avatar, Rate, Tabs } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  StarFilled,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import logoFull from "../../assets/logo_full.svg";
import mockupImage from "../../assets/mockup.svg";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";
import "./Landing.css";

// Descomente e ajuste os caminhos quando adicionar as imagens:
import agendaPrint from "../../assets/agenda-inteligente.png";
import pacientesPrint from "../../assets/gestao-pacientes.png";
import caixaPrint from "../../assets/fluxo-caixa.png";
import crmPrint from "../../assets/crm-vendas.png";
import estoquePrint from "../../assets/estoque.png";
import joaoPhoto from "../../assets/testimonials/joao.png";
import pedroPhoto from "../../assets/testimonials/pedro.png";

const { Title, Paragraph, Text } = Typography;

// Ícone do WhatsApp SVG
const WhatsAppIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      // Add visible class to sections in viewport
      const sections = document.querySelectorAll('.fade-in-section');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8 && rect.bottom > 0;
        if (isVisible) {
          section.classList.add('visible');
        }
      });
    };
    
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check on mount
    
    // Use Intersection Observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    const sections = document.querySelectorAll('.fade-in-section');
    sections.forEach((section) => observer.observe(section));
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      sections.forEach((section) => observer.unobserve(section));
    };
  }, []);

  const handleTrialClick = () => {
    navigate("/register?trial=true");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    {
      id: 1,
      icon: <CalendarOutlined />,
      title: "Agenda Inteligente",
      description:
        "Calendário visual interativo para agendamento de consultas e compromissos. Organize sua rotina com rótulos coloridos e lembretes automáticos.",
    },
    {
      id: 2,
      icon: <TeamOutlined />,
      title: "Gestão de Pacientes",
      description:
        "Cadastro completo de pacientes com histórico, prontuários e busca rápida. Tenha todas as informações importantes em um só lugar.",
    },
    {
      id: 3,
      icon: <DollarOutlined />,
      title: "Fluxo de Caixa",
      description:
        "Controle completo de receitas e despesas. Gerencie saldo a receber com parcelas e tenha relatórios financeiros detalhados.",
    },
    {
      id: 4,
      icon: <ShoppingOutlined />,
      title: "Vendas e CRM",
      description:
        "Sistema completo de gestão de vendas com controle de clientes e pipeline. Acompanhe todo o processo de vendas da sua clínica.",
    },
    {
      id: 5,
      icon: <InboxOutlined />,
      title: "Gestão de stoque",
      description:
        "Controle de produtos com entrada e saída e mantenha seu inventário sempre organizado.",
    },
    {
      id: 6,
      icon: <WhatsAppIcon size={48} color="#25d366" />,
      title: "Lembretes Automáticos",
      description:
        "Envie lembretes de consulta automaticamente para seus pacientes via WhatsApp. Reduza faltas e melhore a comunicação com sua clínica.",
      isHighlighted: true,
    },
  ];

  const benefits = [
    "Tudo em um só lugar",
    "Economia de tempo",
    "Controle financeiro completo",
    "Fácil de usar",
    "Suporte dedicado",
    "Seguro e confiável",
  ];

  const testimonials = [
    {
      id: 1,
      name: "Dr. João Silva",
      profession: "Dentista - Clínica Odontológica",
      avatar: "JS",
      photo: joaoPhoto,
      rating: 5,
      text: "Antes eu usava planilhas e era tudo muito bagunçado. Com o Connect Saúde consigo ver agenda, pacientes e financeiro no mesmo lugar. Facilitou muito a rotina do consultório.",
    },
    {
      id: 2,
      name: "Dra. Mari Gerdel",
      profession: "Dentista - Consultório Odontológico",
      avatar: "MS",
      rating: 5,
      text: "O que mais gostei foi o controle de estoque e financeiro. Antes eu perdia muito tempo organizando isso manualmente. Hoje consigo acompanhar tudo pelo sistema",
    },
    {
      id: 3,
      name: "Dr. Pedro Costa",
      profession: "Dentista - Clínica Odontológica",
      avatar: "PC",
      photo: pedroPhoto,
      rating: 5,
      text: "Começamos a usar o Connect Saúde há alguns meses e ajudou bastante na organização dos atendimentos e dos pagamentos dos pacientes. O sistema é simples de usar.",
    }
  ];

  return (
    <div className="landing-page">
      {/* Header/Navbar */}
      <header className={`landing-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          <div className="header-logo">
            <img src={logoFull} alt="Connect Saúde" />
          </div>
          <nav className="header-nav">
            <a href="#showcase" onClick={(e) => { e.preventDefault(); scrollToSection("showcase"); }}>
              Funcionalidades
            </a>
            <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection("testimonials"); }}>
              Depoimentos
            </a>
            <a href="#cta" onClick={(e) => { e.preventDefault(); scrollToSection("cta"); }}>
              Começar
            </a>
          </nav>
          <Space className="header-actions">
            <Button type="default" onClick={handleLoginClick}>
              Entrar
            </Button>
            <Button type="primary" onClick={handleTrialClick} className="trial-button">
              Teste Grátis 7 Dias
            </Button>
          </Space>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="trial-badge">
              <StarFilled /> 7 dias grátis
            </div>
            <Title level={1} className="hero-title">
              Mais tempo para seus pacientes, menos tempo na burocracia.
            </Title>
            <Paragraph className="hero-subtitle">
            Uma gestão completa e intuitiva que organiza sua agenda, prontuários e financeiro em poucos cliques.
            </Paragraph>
            <Space size="large" className="hero-ctas">
              <Button
                type="primary"
                size="large"
                onClick={handleTrialClick}
                className="cta-primary"
              >
                Começar Teste Grátis
                <ArrowRightOutlined />
              </Button>
              <Button
                type="default"
                size="large"
                onClick={handleLoginClick}
                className="cta-secondary"
              >
                Já tenho conta
              </Button>
            </Space>
            <Text className="hero-note">
              Sem fidelidade • Após 7 dias, apenas R$ 79,90/mês
            </Text>
          </div>
          <div className="hero-visual">
            <div className="hero-mockup">
              <img src={mockupImage} alt="Connect Saúde - Sistema de Gestão" className="mockup-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Showcase Section */}
      <section id="showcase" className="showcase-section">
        <div className="section-container fade-in-section">
          <div className="section-header">
            <Title level={2} className="section-title">
              Conheça Nossas Funcionalidades em Detalhes
            </Title>
            <Paragraph className="section-description">
              Explore cada módulo do sistema e descubra como podemos transformar a gestão do seu consultório
            </Paragraph>
          </div>
          
          <Tabs
            defaultActiveKey="agenda"
            type="card"
            size="large"
            className="showcase-tabs"
            items={[
              {
                key: 'agenda',
                label: (
                  <Space>
                    <CalendarOutlined />
                    <span>Agenda Inteligente</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="showcase-image-container">
                            {agendaPrint ? (
                              <img 
                                src={agendaPrint} 
                                alt="Agenda Inteligente - Connect Saúde" 
                                className="showcase-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="showcase-image-placeholder" style={{ display: agendaPrint ? 'none' : 'flex' }}>
                              <CalendarOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                              <Text type="secondary">Adicione a imagem agenda-inteligente.png na pasta assets</Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3}>Agenda Inteligente</Title>
                          <Paragraph className="showcase-description">
                            Gerencie todos os seus agendamentos de forma visual e intuitiva. Nossa agenda inteligente oferece uma experiência completa para organizar sua rotina profissional.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Visualização em calendário mensal, semanal e diário</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Agendamento rápido com arrastar e soltar</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Lembretes automáticos por WhatsApp</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Histórico completo de consultas</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'pacientes',
                label: (
                  <Space>
                    <TeamOutlined />
                    <span>Gestão de Pacientes</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3}>Gestão Completa de Pacientes</Title>
                          <Paragraph className="showcase-description">
                            Tenha todas as informações dos seus pacientes organizadas em um só lugar. Desde dados pessoais até histórico completo de tratamentos, anamnese, anexos e documentos.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Anamnese completa com formulários personalizáveis</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Cadastro completo com dados pessoais e contatos</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Anexos: salve arquivos e fotos do paciente de forma organizada</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Documentos: modelos personalizáveis para impressão de contratos, receituário, atestado e termos de consentimento</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Gestão de débitos do paciente</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="showcase-image-container">
                            {pacientesPrint ? (
                              <img 
                                src={pacientesPrint} 
                                alt="Gestão de Pacientes - Connect Saúde" 
                                className="showcase-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="showcase-image-placeholder" style={{ display: pacientesPrint ? 'none' : 'flex' }}>
                              <TeamOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                              <Text type="secondary">Adicione a imagem gestao-pacientes.png na pasta assets</Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'caixa',
                label: (
                  <Space>
                    <DollarOutlined />
                    <span>Fluxo de Caixa</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="showcase-image-container">
                            {caixaPrint ? (
                              <img 
                                src={caixaPrint} 
                                alt="Fluxo de Caixa - Connect Saúde" 
                                className="showcase-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="showcase-image-placeholder" style={{ display: caixaPrint ? 'none' : 'flex' }}>
                              <DollarOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                              <Text type="secondary">Adicione a imagem fluxo-caixa.png na pasta assets</Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3}>Controle Financeiro Completo</Title>
                          <Paragraph className="showcase-description">
                            Gerencie receitas, despesas e saldo a receber com relatórios detalhados e controle de parcelas. Tenha visibilidade total das finanças do seu consultório.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Controle de receitas e despesas em tempo real</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Gestão de saldo a receber com parcelas</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Controle de contas a pagar e receber</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Dashboard com visão geral das finanças</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'crm',
                label: (
                  <Space>
                    <ShoppingOutlined />
                    <span>CRM e Vendas</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3}>CRM e Gestão de Vendas</Title>
                          <Paragraph className="showcase-description">
                            Gerencie todo o processo de vendas da sua clínica, desde o primeiro contato até o fechamento. Acompanhe leads, oportunidades e converta mais pacientes.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Pipeline de vendas visual e intuitivo</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Gestão de leads e oportunidades</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Acompanhamento de propostas e orçamentos</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Histórico completo de interações</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="showcase-image-container">
                            {crmPrint ? (
                              <img 
                                src={crmPrint} 
                                alt="CRM e Vendas - Connect Saúde" 
                                className="showcase-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="showcase-image-placeholder" style={{ display: crmPrint ? 'none' : 'flex' }}>
                              <ShoppingOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                              <Text type="secondary">Adicione a imagem crm-vendas.png na pasta assets</Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'estoque',
                label: (
                  <Space>
                    <InboxOutlined />
                    <span>Estoque</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="showcase-image-container">
                            {estoquePrint ? (
                              <img 
                                src={estoquePrint} 
                                alt="Controle de Estoque - Connect Saúde" 
                                className="showcase-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="showcase-image-placeholder" style={{ display: estoquePrint ? 'none' : 'flex' }}>
                              <InboxOutlined style={{ fontSize: '48px', color: '#1677ff' }} />
                              <Text type="secondary">Adicione a imagem estoque.png na pasta assets</Text>
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3}>Gestão de Estoque Inteligente</Title>
                          <Paragraph className="showcase-description">
                            Controle completo de produtos e materiais odontológicos. Receba alertas de estoque baixo, gerencie entradas e saídas, e mantenha seu inventário sempre organizado.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Controle de entrada e saída de produtos</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Alertas automáticos de estoque baixo</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Histórico completo de movimentações</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Relatórios de consumo e reposição</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Controle de validade de produtos</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Busca rápida e categorização de produtos</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'whatsapp',
                label: (
                  <Space>
                    <WhatsAppIcon size={20} color="#25d366" />
                    <span>Lembretes WhatsApp</span>
                  </Space>
                ),
                children: (
                  <div className="showcase-content">
                    <Row gutter={[48, 48]} align="middle">
                      <Col xs={24} lg={12}>
                        <div className="showcase-details">
                          <Title level={3} style={{ marginTop: '24px' }}>
                            Lembretes Automáticos por WhatsApp
                          </Title>
                          <Paragraph className="showcase-description">
                            Seus pacientes recebem lembretes automáticos de consultas diretamente no WhatsApp. 
                            Reduza faltas em até 80% e melhore a comunicação com sua clínica de forma profissional e eficiente.
                          </Paragraph>
                          <ul className="showcase-features-list">
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Envio automático de lembretes</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Redução significativa de faltas</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Comunicação profissional e personalizada</Text>
                            </li>
                            <li>
                              <CheckCircleOutlined className="feature-check-icon" />
                              <Text>Economia de tempo e recursos</Text>
                            </li>
                          </ul>
                        </div>
                      </Col>
                      <Col xs={24} lg={12}>
                        <div className="showcase-visual">
                          <div className="whatsapp-mockup-container">
                            <div className="whatsapp-mockup">
                              <div className="whatsapp-mockup-header">
                                <div className="whatsapp-mockup-contact">
                                  <WhatsAppIcon size={20} color="#ffffff" />
                                  <div className="whatsapp-mockup-contact-info">
                                    <Text strong style={{ color: '#ffffff' }}>Connect Saúde</Text>
                                    <Text style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>online</Text>
                                  </div>
                                </div>
                              </div>
                              <div className="whatsapp-mockup-messages">
                                <div className="whatsapp-message whatsapp-message-received">
                                  <div className="whatsapp-message-bubble">
                                    <Text>
                                      Olá, Luísa Marques.
                                      <br />
                                      <br />
                                      Sua consulta está confirmada para dia 15/03/2024 às 14:00, na Clínica Odontológica Dr. João Silva.
                                      <br />
                                      <br />
                                      Em caso de dúvidas ou necessidade de reagendamento, entre em contato com seu profissional de saúde.
                                    </Text>
                                  </div>
                                  <Text type="secondary" className="whatsapp-message-time">10:30</Text>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-container fade-in-section">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2} className="section-title">
                Por que escolher o Connect Saúde?
              </Title>
              <Paragraph className="section-description">
                Um sistema completo que transforma a gestão do seu consultório odontológico
              </Paragraph>
              <ul className="benefits-list">
                {benefits.map((benefit, index) => (
                  <li key={index} className="benefit-item">
                    <CheckCircleOutlined className="benefit-icon" />
                    <Text>{benefit}</Text>
                  </li>
                ))}
              </ul>
            </Col>
            <Col xs={24} lg={12}>
              <div className="benefits-visual">
                <div className="benefits-card">
                  <Title level={3}>Tudo Integrado</Title>
                  <Paragraph>
                    Não precisa mais usar vários sistemas diferentes. O Connect
                    Saúde reúne agenda, pacientes, finanças, vendas e estoque de materiais
                    em uma única plataforma feita especialmente para dentistas.
                  </Paragraph>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-container fade-in-section">
          <div className="section-header">
            <Title level={2} className="section-title">
              O que nossos clientes dizem
            </Title>
            <Paragraph className="section-description">
              Dentistas que confiam no Connect Saúde
            </Paragraph>
          </div>
          <Row gutter={[24, 24]} className="testimonials-grid" justify="center">
            {testimonials.map((testimonial) => (
              <Col xs={24} sm={12} lg={8} key={testimonial.id}>
                <Card className="testimonial-card">
                  <div className="testimonial-header">
                    <Avatar 
                      size={64} 
                      className="testimonial-avatar"
                      src={testimonial.photo}
                    >
                      {!testimonial.photo && testimonial.avatar}
                    </Avatar>
                    <div className="testimonial-info">
                      <Text strong className="testimonial-name">
                        {testimonial.name}
                      </Text>
                      <Text type="secondary" className="testimonial-profession">
                        {testimonial.profession}
                      </Text>
                    </div>
                  </div>
                  <Rate
                    disabled
                    defaultValue={testimonial.rating}
                    className="testimonial-rating"
                  />
                  <Paragraph className="testimonial-text">
                    "{testimonial.text}"
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="cta-section">
        <div className="section-container fade-in-section">
          <Card className="cta-card">
            <div className="cta-content">
              <div className="trial-badge-large">
                <StarFilled /> 7 dias grátis
              </div>
              <Title level={2} className="cta-title">
                Comece a transformar seu consultório hoje
              </Title>
              <Paragraph className="cta-description">
                Teste todas as funcionalidades por 7 dias sem compromisso. Após o período de teste, a assinatura é de apenas R$79,90/mês.
              </Paragraph>
              <div className="trust-stats">
                <Text strong style={{ fontSize: '20px', color: '#1677ff' }}>
                  +500 profissionais já confiam no Connect Saúde
                </Text>
              </div>
              <Space size="large" className="cta-buttons">
                <Button
                  type="primary"
                  size="large"
                  onClick={handleTrialClick}
                  className="cta-primary-large"
                >
                  Começar Teste Grátis
                  <ArrowRightOutlined />
                </Button>
                <Button
                  type="default"
                  size="large"
                  onClick={handleLoginClick}
                  className="cta-secondary-large"
                >
                  Entrar na minha conta
                </Button>
              </Space>
              <div className="cta-guarantee">
                <CheckCircleOutlined /> Cancele quando quiser • Sem fidelidade • Sem taxas escondidas
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <img src={logoFull} alt="Connect Saúde" />
          </div>
          <div className="footer-content">
            <div className="footer-section">
              <Text strong>Produto</Text>
              <ul>
                <li>
                  <a href="#showcase" onClick={(e) => { e.preventDefault(); scrollToSection("showcase"); }}>
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection("testimonials"); }}>
                    Depoimentos
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <Text strong>Suporte</Text>
              <ul>
                <li>
                  <a href="#cta" onClick={(e) => { e.preventDefault(); scrollToSection("cta"); }}>
                    Começar Teste
                  </a>
                </li>
                <li>
                  <Link to="/login">Entrar</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <Text type="secondary">
            © {new Date().getFullYear()} Connect Saúde. Todos os direitos
            reservados.
          </Text>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
