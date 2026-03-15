import { Typography } from 'antd';
import { ReceivableStatsCards } from '../ReceivableStatsCards/ReceivableStatsCards';
import { ReceivableTable } from '../ReceivableTable/ReceivableTable';

const { Title } = Typography;

/**
 * Aba de saldo a receber
 * @param {object} receivableStats - Estatísticas de saldo a receber
 * @param {array} pendingInstallments - Lista de parcelas pendentes
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onMarkAsPaid - Callback ao marcar parcela como paga
 */
export const ReceivablesTab = ({
  receivableStats,
  pendingInstallments,
  loading,
  onMarkAsPaid,
}) => {
  return (
    <div>
      <ReceivableStatsCards receivableStats={receivableStats} />

      <Title level={4} style={{ marginBottom: 16 }}>
        Parcelas Pendentes
      </Title>
      <ReceivableTable
        data={pendingInstallments}
        loading={loading}
        onMarkAsPaid={onMarkAsPaid}
      />
    </div>
  );
};
