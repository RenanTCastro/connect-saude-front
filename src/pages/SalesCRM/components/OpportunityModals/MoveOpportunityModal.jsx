import { Modal, Form, Select } from 'antd';

const { Option } = Select;

/**
 * Modal para mover oportunidade entre estágios
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {array} stages - Lista de estágios disponíveis
 * @param {function} onOk - Callback ao confirmar movimentação
 * @param {function} onCancel - Callback ao cancelar
 */
export const MoveOpportunityModal = ({ open, loading, form, stages, onOk, onCancel }) => (
  <Modal
    title="Mover Oportunidade"
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    okText="Mover"
    cancelText="Cancelar"
    confirmLoading={loading}
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="stage_id"
        label="Mover para estágio"
        rules={[{ required: true, message: "Selecione o estágio!" }]}
      >
        <Select placeholder="Selecione o estágio">
          {stages.map((stage) => (
            <Option key={stage.id} value={stage.id}>
              {stage.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </Form>
  </Modal>
);
