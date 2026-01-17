import { useEffect, useState } from "react";
import { Table, Button, Space, InputNumber, message, Form, Modal, Input, Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../../services/api";

import "./Styles.css";

const { Title } = Typography;

export default function InventoryTable() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [form] = Form.useForm();

  const fetchInventory = async (searchName = "") => {
    try {
      setLoading(true);
      const res = await api.get("/inventory", {
        params: { name: searchName },
      });
      const formatted = res.data.map((item) => ({
        key: item.id,
        name: item.name,
        quantity: item.quantity,
      }));
      setData(formatted);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar produtos no estoque");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  const handleCreate = async () => {
    try {
      setLoading(true);
      setIsUpdateModalOpen(false);
      const values = await form.validateFields();
      await api.post("/inventory", values);
      messageApi.success("Produto adicionado com sucesso!");
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao adicionar produto!");
    } finally {
      setLoading(false);
      fetchInventory();
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      setIsUpdateModalOpen(false);
      const values = await form.validateFields();
      await api.put(`/inventory/${selectedItem.key}`, values);
      messageApi.success("Produto atualizado com sucesso!");
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao atualizar produto!");
    } finally {
      setLoading(false);
      fetchInventory();
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setIsDeleteModalOpen(false)
      await api.delete(`/inventory/${selectedItem.key}`);
      messageApi.success("Produto removido com sucesso!");
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao excluir produto!");
    } finally {
      setLoading(false);
      fetchInventory();
    }
  };

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
            onClick={() => {
              setSelectedItem(record);
              form.setFieldsValue({ name: record.name, quantity: record.quantity });
              setIsUpdateModalOpen(true);
            }}
            className="action-button"
          >
            <span className="button-text">Editar</span>
          </Button>

          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              setIsDeleteModalOpen(true)
              setSelectedItem(record);
            }}
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
    <div>
      {contextHolder}

    <Modal
      title={selectedItem ? "Atualizar Produto" : "Adicionar Produto"}
      open={isUpdateModalOpen}
      onOk={selectedItem ? handleUpdate : handleCreate}
      onCancel={() => setIsUpdateModalOpen(false)}
      okText={selectedItem ? "Salvar" : "Adicionar"}
      cancelText="Cancelar"
    >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nome do produto"
            rules={[{ required: true, message: "Informe o nome do produto!" }]}
          >
            <Input placeholder="Nome do produto" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantidade"
            rules={[{ required: true, message: "Informe a quantidade!" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Quantidade"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Excluir produto"
        open={isDeleteModalOpen}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>
          Tem certeza que deseja excluir <strong>{selectedItem?.name}</strong> do estoque?
        </p>
      </Modal>

      <div>
        <Title level={3}>Estoque</Title>
        <div className="inventory-header" style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
          <Input.Search
            placeholder="Buscar produto..."
            allowClear
            enterButton="Buscar"
            onSearch={(value) => fetchInventory(value)}
            style={{ width: 300, maxWidth: "100%", flex: 1 }}
            className="search-input"
          />

          <Button
            type="primary"
            onClick={() => {
              form.resetFields();
              setSelectedItem(null);
              setIsUpdateModalOpen(true);
            }}
            className="add-button"
          >
            + Adicionar Produto
          </Button>
        </div>
      </div>
      <div className="table-wrapper">
        <Table
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
}
