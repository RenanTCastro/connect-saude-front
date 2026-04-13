import { useState, useEffect, useCallback } from "react";
import { Button, Typography } from "antd";
import { Link } from "react-router-dom";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import "./CookieBanner.css";

const { Text, Paragraph } = Typography;

const STORAGE_KEY = "connect-saude-cookie-consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.classList.add("cookie-banner-visible");
    } else {
      document.body.classList.remove("cookie-banner-visible");
    }
    return () => document.body.classList.remove("cookie-banner-visible");
  }, [visible]);

  const accept = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Consentimento de cookies">
      <div className="cookie-banner-inner">
        <SafetyCertificateOutlined className="cookie-banner-icon" aria-hidden />
        <div className="cookie-banner-text">
          <Paragraph className="cookie-banner-title">
            <Text strong>Uso de cookies</Text>
          </Paragraph>
          <Paragraph className="cookie-banner-desc">
            Utilizamos cookies para melhorar sua experiência, analisar o uso do site e oferecer
            funcionalidades essenciais. Ao clicar em Aceitar, você concorda com o uso de cookies
            conforme nossa{" "}
            <Link to="/politica-de-privacidade" className="cookie-banner-link">
              Política de Privacidade
            </Link>
            .
          </Paragraph>
        </div>
        <div className="cookie-banner-actions">
          <Button type="primary" size="large" onClick={accept} className="cookie-banner-accept">
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
