import { Typography, Input, Button } from 'antd';

const { Title } = Typography;

/**
 * Header do inventário com título, busca e botão de adicionar
 * @param {function} onSearch - Callback ao buscar produto
 * @param {function} onAdd - Callback ao adicionar produto
 */
export const InventoryHeader = ({ onSearch, onAdd }) => {
  return (
    <div>
      <Title level={3}>Estoque</Title>
      <div className="inventory-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <Input.Search
          placeholder="Buscar produto..."
          allowClear
          enterButton="Buscar"
          onSearch={onSearch}
          style={{ width: 300, maxWidth: "100%", flex: 1 }}
          className="search-input"
        />

        <Button
          type="primary"
          onClick={onAdd}
          className="add-button"
        >
          + Adicionar Produto
        </Button>
      </div>
    </div>
  );
};
