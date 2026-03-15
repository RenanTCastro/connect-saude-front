import { Modal, Form, Input, Button, Typography } from 'antd';
import dayjs from 'dayjs';
import { OpportunityFormFields } from '../../../../components/OpportunityFormFields/OpportunityFormFields';

const { TextArea } = Input;
const { Text } = Typography;

/**
 * Modal para visualizar e editar detalhes da oportunidade
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} opportunity - Dados da oportunidade
 * @param {array} labels - Lista de rótulos disponíveis
 * @param {array} patients - Lista de pacientes disponíveis
 * @param {array} notes - Lista de comentários/notas
 * @param {object} form - Instância do formulário do Ant Design
 * @param {object} noteForm - Instância do formulário de notas
 * @param {function} onOk - Callback ao salvar alterações
 * @param {function} onCancel - Callback ao cancelar
 * @param {function} onAddNote - Callback ao adicionar comentário
 * @param {function} onCreateLabelClick - Callback ao clicar em "Novo Rótulo"
 * @param {function} onDelete - Callback ao excluir oportunidade
 * @param {object} styles - Estilos customizados para o modal
 */
export const OpportunityDetailsModal = ({
  open,
  loading,
  opportunity,
  labels,
  patients,
  notes,
  form,
  noteForm,
  onOk,
  onCancel,
  onAddNote,
  onCreateLabelClick,
  onDelete,
  styles
}) => {
  return (
    <Modal
      title={opportunity?.title || "Detalhes da Oportunidade"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="Salvar Alterações"
      cancelText="Fechar"
      confirmLoading={loading}
      width={600}
      styles={styles}
      footer={[
        <Button
          key="delete"
          danger
          onClick={onDelete}
          style={{ float: "left" }}
        >
          Excluir
        </Button>,
        <Button key="cancel" onClick={onCancel}>
          Fechar
        </Button>,
        <Button key="submit" type="primary" onClick={onOk} loading={loading}>
          Salvar Alterações
        </Button>,
      ]}
    >
      {opportunity && (
        <div>
          <Form form={form} layout="vertical">
            <OpportunityFormFields
              form={form}
              labels={labels}
              patients={patients}
              onCreateLabelClick={onCreateLabelClick}
            />
          </Form>

          <div style={{ marginTop: 24, marginBottom: 16 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Adicionar Comentário:</Text>
            <Form form={noteForm} onFinish={onAddNote} layout="vertical">
              <Form.Item
                name="content"
                rules={[
                  { required: true, message: "Digite um comentário!" },
                  { max: 5000, message: "O comentário deve ter no máximo 5000 caracteres" }
                ]}
              >
                <TextArea
                  rows={3}
                  maxLength={5000}
                  placeholder="Digite seu comentário..."
                  showCount
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Adicionar Comentário
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div style={{ marginTop: 24 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Histórico de Comentários:</Text>
            <div style={{ 
              maxHeight: notes.length > 4 ? "200px" : "auto",
              overflowY: notes.length > 4 ? "auto" : "visible",
              border: "1px solid #f0f0f0",
              borderRadius: 4,
              padding: 12
            }}>
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      marginBottom: 16,
                      paddingBottom: 16,
                      borderBottom: notes.indexOf(note) < notes.length - 1 ? "1px solid #f0f0f0" : "none"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text strong>{note.user_name || "Usuário"}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(note.created_at).format("DD/MM/YYYY [às] HH:mm")}
                      </Text>
                    </div>
                    <Text>{note.content}</Text>
                  </div>
                ))
              ) : (
                <Text type="secondary" style={{ textAlign: "center", display: "block" }}>
                  Nenhum comentário ainda
                </Text>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
