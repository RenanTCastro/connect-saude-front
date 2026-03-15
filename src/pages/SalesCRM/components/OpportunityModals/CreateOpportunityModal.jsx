import { Modal, Form } from 'antd';
import { OpportunityFormFields } from '../../../../components/OpportunityFormFields/OpportunityFormFields';

/**
 * Modal para criar nova oportunidade
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {array} labels - Lista de rótulos disponíveis
 * @param {array} patients - Lista de pacientes disponíveis
 * @param {function} onOk - Callback ao confirmar criação
 * @param {function} onCancel - Callback ao cancelar
 * @param {function} onCreateLabelClick - Callback ao clicar em "Novo Rótulo"
 * @param {object} styles - Estilos customizados para o modal
 */
export const CreateOpportunityModal = ({
  open,
  loading,
  form,
  labels,
  patients,
  onOk,
  onCancel,
  onCreateLabelClick,
  styles
}) => {
  return (
    <Modal
      title="Criar Nova Oportunidade"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Criar"
      cancelText="Fechar"
      confirmLoading={loading}
      styles={styles}
    >
      <Form form={form} layout="vertical">
        <OpportunityFormFields
          form={form}
          labels={labels}
          patients={patients}
          onCreateLabelClick={onCreateLabelClick}
        />
      </Form>
    </Modal>
  );
};
