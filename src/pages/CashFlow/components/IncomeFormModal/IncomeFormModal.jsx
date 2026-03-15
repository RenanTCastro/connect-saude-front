import { Modal, Form, Input, InputNumber, DatePicker, Select, Switch, Typography } from 'antd';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

/**
 * Modal para criar/editar receita
 * @param {boolean} open - Controla a visibilidade do modal
 * @param {boolean} loading - Estado de carregamento
 * @param {object} form - Instância do formulário do Ant Design
 * @param {object} editingItem - Item sendo editado (null para criar)
 * @param {boolean} isEditingInstallment - Se está editando uma parcela
 * @param {array} patients - Lista de pacientes
 * @param {function} onOk - Callback ao confirmar
 * @param {function} onCancel - Callback ao cancelar
 * @param {function} onInstallmentToggle - Callback ao alterar switch de parcelas
 */
export const IncomeFormModal = ({
  open,
  loading,
  form,
  editingItem,
  isEditingInstallment,
  patients,
  onOk,
  onCancel,
  onInstallmentToggle,
}) => {
  const hasInstallments = Form.useWatch('hasInstallments', form);

  return (
    <Modal
      title={editingItem ? (isEditingInstallment ? "Editar Receita Parcelada" : "Editar Receita") : "Nova Receita"}
      open={open}
      onOk={() => form.submit()}
      onCancel={onCancel}
      okText={editingItem ? "Salvar" : "Criar"}
      cancelText="Cancelar"
      width="90%"
      style={{ maxWidth: 600 }}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={onOk}>
        <Form.Item
          name="title"
          label="Título"
          rules={[
            { required: true, message: "Informe o título!" },
            { max: 255, message: "O título deve ter no máximo 255 caracteres" }
          ]}
        >
          <Input 
            placeholder="Título da receita" 
            maxLength={255}
            showCount
          />
        </Form.Item>

        <Form.Item 
          name="description" 
          label="Descrição"
          rules={[
            { max: 1000, message: "A descrição deve ter no máximo 1000 caracteres" }
          ]}
        >
          <TextArea 
            rows={3} 
            placeholder="Descrição da receita" 
            maxLength={1000}
            showCount
          />
        </Form.Item>

        {!isEditingInstallment && (
          <>
            <Form.Item
              name="amount"
              label="Valor"
              rules={[
                { required: true, message: "Informe o valor!" },
                {
                  validator: (_, value) => {
                    if (!value && value !== 0) {
                      return Promise.reject(new Error("Informe o valor!"));
                    }
                    const numValue = typeof value === 'string' ? parseFloat(value) : value;
                    if (isNaN(numValue)) {
                      return Promise.reject(new Error("Valor inválido"));
                    }
                    if (numValue < 0) {
                      return Promise.reject(new Error("O valor não pode ser negativo"));
                    }
                    if (numValue > 999999.99) {
                      return Promise.reject(new Error("O valor não pode ser maior que 999.999,99"));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                min={0}
                max={999999.99}
                step={0.01}
                style={{ width: "100%" }}
                prefix="R$"
                placeholder="0,00"
                decimalSeparator=","
                thousandSeparator="."
              />
            </Form.Item>

            <Form.Item
              name="dueDate"
              label="Data de Vencimento"
              rules={[{ required: !hasInstallments, message: "Informe a data de vencimento!" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                disabled={hasInstallments}
              />
            </Form.Item>
          </>
        )}

        {isEditingInstallment && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: "#f0f0f0", 
            borderRadius: "4px",
            marginBottom: "16px"
          }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              <strong>Nota:</strong> Ao editar uma receita parcelada, você pode alterar apenas o título, descrição, tipo de pagamento e paciente. 
              O valor e as datas das parcelas não podem ser alterados.
            </Text>
          </div>
        )}

        <Form.Item name="patientId" label="Paciente">
          <Select
            placeholder="Selecione o paciente"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          >
            {patients.map((patient) => (
              <Option key={patient.id} value={patient.id} label={patient.full_name}>
                {patient.full_name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="paymentType"
          label="Tipo de Pagamento"
          rules={[{ required: true, message: "Selecione o tipo de pagamento!" }]}
        >
          <Select placeholder="Selecione o tipo">
            <Option value="Dinheiro">Dinheiro</Option>
            <Option value="PIX">PIX</Option>
            <Option value="Cartão">Cartão</Option>
            <Option value="Transferência">Transferência</Option>
          </Select>
        </Form.Item>

        {!editingItem && !isEditingInstallment && (
          <Form.Item name="hasInstallments" valuePropName="checked">
            <Switch 
              checkedChildren="Parcelado" 
              unCheckedChildren="À vista"
              onChange={(checked) => {
                onInstallmentToggle(checked);
                if (!checked) {
                  form.setFieldsValue({
                    installmentCount: undefined,
                    firstInstallmentDate: undefined,
                    intervalType: undefined,
                  });
                }
              }}
            />
          </Form.Item>
        )}

        {hasInstallments && !editingItem && !isEditingInstallment && (
          <>
            <Form.Item
              name="installmentCount"
              label="Número de Parcelas"
              rules={[
                {
                  required: true,
                  message: "Informe o número de parcelas!",
                },
                {
                  validator: (_, value) => {
                    if (!value && value !== 0) {
                      return Promise.resolve();
                    }
                    const numValue = typeof value === 'string' ? parseInt(value) : value;
                    if (isNaN(numValue)) {
                      return Promise.reject(new Error("Valor inválido"));
                    }
                    if (numValue < 2) {
                      return Promise.reject(new Error("O número de parcelas deve ser no mínimo 2"));
                    }
                    if (numValue > 60) {
                      return Promise.reject(new Error("O número de parcelas não pode ser maior que 60"));
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber min={2} max={60} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="firstInstallmentDate"
              label="Data da Primeira Parcela"
              rules={[
                {
                  required: true,
                  message: "Informe a data da primeira parcela!",
                },
              ]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>

            <Form.Item
              name="intervalType"
              label="Intervalo entre Parcelas"
              rules={[{ required: true, message: "Selecione o intervalo!" }]}
            >
              <Select placeholder="Selecione o intervalo">
                <Option value="daily">Diário</Option>
                <Option value="weekly">Semanal</Option>
                <Option value="monthly">Mensal</Option>
              </Select>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
