import { Form, Input, InputNumber, Select, Space, Button } from 'antd';
import { LABEL_COLORS } from '../../constants/labelColors';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Campos de formulário compartilhados para criação/edição de oportunidades
 * @param {object} form - Instância do formulário do Ant Design
 * @param {array} labels - Lista de rótulos disponíveis
 * @param {array} patients - Lista de pacientes disponíveis
 * @param {function} onCreateLabelClick - Callback ao clicar em "Novo Rótulo"
 */
export const OpportunityFormFields = ({
  form,
  labels,
  patients,
  onCreateLabelClick,
}) => {
  return (
    <>
      <Form.Item
        name="title"
        label="Título*"
        rules={[
          { required: true, message: "Este campo é obrigatório" },
          { max: 255, message: "O título deve ter no máximo 255 caracteres" }
        ]}
      >
        <Input 
          placeholder="Título" 
          maxLength={255}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Descrição*"
        rules={[
          { required: true, message: "Este campo é obrigatório" },
          { max: 300, message: "A descrição deve ter no máximo 300 caracteres" }
        ]}
      >
        <TextArea
          rows={4}
          maxLength={300}
          placeholder="Descrição"
          showCount
        />
      </Form.Item>

      <Form.Item
        name="estimated_value"
        label="Valor Estimado"
        rules={[
          {
            validator: (_, value) => {
              if (!value && value !== 0) {
                return Promise.resolve();
              }
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              if (isNaN(numValue)) {
                return Promise.reject(new Error("Valor inválido"));
              }
              if (numValue < 0) {
                return Promise.reject(new Error("O valor não pode ser negativo"));
              }
              if (numValue > 99999999.99) {
                return Promise.reject(new Error("O valor estimado não pode ser maior que R$ 99.999.999,99"));
              }
              return Promise.resolve();
            }
          }
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Valor estimado"
          min={0}
          max={99999999.99}
          step={0.01}
          precision={2}
          prefix="R$"
          decimalSeparator=","
          thousandSeparator="."
        />
      </Form.Item>

      <Form.Item
        name="patient_id"
        label="Paciente"
      >
        <Select
          placeholder="Selecione um paciente (opcional)"
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        >
          {patients.map((patient) => (
            <Option key={patient.id} value={patient.id} label={patient.full_name}>
              {patient.full_name} {patient.cpf ? `- ${patient.cpf}` : ""}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="label"
        label="Rótulo"
      >
        <Select 
          placeholder="Selecione um rótulo" 
          allowClear
          popupRender={(menu) => (
            <>
              {menu}
              <div style={{ padding: "8px", borderTop: "1px solid #f0f0f0" }}>
                <Button
                  type="link"
                  block
                  onClick={onCreateLabelClick}
                  style={{ color: "#1890ff" }}
                >
                  NOVO RÓTULO
                </Button>
              </div>
            </>
          )}
        >
          {labels.map((label) => (
            <Option key={label.id} value={label.name}>
              <Space>
                {label.color && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: label.color
                    }}
                  />
                )}
                {label.name}
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};
