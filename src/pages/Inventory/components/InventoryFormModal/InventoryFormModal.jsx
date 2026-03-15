import { Modal, Form, Input, InputNumber } from 'antd';

/**
 * Modal para criar/editar produto no estoque
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {object} selectedItem - Item selecionado para edição (null para criar)
 * @param {function} onOk - Callback ao confirmar
 * @param {function} onCancel - Callback ao cancelar
 */
export const InventoryFormModal = ({
  open,
  loading,
  form,
  selectedItem,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={selectedItem ? "Atualizar Produto" : "Adicionar Produto"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText={selectedItem ? "Salvar" : "Adicionar"}
      cancelText="Cancelar"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Nome do produto"
          rules={[
            { required: true, message: "Informe o nome do produto!" },
            { max: 255, message: "O nome deve ter no máximo 255 caracteres" }
          ]}
        >
          <Input 
            placeholder="Nome do produto" 
            maxLength={255}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Quantidade"
          rules={[
            { required: true, message: "Informe a quantidade!" },
            {
              validator: (_, value) => {
                if (!value && value !== 0) {
                  return Promise.resolve();
                }
                const numValue = typeof value === 'string' ? parseInt(value) : value;
                if (isNaN(numValue)) {
                  return Promise.reject(new Error("Valor inválido"));
                }
                if (numValue < 0) {
                  return Promise.reject(new Error("A quantidade não pode ser negativa"));
                }
                if (numValue > 999999) {
                  return Promise.reject(new Error("A quantidade não pode ser maior que 999.999"));
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <InputNumber
            min={0}
            max={999999}
            style={{ width: "100%" }}
            placeholder="Quantidade"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
