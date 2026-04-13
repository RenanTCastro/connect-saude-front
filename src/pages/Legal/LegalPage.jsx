import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import logoFull from "../../assets/logo_full.svg";
import "./LegalPage.css";

const { Text } = Typography;

export default function LegalPage({ documentTitle, body }) {
  useEffect(() => {
    const prev = document.title;
    document.title = documentTitle;
    return () => {
      document.title = prev;
    };
  }, [documentTitle]);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-header-inner">
          <Link to="/" className="legal-logo-link">
            <img src={logoFull} alt="Connect Saúde" />
          </Link>
          <Link to="/" className="legal-back-link">
            <ArrowLeftOutlined />
            Voltar ao início
          </Link>
        </div>
      </header>
      <main className="legal-main">
        <article className="legal-article">{body}</article>
      </main>
      <footer className="legal-footer">
        <Text type="secondary">
          © {new Date().getFullYear()} Connect Saúde. Todos os direitos reservados.
        </Text>
      </footer>
    </div>
  );
}
