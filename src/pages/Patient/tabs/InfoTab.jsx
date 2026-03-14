import { Card, Typography, Row, Col, Divider, Button } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const { Text } = Typography;

// Helpers
function formatCPF(cpf) {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return cpf;
}

function formatPhone(phone) {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
}

const formatBirthDate = (dateString) => {
  if (!dateString) return "-";
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
};

export default function InfoTab({ patient, appointments }) {
  const navigate = useNavigate();

  return (
    <>
      <Row gutter={16}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Dados pessoais">
            <p><Text strong>Código do paciente:</Text> {patient?.id}</p>
            <p><Text strong>Nome:</Text> {patient?.full_name}</p>
            <p><Text strong>Número do paciente:</Text> {patient?.patient_number}</p>
            <p><Text strong>CPF:</Text> {formatCPF(patient?.cpf)}</p>
            <p><Text strong>RG:</Text> {patient?.rg || "-"}</p>
            <p><Text strong>Data de nascimento:</Text> {formatBirthDate(patient?.birth_date)}</p> 
            <p><Text strong>Idade:</Text> {patient?.age} anos</p>
            <p><Text strong>Sexo:</Text> {patient?.gender}</p>
            <p><Text strong>Celular:</Text> {formatPhone(patient?.phone)}</p>
            <p><Text strong>CEP:</Text> {patient?.zip_code || "-"}</p>
            <p><Text strong>Endereço:</Text> {patient?.street}</p>
            {patient?.complement && (
              <p><Text strong>Complemento:</Text> {patient.complement}</p>
            )}
            <p><Text strong>Bairro:</Text> {patient?.neighborhood}</p>
            <p><Text strong>Cidade:</Text> {patient?.city} - {patient?.state}</p>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          <Card title="Consultas" style={{ maxHeight: 400, overflowY: "auto" }}>
            {appointments.length === 0 ? (
              <Text type="secondary">Nenhuma consulta registrada.</Text>
            ) : (
              appointments.map((appt) => (
                <div key={appt.id} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ display: "block", marginBottom: 4 }}>
                        {appt.title || "Consulta"}
                      </Text>
                      <Text style={{ display: "block", marginBottom: 4 }}>
                        {dayjs(appt.start_datetime).format("DD/MM/YYYY [às] HH:mm")}
                      </Text>
                      {appt.description && (
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                          {appt.description}
                        </Text>
                      )}
                    </div>
                    <Text 
                      type={appt.status === "completed" ? "success" : appt.status === "cancelled" ? "danger" : "default"}
                      style={{ fontSize: 12 }}
                    >
                      {appt.status === "scheduled" ? "Agendada" : 
                       appt.status === "completed" ? "Finalizada" : 
                       appt.status === "cancelled" ? "Cancelada" : 
                       appt.status || "Agendada"}
                    </Text>
                  </div>
                  <Button 
                    type="link" 
                    style={{ padding: 0 }}
                    onClick={() => navigate(`/app/appointment`)}
                  >
                    Ver na agenda
                  </Button>
                  {appt !== appointments[appointments.length - 1] && <Divider style={{ margin: "12px 0 0 0" }} />}
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={24} md={12}>
          <Card title="Dados do Responsável">
            {patient?.responsible_name ? (
              <>
                <p><Text strong>Nome:</Text> {patient?.responsible_name}</p>
                <p><Text strong>CPF:</Text> {formatCPF(patient?.responsible_cpf)}</p>
                <p><Text strong>Telefone:</Text> {formatPhone(patient?.responsible_phone)}</p>
                {patient?.responsible_email && (
                  <p><Text strong>E-mail:</Text> {patient?.responsible_email}</p>
                )}
                {patient?.responsible_relationship && (
                  <p><Text strong>Grau de Parentesco:</Text> {patient?.responsible_relationship}</p>
                )}
              </>
            ) : (
              <Text type="secondary">Nenhum responsável cadastrado.</Text>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={24} md={12}>
          <Card title="Plano de Saúde">
            {patient?.plan_card_number || patient?.plan_holder ? (
              <>
                {patient?.plan_card_number && (
                  <p><Text strong>Número da Carteirinha:</Text> {patient?.plan_card_number}</p>
                )}
                {patient?.plan_holder && (
                  <p><Text strong>Titular do Plano:</Text> {patient?.plan_holder}</p>
                )}
                {patient?.plan_document && (
                  <p><Text strong>Documento do Titular:</Text> {patient?.plan_document}</p>
                )}
                {patient?.observations && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Observações:</Text>
                    <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{patient?.observations}</p>
                  </div>
                )}
              </>
            ) : (
              <Text type="secondary">Nenhuma informação de plano cadastrada.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
}
