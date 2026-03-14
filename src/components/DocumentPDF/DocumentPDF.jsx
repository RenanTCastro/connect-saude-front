import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import dayjs from "dayjs";

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
  },
  body: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.6,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecoration: "underline",
  },
  listItem: {
    marginLeft: 20,
    marginBottom: 5,
    lineHeight: 1.6,
  },
  listBullet: {
    marginRight: 5,
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
  },
  signatureLine: {
    borderBottom: "1 solid #000000",
    marginTop: 30,
    marginBottom: 5,
    width: "60%",
  },
  signatureLabel: {
    fontSize: 10,
    marginTop: 5,
    marginBottom: 15,
  },
  signatureContainer: {
    marginTop: 20,
  },
  divider: {
    borderBottom: "1 solid #CCCCCC",
    marginVertical: 15,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#666666",
    paddingHorizontal: 40,
  },
});

// Função auxiliar para processar estilos inline (bold, italic, underline)
const processInlineStyles = (text, depth = 0) => {
  if (!text || depth > 5) {
    // Limitar profundidade para evitar recursão infinita
    return text ? text.replace(/<[^>]+>/g, "") : text;
  }

  const parts = [];
  let currentIndex = 0;
  let keyCounter = 0;

  // Regex para encontrar tags de estilo (suporta tags aninhadas simples)
  const styleRegex = /<(strong|b|em|i|u)>(.*?)<\/\1>/gi;
  let match;
  const matches = [];
  
  // Coletar todas as matches primeiro
  while ((match = styleRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      tag: match[1].toLowerCase(),
      content: match[2],
    });
  }

  // Processar matches
  matches.forEach((matchData) => {
    // Adicionar texto antes da tag
    if (matchData.index > currentIndex) {
      const beforeText = text.substring(currentIndex, matchData.index);
      if (beforeText.trim()) {
        parts.push(beforeText);
      }
    }

    // Determinar estilo baseado na tag
    let style = {};
    if (matchData.tag === "strong" || matchData.tag === "b") {
      style = styles.bold;
    } else if (matchData.tag === "em" || matchData.tag === "i") {
      style = styles.italic;
    } else if (matchData.tag === "u") {
      style = styles.underline;
    }

    // Processar conteúdo da tag recursivamente (com limite de profundidade)
    const processedContent = processInlineStyles(matchData.content, depth + 1);
    
    parts.push(
      <Text key={keyCounter++} style={style}>
        {processedContent}
      </Text>
    );

    currentIndex = matchData.index + matchData.length;
  });

  // Adicionar texto restante
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText.trim()) {
      parts.push(remainingText);
    }
  }

  // Se não houver partes processadas, retornar o texto original sem tags
  if (parts.length === 0) {
    const cleanText = text.replace(/<[^>]+>/g, "");
    return cleanText || text;
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
};

// Função auxiliar para converter HTML simples para elementos do react-pdf
const parseHTML = (html) => {
  if (!html) return null;

  const elements = [];
  let keyCounter = 0;

  // Dividir HTML em blocos (parágrafos e listas)
  // Primeiro, marcar listas para processar separadamente
  const listPlaceholders = [];
  let processedHtml = html;
  const listMatches = html.match(/<ul[^>]*>[\s\S]*?<\/ul>/gi);
  
  if (listMatches) {
    listMatches.forEach((listMatch, index) => {
      const placeholder = `___LIST_${index}___`;
      listPlaceholders.push(listMatch);
      processedHtml = processedHtml.replace(listMatch, placeholder);
    });
  }

  // Processar parágrafos
  const pMatches = processedHtml.match(/<p[^>]*>[\s\S]*?<\/p>/gi);
  
  if (pMatches) {
    pMatches.forEach((pMatch) => {
      // Verificar se contém placeholder de lista
      const listPlaceholderMatch = pMatch.match(/___LIST_(\d+)___/);
      if (listPlaceholderMatch) {
        const listIndex = parseInt(listPlaceholderMatch[1], 10);
        const listMatch = listPlaceholders[listIndex];
        if (listMatch) {
          const liMatches = listMatch.match(/<li[^>]*>(.*?)<\/li>/gi);
          if (liMatches) {
            liMatches.forEach((liMatch) => {
              const content = liMatch.replace(/<li[^>]*>|<\/li>/gi, "").trim();
              if (content) {
                elements.push(
                  <Text key={keyCounter++} style={styles.listItem}>
                    • {processInlineStyles(content)}
                  </Text>
                );
              }
            });
          }
        }
      } else {
        // Processar parágrafo normal
        const content = pMatch.replace(/<p[^>]*>|<\/p>/gi, "").trim();
        if (content) {
          elements.push(
            <Text key={keyCounter++} style={styles.paragraph}>
              {processInlineStyles(content)}
            </Text>
          );
        }
      }
    });
  }

  // Processar listas que não estavam dentro de parágrafos
  if (listMatches) {
    listMatches.forEach((ulMatch, index) => {
      // Verificar se já foi processada
      const placeholder = `___LIST_${index}___`;
      if (!processedHtml.includes(placeholder)) {
        const liMatches = ulMatch.match(/<li[^>]*>(.*?)<\/li>/gi);
        if (liMatches) {
          liMatches.forEach((liMatch) => {
            const content = liMatch.replace(/<li[^>]*>|<\/li>/gi, "").trim();
            if (content) {
              elements.push(
                <Text key={keyCounter++} style={styles.listItem}>
                  • {processInlineStyles(content)}
                </Text>
              );
            }
          });
        }
      }
    });
  }

  // Se não houver elementos processados, processar texto bruto
  if (elements.length === 0) {
    const cleanText = processedHtml.replace(/___LIST_\d+___/g, "").replace(/<[^>]+>/g, "").trim();
    if (cleanText) {
      elements.push(
        <Text key={keyCounter++} style={styles.body}>
          {processInlineStyles(cleanText)}
        </Text>
      );
    }
  }

  return elements.length > 0
    ? elements
    : [
        <Text key="default" style={styles.body}>
          {html.replace(/<[^>]+>/g, "")}
        </Text>,
      ];
};

// Componente do Documento PDF
const DocumentPDF = ({
  title = "",
  body = "",
  hasPatientSignature = false,
  hasProfessionalSignature = false,
  patient = null,
}) => {
  const bodyElements = parseHTML(body);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Título */}
        {title && (
          <View>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.divider} />
          </View>
        )}

        {/* Corpo do documento */}
        <View style={{ flex: 1 }}>
          {bodyElements && bodyElements.length > 0 ? (
            bodyElements.map((element, index) => (
              <View key={index}>{element}</View>
            ))
          ) : (
            <Text style={styles.body}>{body.replace(/<[^>]+>/g, "")}</Text>
          )}
        </View>

        {/* Campos de Assinatura */}
        {(hasPatientSignature || hasProfessionalSignature) && (
          <View style={styles.signatureSection}>
            <View style={styles.divider} />

            {hasPatientSignature && (
              <View style={styles.signatureContainer}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>
                  {patient?.full_name || "Assinatura do Paciente"}
                </Text>
              </View>
            )}

            {hasProfessionalSignature && (
              <View style={styles.signatureContainer}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>
                  Assinatura do Profissional
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 10, marginTop: 20 }}>
              Data: {dayjs().format("DD/MM/YYYY")}
            </Text>
          </View>
        )}

        {/* Rodapé com número da página */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default DocumentPDF;
