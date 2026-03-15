import { Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { DateRangePicker } from '../../../../components/DateRangePicker/DateRangePicker';
import { PeriodStatsCards } from '../PeriodStatsCards/PeriodStatsCards';
import { IncomeTable } from '../IncomeTable/IncomeTable';
import { ExpenseTable } from '../ExpenseTable/ExpenseTable';

const { Title } = Typography;

/**
 * Aba de fluxo por período
 * @param {array} dateRange - Range de datas inicial
 * @param {function} onDateRangeChange - Callback ao alterar data
 * @param {object} stats - Estatísticas do período
 * @param {array} incomes - Lista de receitas
 * @param {array} expenses - Lista de despesas
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onAddIncome - Callback ao adicionar receita
 * @param {function} onAddExpense - Callback ao adicionar despesa
 * @param {function} onEditIncome - Callback ao editar receita
 * @param {function} onEditExpense - Callback ao editar despesa
 * @param {function} onDeleteIncome - Callback ao excluir receita
 * @param {function} onDeleteExpense - Callback ao excluir despesa
 * @param {function} onTogglePaid - Callback ao alterar status de pagamento
 */
export const PeriodTab = ({
  dateRange,
  onDateRangeChange,
  stats,
  incomes,
  expenses,
  loading,
  onAddIncome,
  onAddExpense,
  onEditIncome,
  onEditExpense,
  onDeleteIncome,
  onDeleteExpense,
  onTogglePaid,
}) => {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
        />
      </div>

      <PeriodStatsCards stats={stats} />

      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 16,
            }}
            className="section-header"
          >
            <Title level={4} style={{ margin: 0 }}>
              Receitas
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddIncome}
              block
              className="mobile-button"
            >
              Nova Receita
            </Button>
          </div>
          <IncomeTable
            data={incomes}
            loading={loading}
            onEdit={onEditIncome}
            onDelete={onDeleteIncome}
            onTogglePaid={onTogglePaid}
          />
        </div>

        <div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginBottom: 16,
            }}
            className="section-header"
          >
            <Title level={4} style={{ margin: 0 }}>
              Despesas
            </Title>
            <Button
              type="primary"
              danger
              icon={<PlusOutlined />}
              onClick={onAddExpense}
              block
              className="mobile-button"
            >
              Nova Despesa
            </Button>
          </div>
          <ExpenseTable
            data={expenses}
            loading={loading}
            onEdit={onEditExpense}
            onDelete={onDeleteExpense}
            onTogglePaid={onTogglePaid}
          />
        </div>
      </Space>
    </div>
  );
};
