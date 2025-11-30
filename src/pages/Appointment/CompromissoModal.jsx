import { Modal, Form, Input, DatePicker, TimePicker, Checkbox, InputNumber, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./Appointment.css";

const { TextArea } = Input;

const CompromissoModal = ({
  open,
  loading,
  form,
  isEdit = false,
  onOk,
  onCancel,
  onDelete,
}) => {
  const isAllDay = Form.useWatch("all_day", form);

  return (
    <Modal
      title={isEdit ? "Editar Compromisso" : "Novo Compromisso"}
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
          name="title"
          label="Título do compromisso*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <Input
            maxLength={255}
            placeholder="Título do compromisso"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Descrição"
        >
          <TextArea
            rows={4}
            maxLength={500}
            placeholder="Descrição do compromisso"
            showCount
          />
        </Form.Item>

        <Form.Item
          name="all_day"
          valuePropName="checked"
        >
          <Checkbox>Dia inteiro</Checkbox>
        </Form.Item>

        <Form.Item
          name="start_date"
          label="Data de início*"
          rules={[{ required: true, message: "Este campo é obrigatório" }]}
        >
          <DatePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            placeholder="Selecione a data"
          />
        </Form.Item>

        {!isAllDay && (
          <>
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
              label="Duração do compromisso (min)*"
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
          </>
        )}

        {/* <Form.Item
          name="recurring"
          valuePropName="checked"
        >
          <Checkbox disabled>Repetir compromisso</Checkbox>
        </Form.Item> */}
      </Form>
    </Modal>
  );
};

export default CompromissoModal;

