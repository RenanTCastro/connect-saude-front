import { Table, Button, Space, Switch, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * Tabela de receitas
 * @param {array} data - Dados das receitas
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onEdit - Callback ao editar receita
 * @param {function} onDelete - Callback ao excluir receita
 * @param {function} onTogglePaid - Callback ao alterar status de pagamento
 */
export const IncomeTable = ({
  data,
  loading,
  onEdit,
  onDelete,
  onTogglePaid,
}) => {
  const columns = [
    {
      title: "Data",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
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
      title: "Tipo",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (type) => (
        <Tag color={type === "Dinheiro" ? "green" : type === "PIX" ? "blue" : "purple"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          R$ {Number(value).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
      align: "right",
    },
    {
      title: "Pago",
      key: "isPaid",
      render: (_, record) => (
        <Switch
          checked={record.isPaid || false}
          onChange={() => onTogglePaid(record, "income")}
          checkedChildren="Sim"
          unCheckedChildren="Não"
        />
      ),
      align: "center",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        const isInstallment = typeof record.id === 'string' && record.id.startsWith('installment_');
        return (
          <Space>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              size="small"
              title={isInstallment ? "Editar receita parcelada (apenas alguns campos)" : "Editar"}
            >
              Editar
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              size="small"
            >
              Excluir
            </Button>
          </Space>
        );
      },
      align: "right",
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
      />
    </div>
  );
};
