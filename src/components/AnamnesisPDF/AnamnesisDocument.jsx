import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import dayjs from 'dayjs';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 15,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  text: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  bold: {
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  answerText: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 4,
    color: '#333333',
  },
  commentText: {
    fontSize: 8,
    marginLeft: 15,
    marginTop: 2,
    marginBottom: 6,
    fontStyle: 'italic',
    color: '#666666',
  },
  divider: {
    borderBottom: '1 solid #CCCCCC',
    marginVertical: 10,
  },
  signatureLine: {
    borderBottom: '1 solid #000000',
    marginTop: 30,
    marginBottom: 5,
    width: '60%',
  },
  patientDataRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  patientDataLabel: {
    width: '35%',
    fontWeight: 'bold',
  },
  patientDataValue: {
    width: '65%',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#666666',
    paddingHorizontal: 20,
  },
});

// Funções auxiliares de formatação
const formatCPF = (cpf) => {
  if (!cpf) return "-";
  const digits = cpf.replace(/\D/g, "");
  if (digits.length === 11)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  return cpf;
};

const formatPhone = (phone) => {
  if (!phone) return "-";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return phone;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

const formatDocument = (document) => {
  if (!document) return "-";
  const digits = document.replace(/\D/g, "");
  // Se tiver 11 dígitos, formata como CPF
  if (digits.length === 11) {
    return formatCPF(document);
  }
  // Se tiver 14 dígitos, formata como CNPJ
  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return document;
};

// Componente do Documento PDF Dinâmico
const AnamnesisDocument = ({ 
  patient = {}, 
  formData = {}, 
  answers = {} 
}) => {
  // Ordenar questões por ordem
  const sortedQuestions = formData.questions 
    ? [...formData.questions].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Título do Formulário */}
        <View style={styles.section}>
          <Text style={styles.title}>{formData.name || "Anamnese"}</Text>
          {formData.description && (
            <Text style={[styles.text, { textAlign: 'center' }]}>
              {formData.description}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Dados Pessoais do Paciente */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Dados Pessoais</Text>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Nome:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.full_name || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>CPF:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{formatCPF(patient.cpf)}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>RG:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.rg || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Data de Nascimento:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{formatDate(patient.birth_date)}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Idade:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>
              {patient.age ? `${patient.age} anos` : "-"}
            </Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Sexo:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.gender || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Telefone:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{formatPhone(patient.phone)}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>CEP:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.zip_code || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Endereço:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.street || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Bairro:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.neighborhood || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Cidade:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>
              {patient.city ? `${patient.city} - ${patient.state || ""}` : "-"}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Dados do Responsável */}
        {patient.responsible_name && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Dados do Responsável</Text>
            
            <View style={styles.patientDataRow}>
              <Text style={[styles.text, styles.patientDataLabel]}>Nome:</Text>
              <Text style={[styles.text, styles.patientDataValue]}>{patient.responsible_name || "-"}</Text>
            </View>
            
            {patient.responsible_cpf && (
              <View style={styles.patientDataRow}>
                <Text style={[styles.text, styles.patientDataLabel]}>CPF:</Text>
                <Text style={[styles.text, styles.patientDataValue]}>{formatCPF(patient.responsible_cpf)}</Text>
              </View>
            )}
            
            {patient.responsible_phone && (
              <View style={styles.patientDataRow}>
                <Text style={[styles.text, styles.patientDataLabel]}>Telefone:</Text>
                <Text style={[styles.text, styles.patientDataValue]}>{formatPhone(patient.responsible_phone)}</Text>
              </View>
            )}
            
            {patient.responsible_email && (
              <View style={styles.patientDataRow}>
                <Text style={[styles.text, styles.patientDataLabel]}>E-mail:</Text>
                <Text style={[styles.text, styles.patientDataValue]}>{patient.responsible_email}</Text>
              </View>
            )}
            
            {patient.responsible_relationship && (
              <View style={styles.patientDataRow}>
                <Text style={[styles.text, styles.patientDataLabel]}>Grau de Parentesco:</Text>
                <Text style={[styles.text, styles.patientDataValue]}>{patient.responsible_relationship}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* Dados do Plano de Saúde */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Plano de Saúde</Text>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Número da Carteirinha:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.plan_card_number || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>Titular do Plano:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{patient.plan_holder || "-"}</Text>
          </View>
          
          <View style={styles.patientDataRow}>
            <Text style={[styles.text, styles.patientDataLabel]}>CPF/Documento do Titular:</Text>
            <Text style={[styles.text, styles.patientDataValue]}>{formatDocument(patient.plan_document)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Anamnese - Perguntas e Respostas */}
        {sortedQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subtitle}>Anamnese</Text>
            
            {sortedQuestions.map((question, index) => {
              const answer = answers[question.id_question];
              const answerText = answer?.answer || "Não respondido";
              const commentText = answer?.comment || null;

              return (
                <View key={question.id_question} style={{ marginBottom: 8 }}>
                  <Text style={styles.questionText}>
                    {index + 1}. {question.question}
                  </Text>
                  <Text style={styles.answerText}>
                    Resposta: {answerText}
                  </Text>
                  {/* Mostrar comentário se existir, independente da resposta */}
                  {commentText && commentText.trim() !== "" && (
                    <Text style={styles.commentText}>
                      Observação: {commentText}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Campo de Assinatura */}
        <View style={{ marginTop: 'auto', paddingTop: 20 }}>
          <View style={styles.divider} />
          
          <Text style={[styles.text, styles.bold, { marginTop: 20 }]}>Assinatura</Text>
          
          <View style={styles.signatureLine} />
          
          <Text style={[styles.text, { marginTop: 5 }]}>
            {patient.full_name || "Nome do paciente"}
          </Text>
          
          <Text style={[styles.text, { marginTop: 10 }]}>
            Data: {dayjs().format("DD/MM/YYYY")}
          </Text>
        </View>

        {/* Número da página no rodapé */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )}
          fixed
        />
      </Page>
    </Document>
  );
};

export default AnamnesisDocument;
