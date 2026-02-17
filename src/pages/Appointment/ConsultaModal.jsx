import { Modal, Form, Select, DatePicker, TimePicker, InputNumber, Input, Switch, Space, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./Appointment.css";

const { Option } = Select;
const { TextArea } = Input;

const FOLLOW_UP_OPTIONS = [
  { value: "Sem retorno", label: "Sem retorno" },
  { value: "1 semana", label: "1 semana" },
  { value: "2 semanas", label: "2 semanas" },
  { value: "3 semanas", label: "3 semanas" },
  { value: "1 mês", label: "1 mês" },
  { value: "3 meses", label: "3 meses" },
  { value: "6 meses", label: "6 meses" },
];

const ConsultaModal = ({
  open,
  loading,
  form,
  patients,
  labels,
  isEdit = false,
  onOk,
  onCancel,
  onDelete,
  onCreateLabelClick,
}) => {
  return (
    <Modal
      title={isEdit ? "Editar Consulta" : "Nova Consulta"}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="MARCAR"
      cancelText="FECHAR"
      confirmLoading={loading}
      okButtonProps={{ type: "primary" }}
      width={700}
      footer={[
        isEdit && onDelete ? (
          <Button
            key="delete"
            danger
            icon={<DeleteOutlined />}
            onClick={onDelete}
            style={{ float: "left" }}
          >
            Excluir
          </Button>
        ) : null,
        <Button key="cancel" onClick={onCancel}>
          FECHAR
        </Button>,
        <Button key="submit" type="primary" onClick={onOk} loading={loading}>
          MARCAR
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="patient_id"
          label="Paciente*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <Select
            placeholder="Selecione um paciente"
            showSearch
            allowClear
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
          name="appointment_date"
          label="Data da consulta*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Selecione a data"
          />
        </Form.Item>

        <Form.Item
          name="start_time"
          label="Hora de início*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <TimePicker
            style={{ width: "100%" }}
            format="HH:mm"
            placeholder="Selecione o horário"
            hideDisabledOptions
            disabledTime={() => ({
              disabledHours: () => {
                // Desabilita horas de 0 a 5 (antes das 6h)
                return Array.from({ length: 6 }, (_, i) => i);
              },
            })}
          />
        </Form.Item>

        <Form.Item
          name="duration_minutes"
          label="Duração da consulta (min)*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Duração em minutos"
            min={1}
            step={15}
            addonAfter="min"
          />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Observação"
        >
          <TextArea
            rows={4}
            maxLength={500}
            placeholder="Observações adicionais"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="follow_up_date"
          label="Retornar em"
        >
          <Select placeholder="Selecione o período de retorno">
            {FOLLOW_UP_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="send_confirmation"
          valuePropName="checked"
          label="Enviar confirmação e lembrete automático"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="label_id"
          label="Selecione um rótulo"
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
            {labels
              .filter((label) => label.context === "appointment" || !label.context)
              .map((label) => (
                <Option key={label.id} value={label.id}>
                  <Space>
                    {label.color && (
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: label.color,
                        }}
                      />
                    )}
                    {label.name}
                  </Space>
                </Option>
              ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConsultaModal;

