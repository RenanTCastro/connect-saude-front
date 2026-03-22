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
  heading1: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "bold",
  },
  placeholderUnfilled: {
    color: "#c0392b",
    fontWeight: 600,
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

// Converte todas as formas de <br> em quebra de linha (\n) para não aparecer literal no PDF
const brToNewline = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.replace(/<br\s*\/?\s*>/gi, "\n");
};

// Função auxiliar para processar estilos inline (bold, italic, underline)
const processInlineStyles = (text, depth = 0) => {
  if (!text || depth > 5) {
    // Limitar profundidade para evitar recursão infinita
    const t = text ? brToNewline(text) : text;
    return t ? t.replace(/<[^>]+>/g, "") : t;
  }

  text = brToNewline(text);

  const parts = [];
  let currentIndex = 0;
  let keyCounter = 0;

  // Regex para encontrar tags de estilo (suporta atributos como style="..." do contentEditable)
  const styleRegex = /<(strong|b|em|i|u)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const placeholderRegex = /<span\s+class="doc-placeholder-unfilled"[^>]*>([\s\S]*?)<\/span>/gi;
  let match;
  const matches = [];
  
  // Coletar todas as matches primeiro (estilo e placeholders)
  while ((match = styleRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: "style",
      tag: match[1].toLowerCase(),
      content: match[2],
    });
  }
  while ((match = placeholderRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      type: "placeholder",
      content: match[1],
    });
  }
  matches.sort((a, b) => a.index - b.index);

  // Processar matches
  matches.forEach((matchData) => {
    // Adicionar texto antes da tag
    if (matchData.index > currentIndex) {
      const beforeText = text.substring(currentIndex, matchData.index);
      if (beforeText.trim()) {
        parts.push(beforeText);
      }
    }

    // Determinar estilo baseado na tag ou tipo
    let style = {};
    if (matchData.type === "placeholder") {
      style = styles.placeholderUnfilled;
    } else if (matchData.tag === "strong" || matchData.tag === "b") {
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

  // Se não houver partes processadas, retornar texto sem tags (text já teve <br> → \n acima)
  if (parts.length === 0) {
    const cleanText = text.replace(/<[^>]+>/g, "");
    return cleanText || text;
  }

  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
};

// Função auxiliar para converter HTML simples para elementos do react-pdf (mantém ordem: h1-h6, p, ul)
const parseHTML = (html) => {
  if (!html) return null;

  html = brToNewline(html);

  const elements = [];
  let keyCounter = 0;

  // Coletar todos os blocos na ordem em que aparecem no documento
  const blocks = [];
  const addBlock = (index, type, data) => blocks.push({ index, type, data });

  // Encontrar títulos (h1 a h6)
  const headingRegex = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1].charAt(1), 10);
    const content = match[2].replace(/<[^>]+>/g, "").trim();
    if (content) addBlock(match.index, "heading", { level, content });
  }

  // Encontrar parágrafos
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = pRegex.exec(html)) !== null) {
    addBlock(match.index, "p", { raw: match[0], content: match[1].trim() });
  }

  // Encontrar listas ul e ol
  const ulRegex = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
  while ((match = ulRegex.exec(html)) !== null) {
    addBlock(match.index, "ul", { raw: match[0] });
  }
  const olRegex = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  while ((match = olRegex.exec(html)) !== null) {
    addBlock(match.index, "ol", { raw: match[0] });
  }

  // Encontrar divs (contentEditable pode gerar div em vez de p)
  // Só adicionar se o div não contiver blocos já processados (p, ul, ol, h) para evitar duplicação
  const divRegex = /<div[^>]*>([\s\S]*?)<\/div>/gi;
  while ((match = divRegex.exec(html)) !== null) {
    const inner = match[1];
    if (!/<(p|ul|ol|h[1-6])[\s>]/i.test(inner)) {
      addBlock(match.index, "div", { content: inner.trim() });
    }
  }

  // Ordenar por posição no documento
  blocks.sort((a, b) => a.index - b.index);

  const headingStyles = {
    1: styles.heading1,
    2: styles.heading2,
    3: styles.heading3,
    4: styles.heading3,
    5: styles.heading3,
    6: styles.heading3,
  };

  blocks.forEach((block) => {
    if (block.type === "heading") {
      const style = headingStyles[block.data.level] || styles.heading2;
      elements.push(
        <Text key={keyCounter++} style={style}>
          {processInlineStyles(block.data.content)}
        </Text>
      );
    } else if (block.type === "p") {
      const content = block.data.content;
      if (content) {
        elements.push(
          <Text key={keyCounter++} style={styles.paragraph}>
            {processInlineStyles(content)}
          </Text>
        );
      }
    } else if (block.type === "ul") {
      const liMatches = block.data.raw.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
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
    } else if (block.type === "ol") {
      const liMatches = block.data.raw.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (liMatches) {
        liMatches.forEach((liMatch, idx) => {
          const content = liMatch.replace(/<li[^>]*>|<\/li>/gi, "").trim();
          if (content) {
            elements.push(
              <Text key={keyCounter++} style={styles.listItem}>
                {idx + 1}. {processInlineStyles(content)}
              </Text>
            );
          }
        });
      }
    } else if (block.type === "div" && block.data.content) {
      elements.push(
        <Text key={keyCounter++} style={styles.paragraph}>
          {processInlineStyles(block.data.content)}
        </Text>
      );
    }
  });

  if (elements.length === 0) {
    const cleanText = html.replace(/<[^>]+>/g, "").trim();
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
