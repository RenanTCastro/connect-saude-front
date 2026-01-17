import { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import {
  Card,
  Button,
  Space,
  Select,
  Typography,
  message,
  Form,
  Modal,
  Input,
} from "antd";
import {
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../services/api";
import ConsultaModal from "./ConsultaModal";
import CompromissoModal from "./CompromissoModal";
import "./Appointment.css";

const { Title } = Typography;
const { Option } = Select;

// Constantes para rótulos
const LABEL_COLORS = [
  { value: "#1890ff", name: "Azul" },
  { value: "#ff4d4f", name: "Vermelho" },
  { value: "#52c41a", name: "Verde" },
  { value: "#faad14", name: "Amarelo" },
  { value: "#722ed1", name: "Roxo" },
  { value: "#eb2f96", name: "Rosa" },
  { value: "#13c2c2", name: "Ciano" },
  { value: "#fa8c16", name: "Laranja" },
];

// Componente CreateLabelModal
const CreateLabelModal = ({ open, loading, form, onOk, onCancel }) => (
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
        rules={[{ required: true, message: "Este campo é obrigatório" }]}
      >
        <Input placeholder="Nome do rótulo" />
      </Form.Item>
    </Form>
  </Modal>
);

export default function Appointment() {
  const calendarRef = useRef(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [events, setEvents] = useState([]);
  const [viewType, setViewType] = useState("timeGridWeek");
  const [currentDateRange, setCurrentDateRange] = useState("");
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [isCompromissoModalOpen, setIsCompromissoModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [labels, setLabels] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [isNewLabelModalOpen, setIsNewLabelModalOpen] = useState(false);

  const [consultaForm] = Form.useForm();
  const [compromissoForm] = Form.useForm();
  const [labelForm] = Form.useForm();

  // Fetch appointments
  const fetchAppointments = useCallback(async (start, end) => {
    try {
      const res = await api.get("/appointments", {
        params: {
          start_date: start,
          end_date: end,
        },
      });

      const formattedEvents = res.data.map((appointment) => ({
        id: appointment.id.toString(),
        title:
          appointment.type === "consulta"
            ? appointment.patient?.full_name || "Paciente não informado"
            : appointment.title || "Compromisso",
        start: appointment.start_datetime,
        end: appointment.end_datetime,
        backgroundColor:
          appointment.label?.color ||
          (appointment.type === "consulta" ? "#52c41a" : "#1890ff"),
        borderColor:
          appointment.label?.color ||
          (appointment.type === "consulta" ? "#52c41a" : "#1890ff"),
        extendedProps: {
          type: appointment.type,
          appointment: appointment,
        },
      }));

      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao carregar eventos.");
    }
  }, [messageApi]);

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch labels - filtrar por contexto appointment
  const fetchLabels = useCallback(async () => {
    try {
      const res = await api.get("/labels", {
        params: { is_active: true },
      });
      // Filtrar labels com contexto "appointment" ou sem contexto (null)
      const filteredLabels = res.data.filter(
        (label) => label.context === "appointment" || !label.context
      );
      setLabels(filteredLabels);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchLabels();
  }, [fetchPatients, fetchLabels]);

  // Handle date range change
  const handleDatesSet = (arg) => {
    const start = dayjs(arg.start).format("YYYY-MM-DD");
    const end = dayjs(arg.end).format("YYYY-MM-DD");
    fetchAppointments(start, end);

    // Update date range display
    if (arg.view.type === "timeGridWeek") {
      setCurrentDateRange(
        `${dayjs(arg.start).format("DD/MM/YYYY")} - ${dayjs(arg.end).subtract(1, "day").format("DD/MM/YYYY")}`
      );
    } else if (arg.view.type === "timeGridDay") {
      setCurrentDateRange(dayjs(arg.start).format("DD/MM/YYYY"));
    } else {
      setCurrentDateRange("Agenda");
    }
  };

  // Handle view change
  const handleViewChange = (value) => {
    setViewType(value);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(value);
    }
  };

  // Handle navigation
  const handlePrev = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  // Handle slot selection (create new appointment)
  const handleSelect = (selectInfo) => {
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    // Pre-fill form with selected time
    consultaForm.setFieldsValue({
      appointment_date: dayjs(selectInfo.start),
      start_time: dayjs(selectInfo.start),
      duration_minutes: Math.round((selectInfo.end - selectInfo.start) / (1000 * 60)),
    });
    setIsConsultaModalOpen(true);
  };

  // Helper function to refresh calendar events
  const refreshCalendarEvents = useCallback(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      const view = calendarApi.view;
      const start = dayjs(view.activeStart).format("YYYY-MM-DD");
      const end = dayjs(view.activeEnd).format("YYYY-MM-DD");
      fetchAppointments(start, end);
    }
  }, [fetchAppointments]);

  // Handle event click (edit appointment)
  const handleEventClick = (clickInfo) => {
    const appointment = clickInfo.event.extendedProps.appointment;
    setSelectedEvent(appointment);

    console.log(appointment);
    if (appointment.type === "consulta") {
      consultaForm.setFieldsValue({
        patient_id: appointment.patient_id,
        appointment_date: appointment.start_datetime ? dayjs(appointment.start_datetime) : null,
        start_time: appointment.start_datetime ? dayjs(appointment.start_datetime) : null,
        duration_minutes: appointment.duration_minutes,
        notes: appointment.notes,
        follow_up_date: appointment.follow_up_date,
        send_confirmation: appointment.send_confirmation,
        label_id: appointment.label_id,
      });
      setIsConsultaModalOpen(true);
    } else {
      const startDateTime = appointment.start_datetime ? dayjs(appointment.start_datetime) : null;
      const endDateTime = appointment.end_datetime ? dayjs(appointment.end_datetime) : null;
      const allDay = appointment.all_day || false;

      // Calculate duration from start and end datetime
      let durationMinutes = null;
      if (!allDay && startDateTime && endDateTime) {
        durationMinutes = endDateTime.diff(startDateTime, "minute");
      } else if (appointment.duration_minutes) {
        durationMinutes = appointment.duration_minutes;
      }

      compromissoForm.setFieldsValue({
        title: appointment.title,
        description: appointment.description,
        all_day: allDay,
        start_date: startDateTime,
        start_time: allDay ? null : startDateTime,
        duration_minutes: durationMinutes,
        recurring: appointment.recurring || false,
      });
      setIsCompromissoModalOpen(true);
    }
  };

  // Handle event change (drag and drop)
  const handleEventChange = async (changeInfo) => {
    try {
      const appointment = changeInfo.event.extendedProps.appointment;
      const newStart = changeInfo.event.start;
      const newEnd = changeInfo.event.end;

      await api.put(`/appointments/${appointment.id}`, {
        start_datetime: newStart.toISOString(),
        end_datetime: newEnd ? newEnd.toISOString() : null,
      });

      messageApi.success("Evento atualizado com sucesso!");
      
      // Refresh calendar events
      refreshCalendarEvents();
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao atualizar evento.");
      changeInfo.revert();
    }
  };

  // Handle create consulta
  const handleCreateConsulta = async () => {
    try {
      const values = await consultaForm.validateFields();
      const appointmentDate = values.appointment_date;
      const startTime = values.start_time;

      // Find patient to get name for title
      const selectedPatient = patients.find(p => p.id === values.patient_id);
      const patientName = selectedPatient ? selectedPatient.full_name : "Paciente não informado";

      // Combine date and time
      const startDateTime = dayjs(appointmentDate)
        .hour(startTime ? startTime.hour() : 0)
        .minute(startTime ? startTime.minute() : 0)
        .second(0)
        .millisecond(0);

      const endDateTime = startDateTime.add(values.duration_minutes || 30, "minute");

      const payload = {
        type: "consulta",
        patient_id: values.patient_id,
        title: patientName, // Use patient name as title for consultations
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        duration_minutes: values.duration_minutes,
        notes: values.notes,
        follow_up_date: values.follow_up_date,
        send_confirmation: values.send_confirmation || false,
        label_id: values.label_id,
      };

      if (selectedEvent) {
        await api.put(`/appointments/${selectedEvent.id}`, payload);
        messageApi.success("Consulta atualizada com sucesso!");
      } else {
        await api.post("/appointments", payload);
        messageApi.success("Consulta criada com sucesso!");
      }

      setIsConsultaModalOpen(false);
      consultaForm.resetFields();
      setSelectedEvent(null);
      setSelectedSlot(null);

      // Refresh calendar events
      refreshCalendarEvents();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao salvar consulta.");
    }
  };

  // Handle create compromisso
  const handleCreateCompromisso = async () => {
    try {
      const values = await compromissoForm.validateFields();
      const allDay = values.all_day || false;

      let startDateTime, endDateTime;

      if (allDay) {
        startDateTime = dayjs(values.start_date).startOf("day");
        endDateTime = startDateTime.endOf("day");
      } else {
        startDateTime = dayjs(values.start_date)
          .hour(values.start_time ? values.start_time.hour() : 0)
          .minute(values.start_time ? values.start_time.minute() : 0)
          .second(0)
          .millisecond(0);

        const durationMinutes = values.duration_minutes || 30;
        endDateTime = startDateTime.add(durationMinutes, "minute");
      }

      const payload = {
        type: "compromisso",
        title: values.title,
        description: values.description,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        all_day: allDay,
        duration_minutes: allDay ? null : (values.duration_minutes || 30),
        recurring: values.recurring || false,
      };

      if (selectedEvent) {
        await api.put(`/appointments/${selectedEvent.id}`, payload);
        messageApi.success("Compromisso atualizado com sucesso!");
      } else {
        await api.post("/appointments", payload);
        messageApi.success("Compromisso criado com sucesso!");
      }

      setIsCompromissoModalOpen(false);
      compromissoForm.resetFields();
      setSelectedEvent(null);

      // Refresh calendar events
      refreshCalendarEvents();
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao salvar compromisso.");
    }
  };

  const handleCreateClick = () => {
    consultaForm.resetFields();
    setSelectedEvent(null);
    setSelectedSlot(null);
    setIsConsultaModalOpen(true);
  };

  const handleCreateCompromissoClick = () => {
    compromissoForm.resetFields();
    setSelectedEvent(null);
    setIsCompromissoModalOpen(true);
  };

  // Handlers de rótulos
  const handleCreateLabel = async () => {
    try {
      setLoading(true);
      const values = await labelForm.validateFields();
      
      await api.post("/labels", {
        name: values.name,
        color: values.color,
        context: "appointment", // Definir contexto como appointment
      });
      
      messageApi.success("Rótulo criado com sucesso!");
      setIsNewLabelModalOpen(false);
      labelForm.resetFields();
      await fetchLabels();
      
      // Selecionar o novo rótulo no formulário de consulta (se o modal estiver aberto)
      if (isConsultaModalOpen) {
        // Buscar o label recém-criado para obter o ID
        const labelsRes = await api.get("/labels", {
          params: { is_active: true },
        });
        const newLabel = labelsRes.data.find(
          (label) => label.name === values.name && label.context === "appointment"
        );
        if (newLabel) {
          consultaForm.setFieldsValue({ label_id: newLabel.id });
        }
      }
    } catch (err) {
      console.error(err);
      messageApi.error(err.response?.data?.error || "Erro ao criar rótulo!");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateLabelModal = () => {
    setIsNewLabelModalOpen(true);
  };

  const handleCloseCreateLabelModal = () => {
    setIsNewLabelModalOpen(false);
    labelForm.resetFields();
  };

  // Handle delete appointment
  const handleDeleteClick = () => {
    if (selectedEvent) {
      setAppointmentToDelete(selectedEvent);
      setIsDeleteModalOpen(true);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;

    try {
      setLoading(true);
      await api.delete(`/appointments/${appointmentToDelete.id}`);
      messageApi.success(
        appointmentToDelete.type === "consulta"
          ? "Consulta excluída com sucesso!"
          : "Compromisso excluído com sucesso!"
      );

      setIsDeleteModalOpen(false);
      setAppointmentToDelete(null);
      
      // Close the edit modal if open
      setIsConsultaModalOpen(false);
      setIsCompromissoModalOpen(false);
      consultaForm.resetFields();
      compromissoForm.resetFields();
      setSelectedEvent(null);
      setSelectedSlot(null);

      // Refresh calendar events
      refreshCalendarEvents();
    } catch (err) {
      console.error(err);
      messageApi.error(
        err.response?.data?.error || "Erro ao excluir agendamento."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}

      <Title level={3} className="appointment-title">Agenda</Title>

      <div className="appointment-controls">
        <Space className="appointment-controls-left" wrap>
          <Button icon={<LeftOutlined />} onClick={handlePrev} />
          <Button onClick={handleToday}>HOJE</Button>
          <Button icon={<RightOutlined />} onClick={handleNext} />
          <Title level={4} className="appointment-date-range">
            {currentDateRange || "Agenda"}
          </Title>
        </Space>
        <Space className="appointment-controls-right" wrap>
          <Select
            value={viewType}
            onChange={handleViewChange}
            className="appointment-view-select"
          >
            <Option value="timeGridWeek">Semana</Option>
            <Option value="timeGridDay">Dia</Option>
          </Select>
          <Button icon={<PlusOutlined />} onClick={handleCreateClick} className="appointment-btn-consulta">
            <span className="appointment-btn-text">Consulta</span>
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCompromissoClick} className="appointment-btn-compromisso">
            <span className="appointment-btn-text">Compromisso</span>
          </Button>
        </Space>
      </div>

      <Card className="appointment-calendar-card">
        <div className="appointment-calendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="timeGridWeek"
            locale={ptBrLocale}
            headerToolbar={false}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            firstDay={1}
            weekends={true}
            selectable={true}
            selectMirror={true}
            editable={true}
            events={events}
            height="auto"
            contentHeight="auto"
            aspectRatio={1.8}
            eventContent={(eventInfo) => {
            const appointment = eventInfo.event.extendedProps.appointment;
            const startTime = dayjs(eventInfo.event.start).format("HH:mm");
            const endTime = eventInfo.event.end
              ? dayjs(eventInfo.event.end).format("HH:mm")
              : "";
            const timeDisplay = endTime ? `${startTime} - ${endTime}` : startTime;

            return (
              <div className="fc-event-content-wrapper">
                <div className="fc-event-title-container">
                  <div className="fc-event-title fc-sticky">
                    {eventInfo.event.title}
                  </div>
                  <div className="fc-event-time" style={{ fontSize: "11px", opacity: 0.9 }}>
                    {timeDisplay}
                  </div>
                </div>
                {appointment?.label?.color && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: appointment.label.color,
                      marginLeft: 4,
                      marginTop: 2,
                    }}
                  />
                )}
              </div>
            );
          }}
          select={handleSelect}
          eventClick={handleEventClick}
          eventChange={handleEventChange}
          datesSet={handleDatesSet}
        />
        </div>
      </Card>

      <ConsultaModal
        open={isConsultaModalOpen}
        loading={loading}
        form={consultaForm}
        patients={patients}
        labels={labels}
        isEdit={!!selectedEvent}
        onOk={handleCreateConsulta}
        onCancel={() => {
          setIsConsultaModalOpen(false);
          consultaForm.resetFields();
          setSelectedEvent(null);
          setSelectedSlot(null);
        }}
        onDelete={handleDeleteClick}
        onCreateLabelClick={handleOpenCreateLabelModal}
      />

      <CompromissoModal
        open={isCompromissoModalOpen}
        loading={loading}
        form={compromissoForm}
        isEdit={!!selectedEvent}
        onOk={handleCreateCompromisso}
        onCancel={() => {
          setIsCompromissoModalOpen(false);
          compromissoForm.resetFields();
          setSelectedEvent(null);
        }}
        onDelete={handleDeleteClick}
      />

      <Modal
        title="Confirmar exclusão"
        open={isDeleteModalOpen}
        onOk={handleDeleteAppointment}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setAppointmentToDelete(null);
        }}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={loading}
        zIndex={1050}
        mask={true}
        maskClosable={false}
      >
        <p>
          Tem certeza que deseja excluir{" "}
          {appointmentToDelete?.type === "consulta"
            ? "esta consulta"
            : "este compromisso"}
          ?
        </p>
        <p style={{ color: "#ff4d4f" }}>Esta ação não pode ser desfeita.</p>
      </Modal>

      <CreateLabelModal
        open={isNewLabelModalOpen}
        loading={loading}
        form={labelForm}
        onOk={handleCreateLabel}
        onCancel={handleCloseCreateLabelModal}
      />
    </div>
  );
}

