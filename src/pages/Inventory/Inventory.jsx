import { useEffect, useState } from "react";
import { Form } from "antd";
import { useInventory } from "../../hooks/useInventory";
import { InventoryFormModal } from "./components/InventoryFormModal/InventoryFormModal";
import { InventoryTable } from "./components/InventoryTable/InventoryTable";
import { InventoryHeader } from "./components/InventoryHeader/InventoryHeader";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import "./Styles.css";

export default function Inventory() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();

  // Hook customizado
  const {
    loading,
    data,
    messageApi,
    contextHolder,
    fetchInventory,
    createItem,
    updateItem,
    deleteItem,
  } = useInventory();

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const success = await createItem(values);
      if (success) {
        setIsUpdateModalOpen(false);
        form.resetFields();
        setSelectedItem(null);
        await fetchInventory();
      }
    } catch (err) {
      // Erro de validação do formulário
      if (err.errorFields) {
        return;
      }
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const success = await updateItem(selectedItem.key, values);
      if (success) {
        setIsUpdateModalOpen(false);
        form.resetFields();
        setSelectedItem(null);
        await fetchInventory();
      }
    } catch (err) {
      // Erro de validação do formulário
      if (err.errorFields) {
        return;
      }
      console.error(err);
    }
  };

  const handleDelete = async () => {
    const success = await deleteItem(selectedItem.key);
    if (success) {
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      await fetchInventory();
    }
  };

  const handleEdit = (record) => {
    setSelectedItem(record);
    form.setFieldsValue({ name: record.name, quantity: record.quantity });
    setIsUpdateModalOpen(true);
  };

  const handleDeleteClick = (record) => {
    setSelectedItem(record);
    setIsDeleteModalOpen(true);
  };

  const handleAddClick = () => {
    form.resetFields();
    setSelectedItem(null);
    setIsUpdateModalOpen(true);
  };

  return (
    <div>
      {contextHolder}

      <InventoryFormModal
        open={isUpdateModalOpen}
        loading={loading}
        form={form}
        selectedItem={selectedItem}
        onOk={selectedItem ? handleUpdate : handleCreate}
        onCancel={() => {
          setIsUpdateModalOpen(false);
          setSelectedItem(null);
          form.resetFields();
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        loading={loading}
        title="Excluir produto"
        itemName={selectedItem?.name}
        onOk={handleDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
      />

      <InventoryHeader
        onSearch={(value) => fetchInventory(value)}
        onAdd={handleAddClick}
      />

      <InventoryTable
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />
    </div>
  );
}
