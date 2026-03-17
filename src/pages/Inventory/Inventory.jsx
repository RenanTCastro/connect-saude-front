import { useEffect, useState } from "react";
import { Form } from "antd";
import { useInventory } from "../../hooks/useInventory";
import { InventoryFormModal } from "./components/InventoryFormModal/InventoryFormModal";
import { InventoryQuantityModal } from "./components/InventoryQuantityModal/InventoryQuantityModal";
import { InventoryHistoryModal } from "./components/InventoryHistoryModal/InventoryHistoryModal";
import { InventoryTable } from "./components/InventoryTable/InventoryTable";
import { InventoryHeader } from "./components/InventoryHeader/InventoryHeader";
import { ConfirmDeleteModal } from "../../components/ConfirmDeleteModal/ConfirmDeleteModal";
import "./Styles.css";

export default function Inventory() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQuantityModalOpen, setIsQuantityModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [quantityForm] = Form.useForm();

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
    adjustQuantity,
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
      // Remover quantity do update, pois agora só edita nome e ideal_quantity
      const { quantity, ...updateValues } = values;
      const success = await updateItem(selectedItem.key, updateValues);
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

  const handleAdjustQuantity = async () => {
    try {
      const values = await quantityForm.validateFields();
      const { quantity } = values;
      // Atualizar quantidade diretamente
      const success = await updateItem(selectedItem.key, { quantity });
      if (success) {
        setIsQuantityModalOpen(false);
        quantityForm.resetFields();
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
    form.setFieldsValue({ 
      name: record.name, 
      ideal_quantity: record.ideal_quantity || null 
    });
    setIsUpdateModalOpen(true);
  };

  const handleAdjustQuantityClick = (record) => {
    setSelectedItem(record);
    quantityForm.resetFields();
    quantityForm.setFieldsValue({ quantity: record.quantity });
    setIsQuantityModalOpen(true);
  };

  const handleHistoryClick = (record) => {
    setSelectedItem(record);
    setIsHistoryModalOpen(true);
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

      <InventoryQuantityModal
        open={isQuantityModalOpen}
        loading={loading}
        form={quantityForm}
        selectedItem={selectedItem}
        currentQuantity={selectedItem?.quantity}
        onOk={handleAdjustQuantity}
        onCancel={() => {
          setIsQuantityModalOpen(false);
          setSelectedItem(null);
          quantityForm.resetFields();
        }}
      />

      <InventoryHistoryModal
        open={isHistoryModalOpen}
        item={selectedItem}
        onCancel={() => {
          setIsHistoryModalOpen(false);
          setSelectedItem(null);
        }}
      />

      <InventoryTable
        data={data}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAdjustQuantity={handleAdjustQuantityClick}
        onHistory={handleHistoryClick}
      />
    </div>
  );
}
