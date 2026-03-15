import { Modal } from 'antd';

/**
 * Modal genérico para confirmação de exclusão
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {string} title - Título do modal
 * @param {string} itemName - Nome do item a ser excluído
 * @param {string} warningMessage - Mensagem de aviso adicional (opcional)
 * @param {function} onOk - Callback ao confirmar exclusão
 * @param {function} onCancel - Callback ao cancelar
 */
export const ConfirmDeleteModal = ({
  open,
  loading,
  title,
  itemName,
  warningMessage,
  onOk,
  onCancel,
}) => {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Sim, excluir"
      cancelText="Cancelar"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
    >
      <p>
        Tem certeza que deseja excluir <strong>{itemName}</strong>?
      </p>
      {warningMessage && (
        <p style={{ color: "#ff4d4f" }}>{warningMessage}</p>
      )}
    </Modal>
  );
};
