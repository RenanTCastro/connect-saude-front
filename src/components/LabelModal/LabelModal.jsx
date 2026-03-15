import { Modal, Form, Input, Select, Space } from 'antd';
import { LABEL_COLORS } from '../../constants/labelColors';

const { Option } = Select;

/**
 * Modal para criar/editar rótulos
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {function} onOk - Callback ao salvar
 * @param {function} onCancel - Callback ao cancelar
 */
export const LabelModal = ({ open, loading, form, onOk, onCancel }) => {
  return (
    <Modal
      title="Novo rótulo"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Salvar"
      cancelText="Fechar"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="color"
          label="Cor*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <Select placeholder="Selecione uma cor">
            {LABEL_COLORS.map((color) => (
              <Option key={color.value} value={color.value}>
                <Space>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: color.value
                    }}
                  />
                  {color.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="name"
          label="Nome do rótulo*"
          rules={[
            { required: true, message: "Este campo é obrigatório" },
            { max: 100, message: "O nome do rótulo deve ter no máximo 100 caracteres" }
          ]}
        >
          <Input 
            placeholder="Nome do rótulo" 
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
