import { Row, Col } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { StatCard } from '../../../../components/StatCard/StatCard';

/**
 * Cards de estatísticas do período
 * @param {object} stats - Objeto com as estatísticas do período
 */
export const PeriodStatsCards = ({ stats }) => {
  return (
    <>
      {/* Receitas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<ArrowUpOutlined />}
            label="Receita Total"
            value={stats.totalIncome}
            color="#52c41a"
            iconColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Recebido"
            value={stats.received}
            color="#52c41a"
            iconColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<ArrowUpOutlined />}
            label="A Receber"
            value={stats.toReceive}
            color="#1890ff"
            iconColor="#1890ff"
          />
        </Col>
      </Row>

      {/* Despesas */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Despesas Pagas"
            value={stats.paidExpenses}
            color="#ff4d4f"
            iconColor="#ff4d4f"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<ArrowDownOutlined />}
            label="Despesas a Pagar"
            value={stats.toPayExpenses}
            color="#faad14"
            iconColor="#faad14"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<ArrowDownOutlined />}
            label="Total de Despesas"
            value={stats.totalExpense}
            color="#ff4d4f"
            iconColor="#ff4d4f"
          />
        </Col>
      </Row>

      {/* Saldos */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <StatCard
            icon={<DollarOutlined />}
            label="Saldo em Caixa"
            value={stats.cashBalance}
            color={stats.cashBalance >= 0 ? "#52c41a" : "#ff4d4f"}
            iconColor={stats.cashBalance >= 0 ? "#52c41a" : "#ff4d4f"}
          />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard
            icon={<DollarOutlined />}
            label="Saldo Projetado"
            value={stats.projectedBalance}
            color={stats.projectedBalance >= 0 ? "#52c41a" : "#ff4d4f"}
            iconColor={stats.projectedBalance >= 0 ? "#52c41a" : "#ff4d4f"}
          />
        </Col>
      </Row>
    </>
  );
};
