import { Row, Col, Card, Typography } from 'antd';

const { Title, Text } = Typography;

/**
 * Cards de estatísticas de saldo a receber
 * @param {object} receivableStats - Objeto com as estatísticas de saldo a receber
 */
export const ReceivableStatsCards = ({ receivableStats }) => {
  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>
          Saldo Total a Receber
        </Title>
        <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
          R$ {receivableStats.total.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Title>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Text type="secondary">Vencidas</Text>
            <Title level={4} style={{ margin: 0, color: "#ff4d4f" }}>
              R$ {receivableStats.overdue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Text type="secondary">Este Mês</Text>
            <Title level={4} style={{ margin: 0 }}>
              R$ {receivableStats.thisMonth.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Text type="secondary">Próximo Mês</Text>
            <Title level={4} style={{ margin: 0 }}>
              R$ {receivableStats.nextMonth.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Title>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Text type="secondary">Futuro</Text>
            <Title level={4} style={{ margin: 0 }}>
              R$ {receivableStats.future.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Title>
          </Card>
        </Col>
      </Row>
    </>
  );
};
