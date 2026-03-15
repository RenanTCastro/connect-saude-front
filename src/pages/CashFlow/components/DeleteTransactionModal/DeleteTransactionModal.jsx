import { Modal, Radio, Space, Typography } from 'antd';

const { Text } = Typography;

/**
 * Modal de confirmação de exclusão com opções para parcelas
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} transaction - Transação a ser deletada
 * @param {function} onOk - Callback ao confirmar exclusão
 * @param {function} onCancel - Callback ao cancelar
 * @param {function} onDeleteOptionChange - Callback ao alterar opção de exclusão
 */
export const DeleteTransactionModal = ({
  open,
  loading,
  transaction,
  onOk,
  onCancel,
  onDeleteOptionChange,
}) => {
  if (!transaction) return null;

  return (
    <Modal
      title="Confirmar Exclusão"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Sim, excluir"
      cancelText="Cancelar"
      okButtonProps={{ danger: true }}
      confirmLoading={loading}
    >
      <div>
        <Text style={{ marginBottom: 16, display: 'block' }}>
          Tem certeza que deseja excluir {transaction.type === "income" ? "a receita" : "a despesa"} <strong>{transaction.title}</strong>?
        </Text>
        
        {transaction.isInstallment && (
          <div>
            <Text strong style={{ marginBottom: 12, display: 'block' }}>O que você deseja excluir?</Text>
            <Radio.Group
              value={transaction.deleteOption}
              onChange={(e) => onDeleteOptionChange(e.target.value)}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                <Radio value="single">
                  <strong>Apenas esta parcela</strong>
                  <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                    Remove apenas a parcela selecionada
                  </div>
                </Radio>
                <Radio value="from-this">
                  <strong>Esta e as próximas</strong>
                  <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                    Remove esta parcela e todas as parcelas futuras
                  </div>
                </Radio>
                <Radio value="all">
                  <strong>Toda a recorrência</strong>
                  <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                    Remove todas as parcelas desta {transaction.type === "income" ? "receita" : "despesa"}
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </div>
        )}
      </div>
    </Modal>
  );
};
