import { Modal, Form, InputNumber } from 'antd';

/**
 * Modal para alterar quantidade do produto (define quantidade absoluta)
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {object} selectedItem - Item selecionado
 * @param {number} currentQuantity - Quantidade atual do produto
 * @param {function} onOk - Callback ao confirmar
 * @param {function} onCancel - Callback ao cancelar
 */
export const InventoryQuantityModal = ({
  open,
  loading,
  form,
  selectedItem,
  currentQuantity,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={`Alterar Quantidade - ${selectedItem?.name}`}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Confirmar"
      cancelText="Cancelar"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Quantidade Atual"
          style={{ marginBottom: 16 }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: "#1890ff" }}>
            {currentQuantity || 0} unidades
          </div>
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Nova Quantidade"
          rules={[
            { required: true, message: "Informe a quantidade!" },
            {
              validator: (_, value) => {
                if (!value && value !== 0) {
                  return Promise.reject(new Error("Informe a quantidade!"));
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
            placeholder="Digite a nova quantidade"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
