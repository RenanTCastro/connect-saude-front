import LegalPage from "../Legal/LegalPage";
import text from "../../content/politica-privacidade.txt?raw";

export default function PrivacyPolicy() {
  return (
    <LegalPage
      documentTitle="Política de Privacidade | Connect Saúde"
      body={text}
    />
  );
}
