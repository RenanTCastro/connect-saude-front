import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, WarningOutlined, HistoryOutlined } from "@ant-design/icons";

/**
 * Tabela de produtos do estoque
 * @param {array} data - Dados dos produtos
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onEdit - Callback ao editar produto
 * @param {function} onDelete - Callback ao excluir produto
 * @param {function} onAdjustQuantity - Callback ao alterar quantidade
 * @param {function} onHistory - Callback ao ver histórico
 */
export const InventoryTable = ({
  data,
  loading,
  onEdit,
  onDelete,
  onAdjustQuantity,
  onHistory,
}) => {
  const columns = [
    {
      title: "Produto",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        const isBelowIdeal = record.ideal_quantity && record.quantity < record.ideal_quantity;
        return (
          <Space>
            {text}
            {isBelowIdeal && (
              <Tooltip title={`Quantidade abaixo do ideal (${record.ideal_quantity})`}>
                <Tag color="warning" icon={<WarningOutlined />}>
                  Abaixo do ideal
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Quantidade",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity, record) => {
        const isBelowIdeal = record.ideal_quantity && quantity < record.ideal_quantity;
        return (
          <span style={{ 
            color: isBelowIdeal ? "#ff4d4f" : "inherit",
            fontWeight: isBelowIdeal ? 600 : "normal"
          }}>
            {quantity}
            {record.ideal_quantity && (
              <span style={{ color: "#8c8c8c", fontSize: 12, marginLeft: 8 }}>
                / {record.ideal_quantity} ideal
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "action",
      render: (_, record) => (
        <Space>
          <Button 
            type="default" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
            className="action-button"
          >
            <span className="button-text">Editar</span>
          </Button>

          <Button 
            type="primary"
            icon={<PlusOutlined />} 
            onClick={() => onAdjustQuantity(record)}
            className="action-button"
          >
            <span className="button-text">Alterar Qtd</span>
          </Button>

          <Button 
            type="default"
            icon={<HistoryOutlined />} 
            onClick={() => onHistory(record)}
            className="action-button"
          >
            <span className="button-text">Histórico</span>
          </Button>

          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => onDelete(record)}
            className="action-button"
          >
            <span className="button-text">Excluir</span>
          </Button>
        </Space>
      ),
      align: 'end'
    },
  ];

  return (
    <div className="table-wrapper">
      <Table
        dataSource={data}
        columns={columns}
        loading={loading}
        pagination={false}
        scroll={{ x: true }}
        showHeader={data.length > 0}
        locale={{ emptyText: "Nenhum dado disponível" }}
        rowClassName={(record) => {
          const isBelowIdeal = record.ideal_quantity && record.quantity < record.ideal_quantity;
          return isBelowIdeal ? "inventory-row-warning" : "";
        }}
      />
    </div>
  );
};
