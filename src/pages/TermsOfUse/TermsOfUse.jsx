import LegalPage from "../Legal/LegalPage";
import text from "../../content/termos-uso.txt?raw";

export default function TermsOfUse() {
  return (
    <LegalPage documentTitle="Termos de Uso | Connect Saúde" body={text} />
  );
}
