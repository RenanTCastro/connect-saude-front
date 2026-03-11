import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Radio, InputNumber, DatePicker, message, Spin, Space, Alert } from "antd";
import { SaveOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined, FilePdfOutlined } from "@ant-design/icons";
import { PDFDownloadLink } from "@react-pdf/renderer";
import dayjs from "dayjs";
import api from "../../services/api";
import AnamnesisDocument from "../AnamnesisPDF/AnamnesisDocument";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function PatientForm({ patientId, formId = 1 }) {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingAnswers, setExistingAnswers] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [showComments, setShowComments] = useState({});
  const [formErrors, setFormErrors] = useState([]);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    fetchFormData();
    fetchPatientData();
  }, [formId, patientId]);

  const fetchPatientData = async () => {
    try {
      const response = await api.get(`/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      console.error("Erro ao buscar dados do paciente:", error);
    }
  };

  const fetchFormData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forms/${formId}`);
      setFormData(response.data);

      // Buscar respostas existentes se houver
      try {
        const patientFormResponse = await api.get(`/patients/${patientId}/forms/${formId}`);
        const patientForm = patientFormResponse.data;
        
        // Criar um mapa de respostas por id_question
        const answersMap = {};
        patientForm.answers.forEach((answer) => {
          answersMap[answer.id_question] = {
            answer: answer.answer,
            comment: answer.comment,
          };
        });
        setExistingAnswers(answersMap);
        
        // Preencher o form com respostas existentes
        if (response.data.questions) {
          const initialValues = {};
          response.data.questions.forEach((question) => {
            if (answersMap[question.id_question]) {
              const answerValue = answersMap[question.id_question].answer;
              const commentValue = answersMap[question.id_question].comment;
              
              // Tratar diferentes tipos ao carregar valores iniciais
              if (question.answer_type === "date" && answerValue) {
                // Converter string de data para dayjs
                initialValues[`question_${question.id_question}`] = dayjs(answerValue);
              } else if (question.answer_type === "number" && answerValue) {
                // Converter string para número
                initialValues[`question_${question.id_question}`] = parseFloat(answerValue);
              } else if (answerValue) {
                initialValues[`question_${question.id_question}`] = answerValue;
              }
              
              // Carregar comentário se existir
              if (commentValue) {
                initialValues[`comment_${question.id_question}`] = commentValue;
                // Se for questão de escolha e tiver comentário, mostrar o campo independente da resposta
                if ((question.answer_type === "yes_no" || question.answer_type === "yes_no_unknown") && 
                    question.has_comment && 
                    answerValue) {
                  setShowComments(prev => ({
                    ...prev,
                    [question.id_question]: true
                  }));
                }
              }
            }
          });
          form.setFieldsValue(initialValues);
        }
      } catch (patientFormError) {
        // Se não encontrar formulário preenchido, apenas ignora (é normal na primeira vez)
        if (patientFormError.response?.status !== 404) {
          console.error("Erro ao buscar formulário preenchido:", patientFormError);
        }
        setExistingAnswers({});
      }
    } catch (error) {
      console.error("Erro ao carregar formulário:", error);
      messageApi.error("Erro ao carregar formulário.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      setFormErrors([]);

      // Transformar os valores do form em formato de respostas
      const answers = formData.questions.map((question) => {
        const answerValue = values[`question_${question.id_question}`];
        const commentValue = values[`comment_${question.id_question}`];
        
        // Tratar diferentes tipos de resposta
        let answer = null;
        if (answerValue !== undefined && answerValue !== null) {
          // Para date, já vem como string no formato YYYY-MM-DD
          // Para number, converter para string
          // Para yes_no e yes_no_unknown, já vem como string
          // Para text e textarea, já vem como string
          answer = String(answerValue);
        }

        return {
          id_question: question.id_question,
          answer: answer,
          comment: commentValue || null,
        };
      });

      const payload = {
        patient_id: parseInt(patientId),
        id_form: formId,
        answers: answers,
      };

      await api.post("/forms/response", payload);
      messageApi.success("Formulário salvo com sucesso!");
      
      // Recarregar dados do formulário
      fetchFormData();
    } catch (error) {
      console.error("Erro ao salvar formulário:", error);
      const errorMessage = error.response?.data?.error || "Erro ao salvar formulário.";
      messageApi.error(errorMessage);
      setFormErrors([errorMessage]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormFinishFailed = (errorInfo) => {
    const errors = errorInfo.errorFields?.map(field => {
      const question = formData?.questions.find(q => 
        field.name[0] === `question_${q.id_question}` || field.name[0] === `comment_${q.id_question}`
      );
      return question 
        ? `${question.question}: ${field.errors[0]}`
        : field.errors[0];
    }) || [];
    setFormErrors(errors);
  };

  const toggleComment = (questionId) => {
    setShowComments(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderQuestionInput = (question) => {
    const fieldName = `question_${question.id_question}`;
    const commentFieldName = `comment_${question.id_question}`;
    const rules = question.required
      ? [{ required: true, message: "Este campo é obrigatório" }]
      : [];

    const isChoiceType = question.answer_type === "yes_no" || question.answer_type === "yes_no_unknown";

    const inputComponent = (() => {
      switch (question.answer_type) {
        case "text":
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <Input placeholder="Digite sua resposta" />
            </Form.Item>
          );

        case "textarea":
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <TextArea rows={4} placeholder="Digite sua resposta" />
            </Form.Item>
          );

        case "yes_no":
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <Radio.Group 
                onChange={(e) => {
                  // Mostrar comentário automaticamente apenas quando resposta for "Sim"
                  if (question.has_comment && e.target.value === "Sim") {
                    setShowComments(prev => ({
                      ...prev,
                      [question.id_question]: true
                    }));
                  } else if (question.has_comment) {
                    setShowComments(prev => ({
                      ...prev,
                      [question.id_question]: false
                    }));
                  }
                }}
              >
                <Radio value="Sim">Sim</Radio>
                <Radio value="Não">Não</Radio>
              </Radio.Group>
            </Form.Item>
          );

        case "yes_no_unknown":
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <Radio.Group 
                onChange={(e) => {
                  // Mostrar comentário automaticamente apenas quando resposta for "Sim"
                  if (question.has_comment && e.target.value === "Sim") {
                    setShowComments(prev => ({
                      ...prev,
                      [question.id_question]: true
                    }));
                  } else if (question.has_comment) {
                    setShowComments(prev => ({
                      ...prev,
                      [question.id_question]: false
                    }));
                  }
                }}
              >
                <Radio value="Sim">Sim</Radio>
                <Radio value="Não">Não</Radio>
                <Radio value="Desconhecido">Desconhecido</Radio>
              </Radio.Group>
            </Form.Item>
          );

        case "number":
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <InputNumber 
                style={{ width: "100%" }} 
                placeholder="Digite um número"
                min={0}
              />
            </Form.Item>
          );

        case "date":
          return (
            <Form.Item 
              name={fieldName} 
              label={question.question} 
              rules={rules}
              getValueFromEvent={(date) => date ? date.format("YYYY-MM-DD") : null}
              getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
            >
              <DatePicker 
                style={{ width: "100%" }} 
                format="DD/MM/YYYY"
                placeholder="Selecione uma data"
              />
            </Form.Item>
          );

        default:
          return (
            <Form.Item name={fieldName} label={question.question} rules={rules}>
              <Input placeholder="Digite sua resposta" />
            </Form.Item>
          );
      }
    })();

    return (
      <div>
        {inputComponent}
        {question.has_comment && (
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => 
            prevValues[fieldName] !== currentValues[fieldName]
          }>
            {({ getFieldValue }) => {
              const answerValue = getFieldValue(fieldName);
              const isCommentVisible = showComments[question.id_question] !== false;

              // Para sim/não, só exibir bloco de comentário quando a resposta for "Sim"
              if (isChoiceType && answerValue !== "Sim") {
                return null;
              }

              // Para outros tipos de questão, sempre mostrar o comentário se has_comment for true
              if (!isChoiceType || answerValue === "Sim") {
                return (
                  <div style={{ marginTop: 8 }}>
                    {isCommentVisible ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 14 }}>Comentário</Text>
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeInvisibleOutlined />}
                            onClick={() => toggleComment(question.id_question)}
                            style={{ padding: 0, height: "auto" }}
                          >
                            Esconder
                          </Button>
                        </div>
                        <Form.Item 
                          name={commentFieldName}
                          style={{ marginBottom: 0 }}
                        >
                          <TextArea 
                            rows={2} 
                            placeholder="Adicione um comentário (opcional)" 
                          />
                        </Form.Item>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                          type="text"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => toggleComment(question.id_question)}
                          style={{ padding: 0, height: "auto" }}
                        >
                          Mostrar comentário
                        </Button>
                      </div>
                    )}
                  </div>
                );
              }

              return null;
            }}
          </Form.Item>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!formData) {
    return (
      <Card>
        <Text type="secondary">Formulário não encontrado.</Text>
      </Card>
    );
  }

  return (
    <div>
      {contextHolder}
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={4}>{formData.name}</Title>
            {formData.description && (
              <Text type="secondary">{formData.description}</Text>
            )}
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onFinishFailed={handleFormFinishFailed}
            autoComplete="off"
          >
            {formData.questions
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((question) => (
                <div key={question.id_question} style={{ marginBottom: 24 }}>
                  {renderQuestionInput(question)}
                </div>
              ))}

            {formErrors.length > 0 && (
              <Alert
                message="Erro ao salvar formulário"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                showIcon
                closable
                onClose={() => setFormErrors([])}
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  size="large"
                >
                  Salvar Formulário
                </Button>
                {patient && formData && Object.keys(existingAnswers).length > 0 && (
                  <PDFDownloadLink
                    document={
                      <AnamnesisDocument
                        patient={patient}
                        formData={formData}
                        answers={existingAnswers}
                      />
                    }
                    fileName={`Anamnese_${patient.full_name?.replace(/\s+/g, "_") || "Paciente"}_${dayjs().format("YYYY-MM-DD")}.pdf`}
                    style={{
                      textDecoration: "none",
                    }}
                  >
                    {({ blob, url, loading: pdfLoading, error }) => (
                      <Button
                        type="default"
                        icon={<FilePdfOutlined />}
                        loading={pdfLoading}
                        size="large"
                        disabled={pdfLoading}
                      >
                        {pdfLoading ? "Gerando PDF..." : "Exportar PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
