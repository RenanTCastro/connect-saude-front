import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

/**
 * Tabela de produtos do estoque
 * @param {array} data - Dados dos produtos
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onEdit - Callback ao editar produto
 * @param {function} onDelete - Callback ao excluir produto
 */
export const InventoryTable = ({
  data,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Produto",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantidade",
      dataIndex: "quantity",
      key: "quantity",
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
      />
    </div>
  );
};
