import { Table, Button, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * Tabela de saldo a receber
 * @param {array} data - Dados das parcelas pendentes
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onMarkAsPaid - Callback ao marcar parcela como paga
 */
export const ReceivableTable = ({
  data,
  loading,
  onMarkAsPaid,
}) => {
  const columns = [
    {
      title: "Vencimento",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => {
        const isOverdue = dayjs(date).isBefore(dayjs(), "day");
        return (
          <Text style={{ color: isOverdue ? "#ff4d4f" : undefined }}>
            {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Paciente",
      dataIndex: "patientName",
      key: "patientName",
    },
    {
      title: "Parcela",
      dataIndex: "installment",
      key: "installment",
      render: (inst) => `${inst.current}/${inst.total}`,
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value, record) => {
        const isOverdue = dayjs(record.dueDate).isBefore(dayjs(), "day");
        return (
          <Text strong style={{ color: isOverdue ? "#ff4d4f" : "#52c41a" }}>
            R$ {Number(value).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        );
      },
      align: "right",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => onMarkAsPaid(record.id)}
          size="small"
          className="mark-paid-button"
        >
          Marcar como Paga
        </Button>
      ),
    },
  ];

  return (
    <div className="table-wrapper">
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
        rowKey="id"
        scroll={{ x: true }}
        showHeader={data.length > 0}
        locale={{ emptyText: "Nenhum dado disponível" }}
        rowClassName={(record) =>
          dayjs(record.dueDate).isBefore(dayjs(), "day")
            ? "overdue-row"
            : ""
        }
      />
    </div>
  );
};
