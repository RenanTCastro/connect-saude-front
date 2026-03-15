import { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Radio, InputNumber, DatePicker, message, Spin, Space } from "antd";
import { SaveOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined, FilePdfOutlined } from "@ant-design/icons";
import { PDFDownloadLink } from "@react-pdf/renderer";
import dayjs from "dayjs";
import api from "../../services/api";
import AnamnesisDocument from "../AnamnesisPDF/AnamnesisDocument";
import "./PatientForm.css";

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
  const [siderLeft, setSiderLeft] = useState(200); // 200px quando expandido, 80px quando colapsado

  useEffect(() => {
    fetchFormData();
    fetchPatientData();
  }, [formId, patientId]);

  // Detectar estado do menu lateral
  useEffect(() => {
    const checkSiderState = () => {
      const sider = document.querySelector('.ant-layout-sider');
      if (sider) {
        const isCollapsed = sider.classList.contains('ant-layout-sider-collapsed');
        setSiderLeft(isCollapsed ? 80 : 200);
      } else {
        // Em mobile, não há sider visível
        setSiderLeft(0);
      }
    };

    // Verificar inicialmente
    checkSiderState();

    // Observar mudanças no DOM
    const observer = new MutationObserver(checkSiderState);
    const sider = document.querySelector('.ant-layout-sider');
    if (sider) {
      observer.observe(sider, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // Verificar em resize (para mobile)
    window.addEventListener('resize', checkSiderState);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkSiderState);
    };
  }, []);

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
        
        // Criar um mapa de respostas por question_id (UUID)
        const answersMap = {};
        (patientForm.answers || []).forEach((answer) => {
          answersMap[answer.question_id] = {
            answer: answer.answer,
            comment: answer.comment,
          };
        });
        setExistingAnswers(answersMap);
        
        // Preencher o form com respostas existentes
        if (response.data.questions) {
          const initialValues = {};
          response.data.questions.forEach((question) => {
            const questionId = question.id; // UUID
            if (answersMap[questionId]) {
              const answerValue = answersMap[questionId].answer;
              const commentValue = answersMap[questionId].comment;
              
              // Tratar diferentes tipos ao carregar valores iniciais
              if (question.answer_type === "date" && answerValue) {
                // Converter string de data para dayjs
                initialValues[`question_${questionId}`] = dayjs(answerValue);
              } else if (question.answer_type === "number" && answerValue) {
                // Converter string para número
                initialValues[`question_${questionId}`] = parseFloat(answerValue);
              } else if (answerValue) {
                initialValues[`question_${questionId}`] = answerValue;
              }
              
              // Carregar comentário se existir
              if (commentValue) {
                initialValues[`comment_${questionId}`] = commentValue;
                // Se for questão de escolha e tiver comentário, mostrar o campo independente da resposta
                if ((question.answer_type === "yes_no" || question.answer_type === "yes_no_unknown") && 
                    question.has_comment && 
                    answerValue) {
                  setShowComments(prev => ({
                    ...prev,
                    [questionId]: true
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
        const questionId = question.id; // UUID
        const answerValue = values[`question_${questionId}`];
        const commentValue = values[`comment_${questionId}`];
        
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
          question_id: questionId,
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
    // Exibir apenas mensagem genérica de erro
    messageApi.error("Erro ao salvar formulário. Verifique se todos os campos obrigatórios foram preenchidos.");
  };

  const toggleComment = (questionId) => {
    setShowComments(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const renderQuestionInput = (question, questionNumber) => {
    const questionId = question.id; // UUID
    const fieldName = `question_${questionId}`;
    const commentFieldName = `comment_${questionId}`;
    const rules = question.required
      ? [{ required: true, message: "Este campo é obrigatório" }]
      : [];

    const isChoiceType = question.answer_type === "yes_no" || question.answer_type === "yes_no_unknown";
    
    // Adicionar número da ordem ao label em negrito
    const questionLabel = (
      <span>
        <strong>{questionNumber}.</strong> {question.question}
      </span>
    );

    const inputComponent = (() => {
      switch (question.answer_type) {
        case "text":
          return (
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
              <Input placeholder="Digite sua resposta" />
            </Form.Item>
          );

        case "textarea":
          return (
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
              <TextArea rows={4} placeholder="Digite sua resposta" />
            </Form.Item>
          );

        case "yes_no":
          return (
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
              <Radio.Group 
                onChange={(e) => {
                  // Mostrar comentário automaticamente apenas quando resposta for "Sim"
                  if (question.has_comment && e.target.value === "Sim") {
                    setShowComments(prev => ({
                      ...prev,
                      [questionId]: true
                    }));
                  } else if (question.has_comment) {
                    setShowComments(prev => ({
                      ...prev,
                      [questionId]: false
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
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
              <Radio.Group 
                onChange={(e) => {
                  // Mostrar comentário automaticamente apenas quando resposta for "Sim"
                  if (question.has_comment && e.target.value === "Sim") {
                    setShowComments(prev => ({
                      ...prev,
                      [questionId]: true
                    }));
                  } else if (question.has_comment) {
                    setShowComments(prev => ({
                      ...prev,
                      [questionId]: false
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
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
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
              label={questionLabel} 
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
            <Form.Item name={fieldName} label={questionLabel} rules={rules}>
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
              const isCommentVisible = showComments[questionId] !== false;

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
                            onClick={() => toggleComment(questionId)}
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
                          onClick={() => toggleComment(questionId)}
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

  if (loading || submitting) {
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
    <div style={{ position: "relative" }}>
      {contextHolder}
      <Card style={{ marginBottom: 80 }}>
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
              .map((question, index) => (
                <div key={question.id} style={{ marginBottom: 24 }}>
                  {renderQuestionInput(question, index + 1)}
                </div>
              ))}

          </Form>
        </Space>
      </Card>

      {/* Botões fixos na parte inferior */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: siderLeft,
          right: 0,
          backgroundColor: "#fff",
          padding: "16px 24px",
          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          borderTop: "1px solid #f0f0f0",
          transition: "left 0.2s",
        }}
        className="patient-form-actions"
      >
        <Space>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={submitting}
            size="large"
            onClick={() => form.submit()}
          >
            Salvar
          </Button>
          {patient && formData ? (
            Object.keys(existingAnswers).length > 0 ? (
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
            ) : (
              <Button
                type="default"
                icon={<FilePdfOutlined />}
                size="large"
                disabled
                title="Salve o formulário primeiro para exportar o PDF"
              >
                Exportar PDF
              </Button>
            )
          ) : null}
        </Space>
      </div>
    </div>
  );
}
