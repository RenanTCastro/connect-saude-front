import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Card,
  Select,
  Checkbox,
  message,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import api from "../../services/api";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

const ANSWER_TYPES = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto Longo" },
  { value: "yes_no", label: "Sim/Não" },
  { value: "yes_no_unknown", label: "Sim/Não/Desconhecido" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
];

export default function FormEditor({ open, form, onClose }) {
  const [formInstance] = Form.useForm();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const isEditing = !!form;

  useEffect(() => {
    if (open) {
      if (form) {
        // Carregar dados do formulário para edição
        formInstance.setFieldsValue({
          name: form.name,
          description: form.description,
          type: form.type || "anamnese",
        });

        // Buscar estrutura completa do formulário
        fetchFormStructure();
      } else {
        // Limpar formulário para criação
        formInstance.resetFields();
        setQuestions([]);
      }
    }
  }, [open, form]);

  const fetchFormStructure = async () => {
    if (!form?.id_form) return;

    try {
      setLoading(true);
      const response = await api.get(`/forms/${form.id_form}`);
      const formData = response.data;
      setQuestions(formData.questions || []);
    } catch (error) {
      console.error("Erro ao buscar estrutura do formulário:", error);
      messageApi.error("Erro ao carregar estrutura do formulário.");
    } finally {
      setLoading(false);
    }
  };

  const generateQuestionId = () => {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleAddQuestion = () => {
    const newQuestion = {
      id: generateQuestionId(),
      question: "",
      answer_type: "text",
      required: false,
      has_comment: false,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Reordenar
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
  };

  const handleMoveQuestion = (index, direction) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    // Reordenar
    const reordered = newQuestions.map((q, i) => ({ ...q, order: i }));
    setQuestions(reordered);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value,
    };
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    try {
      const values = await formInstance.validateFields();

      // Validar questões
      if (questions.length === 0) {
        messageApi.warning("Adicione pelo menos uma pergunta ao formulário.");
        return;
      }

      const invalidQuestions = questions.filter(
        (q) => !q.question || !q.question.trim()
      );
      if (invalidQuestions.length > 0) {
        messageApi.warning("Todas as perguntas devem ter um texto.");
        return;
      }

      // Preparar estrutura JSON
      const formStructure = {
        questions: questions.map((q, index) => ({
          id: q.id,
          question: q.question.trim(),
          answer_type: q.answer_type,
          required: q.required || false,
          has_comment: q.has_comment || false,
          order: index,
        })),
      };

      setLoading(true);

      if (isEditing) {
        // Atualizar formulário
        await api.put(`/forms/${form.id_form}`, {
          name: values.name,
          description: values.description,
          type: values.type,
          form_structure: formStructure,
        });
        messageApi.success("Formulário atualizado com sucesso!");
      } else {
        // Criar novo formulário
        await api.post("/forms", {
          name: values.name,
          description: values.description,
          type: values.type,
          form_structure: formStructure,
        });
        messageApi.success("Formulário criado com sucesso!");
      }

      onClose(true);
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      if (error.response?.data?.error) {
        messageApi.error(error.response.data.error);
      } else {
        messageApi.error("Erro ao salvar formulário.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={isEditing ? "Editar Formulário" : "Criar Novo Formulário"}
        open={open}
        onCancel={() => onClose(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => onClose(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            Salvar
          </Button>,
        ]}
      >
        <Form form={formInstance} layout="vertical">
          <Form.Item
            name="name"
            label="Nome do Formulário"
            rules={[{ required: true, message: "Nome é obrigatório" }]}
          >
            <Input placeholder="Ex: Anamnese Clínica" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <TextArea
              rows={2}
              placeholder="Descrição opcional do formulário"
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="Tipo"
            initialValue="anamnese"
            rules={[{ required: true, message: "Tipo é obrigatório" }]}
          >
            <Select>
              <Option value="anamnese">Anamnese</Option>
              <Option value="questionnaire">Questionário</Option>
              <Option value="other">Outro</Option>
            </Select>
          </Form.Item>

          <div style={{ marginTop: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text strong>Perguntas</Text>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddQuestion}
              >
                Adicionar Pergunta
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card>
                <Text type="secondary">
                  Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta"
                  para começar.
                </Text>
              </Card>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {questions.map((question, index) => {
                  const questionNumber = (question.order !== undefined ? question.order : index) + 1;
                  return (
                  <Card key={question.id} size="small">
                    <Space direction="vertical" style={{ width: "100%" }} size="small">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Text strong>Pergunta <strong>{questionNumber}</strong></Text>
                        <Space>
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => handleMoveQuestion(index, "up")}
                          />
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={index === questions.length - 1}
                            onClick={() => handleMoveQuestion(index, "down")}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveQuestion(index)}
                          />
                        </Space>
                      </div>

                      <Input
                        placeholder="Digite a pergunta"
                        value={question.question}
                        onChange={(e) =>
                          handleQuestionChange(index, "question", e.target.value)
                        }
                      />

                      <Select
                        style={{ width: "100%" }}
                        value={question.answer_type}
                        onChange={(value) =>
                          handleQuestionChange(index, "answer_type", value)
                        }
                      >
                        {ANSWER_TYPES.map((type) => (
                          <Option key={type.value} value={type.value}>
                            {type.label}
                          </Option>
                        ))}
                      </Select>

                      <Space>
                        <Checkbox
                          checked={question.required}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "required",
                              e.target.checked
                            )
                          }
                        >
                          Obrigatória
                        </Checkbox>
                        <Checkbox
                          checked={question.has_comment}
                          onChange={(e) =>
                            handleQuestionChange(
                              index,
                              "has_comment",
                              e.target.checked
                            )
                          }
                        >
                          Permite comentário
                        </Checkbox>
                      </Space>
                    </Space>
                  </Card>
                  );
                })}
              </Space>
            )}
          </div>
        </Form>
      </Modal>
    </>
  );
}
