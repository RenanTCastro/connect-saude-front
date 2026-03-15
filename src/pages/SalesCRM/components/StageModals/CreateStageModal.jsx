import { Modal, Form, Input } from 'antd';

/**
 * Modal para criar novo estágio
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {function} onOk - Callback ao confirmar criação
 * @param {function} onCancel - Callback ao cancelar
 */
export const CreateStageModal = ({ open, loading, form, onOk, onCancel }) => (
  <Modal
    title="Criar Novo Estágio"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Criar"
    cancelText="Cancelar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="Nome do Estágio"
        rules={[
          { required: true, message: "Informe o nome do estágio!" },
          { max: 255, message: "O nome do estágio deve ter no máximo 255 caracteres" }
        ]}
      >
        <Input 
          placeholder="Nome do estágio" 
          maxLength={255}
          showCount
        />
      </Form.Item>
    </Form>
  </Modal>
);
