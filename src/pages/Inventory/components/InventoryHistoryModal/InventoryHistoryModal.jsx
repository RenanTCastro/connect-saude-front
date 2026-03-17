import { Modal, Table, Tag, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import api from '../../../../services/api';

const TYPE_LABELS = {
  entrada_inicial: 'Entrada inicial',
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
};

const TYPE_COLORS = {
  entrada_inicial: 'blue',
  entrada: 'green',
  saida: 'red',
  ajuste: 'orange',
};

/**
 * Modal para exibir o histórico de alterações de quantidade do produto
 */
export const InventoryHistoryModal = ({
  open,
  onCancel,
  item,
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (open && item?.key) {
      setLoading(true);
      api.get(`/inventory/${item.key}/history`)
        .then((res) => {
          setHistory(res.data.history || []);
        })
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
    }
  }, [open, item?.key]);

  const columns = [
    {
      title: 'Data',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => val ? new Date(val).toLocaleString('pt-BR') : '-',
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => {
        const Icon = type === 'entrada' || type === 'entrada_inicial' ? ArrowUpOutlined : ArrowDownOutlined;
        return (
          <Tag color={TYPE_COLORS[type] || 'default'} icon={<Icon />}>
            {TYPE_LABELS[type] || type}
          </Tag>
        );
      },
    },
    {
      title: 'Anterior',
      dataIndex: 'previous_quantity',
      key: 'previous_quantity',
      width: 100,
      align: 'right',
    },
    {
      title: 'Variação',
      dataIndex: 'change_amount',
      key: 'change_amount',
      width: 100,
      align: 'right',
      render: (val) => (
        <span style={{ color: val >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 500 }}>
          {val >= 0 ? '+' : ''}{val}
        </span>
      ),
    },
    {
      title: 'Nova Qtd',
      dataIndex: 'new_quantity',
      key: 'new_quantity',
      width: 100,
      align: 'right',
    },
    {
      title: 'Usuário',
      dataIndex: 'user_name',
      key: 'user_name',
      ellipsis: true,
      render: (val) => val || '-',
    },
  ];

  return (
    <Modal
      title={`Histórico de alterações - ${item?.name || ''}`}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={720}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={history}
          columns={columns}
          rowKey="id"
          scroll={{ x: true }}
          pagination={history.length > 10 ? { pageSize: 10 } : false}
          locale={{ emptyText: 'Nenhuma alteração registrada' }}
          size="small"
        />
      )}
    </Modal>
  );
};
