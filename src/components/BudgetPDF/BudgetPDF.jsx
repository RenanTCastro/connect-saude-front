import React from "react";
import { Document, Page, Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import dayjs from "dayjs";

const FIVE_FACES_PATHS = {
  B: "M 5 5 L 95 5 L 65 35 L 35 35 Z",
  D: "M 95 5 L 95 95 L 65 65 L 65 35 Z",
  L: "M 95 95 L 5 95 L 35 65 L 65 65 Z",
  M: "M 5 95 L 5 5 L 35 35 L 35 65 Z",
  O: "M 35 35 L 65 35 L 65 65 L 35 65 Z",
};

const SURFACE_STATUS_COLORS = {
  caries: "#f5222d",
  restoration: "#1890ff",
  completed: "#52c41a",
  planned: "#faad14",
};

const FDI_QUADRANTS_PERMANENT = [
  [18, 17, 16, 15, 14, 13, 12, 11],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41],
  [31, 32, 33, 34, 35, 36, 37, 38],
];

const FDI_QUADRANTS_DECIDUOUS = [
  [55, 54, 53, 52, 51],
  [61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81],
  [71, 72, 73, 74, 75],
];

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "R$ 0,00";
  return `R$ ${Number(value).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#666666",
    marginBottom: 16,
  },
  divider: {
    borderBottom: "1 solid #CCCCCC",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  patientRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  patientLabel: {
    width: 80,
    fontWeight: "bold",
  },
  odontogramContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  odontogramSubSection: {
    marginBottom: 16,
  },
  odontogramSubTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333333",
  },
  quadrantRow: {
    flexDirection: "row",
    marginBottom: 4,
    justifyContent: "center",
  },
  quadrantPair: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  quadrant: {
    flexDirection: "row",
    marginHorizontal: 8,
  },
  toothCell: {
    width: 28,
    height: 44,
    borderWidth: 0.5,
    borderColor: "#999999",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    fontSize: 7,
  },
  toothCellFdiBox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  toothCellFdiBoxHighlight: {
    backgroundColor: "#faad14",
  },
  toothCellFdi: {
    fontWeight: "bold",
  },
  toothCellFaces: {
    width: 24,
    height: 24,
  },
  toothCellExtractedX: {
    width: 24,
    height: 24,
  },
  regionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  regionTag: {
    backgroundColor: "#faad14",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 9,
    marginRight: 4,
    marginBottom: 4,
  },
  table: {
    marginTop: 12,
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#dddddd",
    paddingVertical: 4,
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 4,
    marginBottom: 4,
    fontWeight: "bold",
    fontSize: 10,
  },
  colProcedure: {
    width: "50%",
    paddingRight: 8,
  },
  colTarget: {
    width: "25%",
    paddingRight: 8,
  },
  colValue: {
    width: "25%",
    textAlign: "right",
  },
  totalsSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 11,
  },
  totalRowBold: {
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 4,
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

function isToothExtracted(fdi, annotations, dentition) {
  const annot = annotations?.find(
    (a) =>
      a.element_type === "tooth" &&
      a.element_key === String(fdi) &&
      a.dentition === dentition
  );
  return annot?.status === "removido";
}

function getSurfaceAnnotationsForTooth(fdi, annotations, dentition, teethWithTreatment) {
  const prefix = `${fdi}-`;
  const surfaceCodes = ["B", "D", "L", "M", "O"];
  const result = {};
  const hasTreatment = teethWithTreatment.has(String(fdi));
  surfaceCodes.forEach((code) => {
    const annot = annotations?.find(
      (a) =>
        a.element_type === "tooth_surface" &&
        a.element_key === prefix + code &&
        a.dentition === dentition
    );
    if (annot) {
      result[code] = { status: annot.status };
    } else if (hasTreatment) {
      result[code] = { status: "planned" };
    }
  });
  return result;
}

export default function BudgetPDF({ patient = null, budget = null, dentition = "permanent", annotations = [] }) {
  const treatments = budget?.treatments ?? [];
  const budgetDate = budget?.budget_date;
  const discount = Number(budget?.discount) || 0;
  const subtotal = treatments.reduce((sum, t) => sum + (Number(t.value) || 0), 0);
  const total = budget?.total != null ? budget.total : Math.max(0, subtotal - discount);

  const teethWithTreatment = new Set(
    treatments
      .filter((t) => t.target_type === "dente" && t.tooth_fdi)
      .map((t) => String(t.tooth_fdi))
  );

  const regionsWithTreatment = treatments
    .filter((t) => t.target_type === "regiao" && t.region_name)
    .map((t) => t.region_name);

  const uniqueRegions = [...new Set(regionsWithTreatment)];

  const odontogramSets = [
    { quadrants: FDI_QUADRANTS_PERMANENT, dentition: "permanent", label: "Permanente" },
    { quadrants: FDI_QUADRANTS_DECIDUOUS, dentition: "deciduous", label: "Decíduo" },
  ];

  const renderToothCell = (fdi, dentitionType) => {
    const hasTreatment = teethWithTreatment.has(String(fdi));
    const extracted = isToothExtracted(fdi, annotations, dentitionType);

    if (extracted) {
      return (
        <View key={fdi} style={styles.toothCell}>
          <View style={[styles.toothCellFdiBox, hasTreatment && styles.toothCellFdiBoxHighlight]}>
            <Text style={styles.toothCellFdi}>{fdi}</Text>
          </View>
          <Svg viewBox="0 0 24 24" width={24} height={24} style={styles.toothCellExtractedX}>
            <Path d="M2 2 L22 22 M22 2 L2 22" stroke="#8c8c8c" strokeWidth={2} />
          </Svg>
        </View>
      );
    }

    const surfaceStatus = getSurfaceAnnotationsForTooth(fdi, annotations, dentitionType, teethWithTreatment);
    const getFill = (face) => {
      const status = surfaceStatus[face]?.status;
      return status ? SURFACE_STATUS_COLORS[status] || "#ffffff" : "#ffffff";
    };
    return (
      <View key={fdi} style={styles.toothCell}>
        <View style={[styles.toothCellFdiBox, hasTreatment && styles.toothCellFdiBoxHighlight]}>
          <Text style={styles.toothCellFdi}>{fdi}</Text>
        </View>
        <Svg viewBox="0 0 100 100" width={24} height={24} style={styles.toothCellFaces}>
          {(["B", "D", "L", "M", "O"]).map((face) => (
            <Path
              key={face}
              d={FIVE_FACES_PATHS[face]}
              fill={getFill(face)}
              stroke="#333333"
              strokeWidth={1}
            />
          ))}
        </Svg>
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Orçamento</Text>
        <Text style={styles.subtitle}>
          {budgetDate ? dayjs(budgetDate).format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY")}
        </Text>
        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Dados do Paciente</Text>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Nome:</Text>
          <Text>{patient?.full_name || "—"}</Text>
        </View>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>Telefone:</Text>
          <Text>{patient?.phone || "—"}</Text>
        </View>
        <View style={styles.patientRow}>
          <Text style={styles.patientLabel}>CPF:</Text>
          <Text>{patient?.cpf || "—"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Odontograma</Text>
        <View style={styles.odontogramContainer}>
          {odontogramSets.map(({ quadrants, dentition: dentitionType, label }) => (
            <View key={label} style={styles.odontogramSubSection}>
              <Text style={styles.odontogramSubTitle}>{label}</Text>
              <View style={styles.quadrantPair}>
                {quadrants.slice(0, 2).map((fdis, qIndex) => (
                  <View key={qIndex} style={styles.quadrant}>
                    {fdis.map((fdi) => renderToothCell(fdi, dentitionType))}
                  </View>
                ))}
              </View>
              <View style={styles.quadrantPair}>
                {quadrants.slice(2, 4).map((fdis, qIndex) => (
                  <View key={qIndex + 2} style={styles.quadrant}>
                    {fdis.map((fdi) => renderToothCell(fdi, dentitionType))}
                  </View>
                ))}
              </View>
            </View>
          ))}
          {uniqueRegions.length > 0 && (
            <View style={styles.regionList}>
              {uniqueRegions.map((r) => (
                <View key={r} style={styles.regionTag}>
                  <Text>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Procedimentos</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colProcedure}>Procedimento</Text>
            <Text style={styles.colTarget}>Dente/Região</Text>
            <Text style={styles.colValue}>Valor</Text>
          </View>
          {treatments.map((t, idx) => {
            const target =
              t.target_type === "dente" ? `Dente ${t.tooth_fdi}` : t.region_name || "—";
            return (
              <View key={t.id ?? idx} style={styles.tableRow}>
                <Text style={styles.colProcedure}>{t.procedure_name || "Procedimento"}</Text>
                <Text style={styles.colTarget}>{target}</Text>
                <Text style={styles.colValue}>{formatCurrency(t.value)}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatCurrency(subtotal)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.totalRow}>
              <Text>Desconto:</Text>
              <Text>{formatCurrency(discount)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalRowBold]}>
            <Text>Total:</Text>
            <Text>{formatCurrency(total)}</Text>
          </View>
        </View>

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
}
