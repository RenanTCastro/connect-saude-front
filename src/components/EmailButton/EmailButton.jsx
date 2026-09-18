import { Button } from "antd";
import { MailOutlined } from "@ant-design/icons";
import "./EmailButton.css";

export default function EmailButton() {
  const handleEmailClick = () => {
    const email = "connectsaudesuporte@gmail.com";
    const subject = encodeURIComponent("Suporte - Connect Saúde");
    window.location.href = `mailto:${email}?subject=${subject}`;
  };

  return (
    <Button
      type="primary"
      shape="circle"
      size="large"
      className="email-button"
      icon={<MailOutlined style={{ fontSize: 24 }} />}
      onClick={handleEmailClick}
      aria-label="Falar com suporte por e-mail"
    />
  );
}