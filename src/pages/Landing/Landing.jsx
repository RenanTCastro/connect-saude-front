import { useState, useEffect } from "react";
import { Button, Typography, Row, Col, Card, Space, Avatar, Rate } from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StarFilled,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import logoFull from "../../assets/logo_full.svg";
import mockupImage from "../../assets/mockup.svg";
import WhatsAppButton from "../../components/WhatsAppButton/WhatsAppButton";
import "./Landing.css";

const { Title, Paragraph, Text } = Typography;

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
      title: "Estoque",
      description:
        "Controle de produtos com entrada e saída e mantenha seu inventário sempre organizado.",
    },
    {
      id: 6,
      icon: <SettingOutlined />,
      title: "Configurações",
      description:
        "Personalize o sistema conforme suas necessidades e preferências da sua clínica.",
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
      rating: 5,
      text: "O Connect Saúde transformou completamente a gestão do meu consultório. Agora consigo organizar todas as consultas, pacientes e finanças em um único sistema. A economia de tempo é impressionante!",
    },
    {
      id: 2,
      name: "Dra. Maria Santos",
      profession: "Dentista - Consultório Odontológico",
      avatar: "MS",
      rating: 5,
      text: "Economizamos horas por semana com o sistema. O controle de estoque de materiais odontológicos e fluxo de caixa são excepcionais. Recomendo para qualquer dentista que queira modernizar seu consultório.",
    },
    {
      id: 3,
      name: "Dr. Pedro Costa",
      profession: "Dentista - Clínica Odontológica",
      avatar: "PC",
      rating: 5,
      text: "O controle financeiro ficou muito mais fácil. Conseguimos acompanhar receitas de tratamentos, despesas com materiais e saldo a receber de forma simples e intuitiva. Excelente investimento para dentistas!",
    },
    {
      id: 4,
      name: "Dra. Ana Oliveira",
      profession: "Dentista - Consultório Odontológico",
      avatar: "AO",
      rating: 5,
      text: "A agenda inteligente é perfeita para gerenciar os agendamentos dos pacientes! Nunca mais perdemos um compromisso. O sistema é muito intuitivo e minha equipe se adaptou rapidamente.",
    },
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
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>
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
              Gerencie seu consultório odontológico de forma completa e inteligente
            </Title>
            <Paragraph className="hero-subtitle">
              Sistema de gestão integrado feito especialmente para dentistas.
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
              Sem fidelidade • Após 7 dias, apenas R$ 49,90/mês
            </Text>
          </div>
          <div className="hero-visual">
            <div className="hero-mockup">
              <img src={mockupImage} alt="Connect Saúde - Sistema de Gestão" className="mockup-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container fade-in-section">
          <div className="section-header">
            <Title level={2} className="section-title">
              Funcionalidades Completas
            </Title>
            <Paragraph className="section-description">
              Tudo que você precisa para gerenciar seu consultório odontológico com eficiência
            </Paragraph>
            <div className="trust-badge">
              <Text strong style={{ fontSize: '18px', color: '#1677ff' }}>
                +500 profissionais já confiam no Connect Saúde
              </Text>
            </div>
          </div>
          <Row gutter={[24, 24]} className="features-grid">
            {features.map((feature) => (
              <Col xs={24} sm={12} lg={8} key={feature.id}>
                <Card className="feature-card" hoverable>
                  <div className="feature-icon">{feature.icon}</div>
                  <Title level={4} className="feature-title">
                    {feature.title}
                  </Title>
                  <Paragraph className="feature-description">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
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
          <Row gutter={[24, 24]} className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <Col xs={24} sm={12} lg={6} key={testimonial.id}>
                <Card className="testimonial-card">
                  <div className="testimonial-header">
                    <Avatar size={64} className="testimonial-avatar">
                      {testimonial.avatar}
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
                Teste todas as funcionalidades por 7 dias sem compromisso. Após o período de teste, a assinatura é de apenas R$49,90/mês.
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
                  <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection("features"); }}>
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
