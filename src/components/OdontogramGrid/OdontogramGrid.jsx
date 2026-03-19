import React, { useState } from "react";
import { Modal, Segmented, Tooltip, Button, Checkbox, Select, Input } from "antd";

const { TextArea } = Input;
import { InfoCircleOutlined } from "@ant-design/icons";
import ToothCell from "./ToothCell";
import { SURFACE_STATUS_COLORS } from "./ToothFiveFaces";
import "./OdontogramGrid.css";

export const SURFACE_STATUS_LABELS = {
  caries: "Vermelho - Cárie / Doença ativa",
  restoration: "Azul - Restauração existente",
  completed: "Verde - Tratamento concluído",
  planned: "Amarelo - Tratamento planejado",
};

const SURFACE_STATUS_NAMES = {
  caries: "Vermelho",
  restoration: "Azul",
  completed: "Verde",
  planned: "Amarelo",
};

// FDI by quadrant: [topLeft, topRight, bottomLeft, bottomRight]
// Permanent: upper R 18→11, upper L 21→28, lower R 48→41, lower L 31→38
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

const PILL_REGIONS = [
  { key: "maxila", label: "Maxila" },
  { key: "mandibula", label: "Mandíbula" },
  { key: "face", label: "Face" },
  { key: "arcada_superior", label: "Arcada superior" },
  { key: "arcada_inferior", label: "Arcada inferior" },
  { key: "arcadas", label: "Arcadas" },
];

const DENTITION_OPTIONS = [
  { value: "permanent", label: "Permanentes" },
  { value: "deciduous", label: "Decíduos" },
];

function OdontogramGrid({
  inline = false,
  open: modalOpen,
  onCancel,
  dentition,
  onDentitionChange,
  annotations,
  getAnnotationFor,
  getSurfaceAnnotationsForTooth,
  getTreatmentsForTooth,
  onSaveAnnotation,
  onSaveSurfaceAnnotation,
  onDeleteAnnotation,
  onDeleteSurfaceAnnotation,
}) {
  const [activeRegion, setActiveRegion] = useState(null);
  const [showAberto, setShowAberto] = useState(true);
  const [showFinalizado, setShowFinalizado] = useState(true);
  const [annotationModal, setAnnotationModal] = useState(null);
  const [surfaceModal, setSurfaceModal] = useState(null);
  const [regionModal, setRegionModal] = useState(null);

  const quadrants = dentition === "permanent" ? FDI_QUADRANTS_PERMANENT : FDI_QUADRANTS_DECIDUOUS;
  const isUpper = (qIndex) => qIndex === 0 || qIndex === 1;

  const handleToothClick = (fdi) => {
    const annot = getAnnotationFor(String(fdi), "tooth");
    setAnnotationModal({
      fdi: String(fdi),
      elementType: "tooth",
      elementKey: String(fdi),
      annotation: annot,
      treatments: getTreatmentsForTooth ? getTreatmentsForTooth(String(fdi)) : [],
    });
  };

  const handleSurfaceClick = (fdi, surface) => {
    setSurfaceModal({ fdi: String(fdi), surface });
  };

  const content = (
    <>
        <div className="odontogram-filters-top">
          <div className="odontogram-legend-item">
            <Checkbox checked={showAberto} onChange={(e) => setShowAberto(e.target.checked)} />
            <span className="legend-icon blue" />
            <span>Em tratamento</span>
          </div>
          <div className="odontogram-legend-item">
            <Checkbox checked={showFinalizado} onChange={(e) => setShowFinalizado(e.target.checked)} />
            <span className="legend-icon green" />
            <span>Finalizado</span>
          </div>
        </div>

        <div className="odontogram-toggle-wrap">
          <Segmented
            options={DENTITION_OPTIONS}
            value={dentition}
            onChange={onDentitionChange}
            size="middle"
          />
        </div>

        <div className="odontogram-grid">
          {quadrants.map((fdis, qIndex) => (
            <div key={qIndex} className="odontogram-quadrant">
              {fdis.map((fdi) => {
                const annot = getAnnotationFor(String(fdi), "tooth");
                const status = annot?.status ?? null;
                const bothUnchecked = !showAberto && !showFinalizado;
                const visibleByStatus = bothUnchecked
                  ? true
                  : showAberto && showFinalizado
                    ? status === "aberto" || status === "finalizado"
                    : showAberto
                      ? status === "aberto"
                      : showFinalizado
                        ? status === "finalizado"
                        : true;
                if (!visibleByStatus) return null;
                const surfaceAnnotations = getSurfaceAnnotationsForTooth ? getSurfaceAnnotationsForTooth(String(fdi)) : {};
                return (
                  <ToothCell
                    key={fdi}
                    fdi={fdi}
                    isUpper={isUpper(qIndex)}
                    annotation={annot}
                    status={annot?.status}
                    surfaceAnnotations={surfaceAnnotations}
                    onSurfaceClick={handleSurfaceClick}
                    onClick={handleToothClick}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="odontogram-pills">
          {PILL_REGIONS.map(({ key, label }) => {
            const regionAnnot = getAnnotationFor(key, key);
            const hasRegionAnnotation = !!regionAnnot;
            return (
              <Button
                key={key}
                type={activeRegion === key ? "primary" : "default"}
                size="small"
                onClick={() => setRegionModal({ key, label })}
                className={hasRegionAnnotation ? "odontogram-pill-has-annotation" : ""}
              >
                {label}
                {hasRegionAnnotation && <span className="tooth-annotation-badge">!</span>}
              </Button>
            );
          })}
        </div>
    </>
  );

  return (
    <>
      {inline ? (
        <div className="odontogram-inline">{content}</div>
      ) : (
        <Modal
          className="odontogram-modal"
          open={modalOpen}
          onCancel={onCancel}
          footer={null}
          width={720}
          destroyOnClose
          title={null}
          closable={false}
        >
          {content}
        </Modal>
      )}

      {surfaceModal && (
        <SurfaceStatusModal
          visible={!!surfaceModal}
          onClose={() => setSurfaceModal(null)}
          fdi={surfaceModal.fdi}
          surface={surfaceModal.surface}
          currentAnnotation={getSurfaceAnnotationsForTooth?.(surfaceModal.fdi)?.[surfaceModal.surface]}
          onSaveSurfaceAnnotation={onSaveSurfaceAnnotation}
          onDeleteSurfaceAnnotation={onDeleteSurfaceAnnotation}
        />
      )}

      {regionModal && (
        <RegionAnnotationModal
          visible={!!regionModal}
          onClose={() => setRegionModal(null)}
          title={regionModal.label}
          annotation={getAnnotationFor(regionModal.key, regionModal.key)}
          onSave={async (text) => {
            await onSaveAnnotation(regionModal.key, regionModal.key, text, null, getAnnotationFor(regionModal.key, regionModal.key)?.id);
            setRegionModal(null);
          }}
          onDelete={
            getAnnotationFor(regionModal.key, regionModal.key)
              ? async () => {
                  const id = getAnnotationFor(regionModal.key, regionModal.key)?.id;
                  if (id && onDeleteAnnotation) {
                    await onDeleteAnnotation(id);
                    setRegionModal(null);
                  }
                }
              : null
          }
        />
      )}

      {annotationModal && (
        <AnnotationModal
          visible={!!annotationModal}
          onClose={() => setAnnotationModal(null)}
          fdi={annotationModal.fdi}
          annotation={annotationModal.annotation}
          treatments={annotationModal.treatments}
          onSave={async (text, status) => {
            await onSaveAnnotation(
              annotationModal.elementKey,
              annotationModal.elementType,
              text,
              status,
              annotationModal.annotation?.id
            );
            setAnnotationModal(null);
          }}
          onDelete={
            annotationModal.annotation
              ? async () => {
                  if (onDeleteAnnotation && annotationModal.annotation?.id) {
                    await onDeleteAnnotation(annotationModal.annotation.id);
                    setAnnotationModal(null);
                  }
                }
              : null
          }
        />
      )}
    </>
  );
}

function RegionAnnotationModal({ visible, onClose, title, annotation, onSave, onDelete }) {
  const [text, setText] = useState(annotation?.annotation_text ?? "");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) setText(annotation?.annotation_text ?? "");
  }, [visible, annotation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(text.trim() || "");
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${title} - Anotação`}
      open={visible}
      onCancel={onClose}
      width={400}
      destroyOnClose
      footer={[
        ...(onDelete && annotation
          ? [
              <Button key="delete" danger onClick={async () => { await onDelete(); onClose(); }}>
                Remover anotação
              </Button>,
            ]
          : []),
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>Salvar</Button>,
      ]}
    >
      <TextArea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Anotação para esta região..."
        maxLength={500}
        style={{ marginBottom: '10px' }}
        showCount
      />
    </Modal>
  );
}

const SURFACE_NAMES = { B: "Bucal", D: "Distal", L: "Lingual", M: "Mesial", O: "Oclusal" };

function SurfaceStatusModal({
  visible,
  onClose,
  fdi,
  surface,
  currentAnnotation,
  onSaveSurfaceAnnotation,
  onDeleteSurfaceAnnotation,
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState(currentAnnotation?.annotation_text ?? "");
  const [selectedStatus, setSelectedStatus] = useState(currentAnnotation?.status ?? null);

  React.useEffect(() => {
    if (visible) {
      setText(currentAnnotation?.annotation_text ?? "");
      setSelectedStatus(currentAnnotation?.status ?? null);
    }
  }, [visible, currentAnnotation]);

  const handleSave = async () => {
    if (!onSaveSurfaceAnnotation) return;
    if (!selectedStatus) return; // exige uma cor
    setLoading(true);
    try {
      await onSaveSurfaceAnnotation(fdi, surface, selectedStatus, text.trim() || null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!currentAnnotation?.id || !onDeleteSurfaceAnnotation) return;
    setLoading(true);
    try {
      await onDeleteSurfaceAnnotation(currentAnnotation.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const surfaceLabel = SURFACE_NAMES[surface] || surface;

  return (
    <Modal
      title={`Dente ${fdi} - Face ${surfaceLabel}`}
      open={visible}
      onCancel={onClose}
      width={400}
      destroyOnClose
      footer={[
        ...(currentAnnotation?.id
          ? [
              <Button key="clear" danger onClick={handleClear} loading={loading}>
                Remover
              </Button>,
            ]
          : []),
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave} disabled={!selectedStatus}>
          Salvar
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>Anotação</label>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Observação ou comentário para esta face..."
            maxLength={500}
            showCount
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Cor / Status</label>
          <Select
            value={selectedStatus || undefined}
            onChange={setSelectedStatus}
            placeholder="Selecione a cor"
            style={{ width: "100%" }}
            allowClear
            options={["caries", "restoration", "completed", "planned"].map((status) => ({
              value: status,
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: SURFACE_STATUS_COLORS[status],
                      flexShrink: 0,
                      border: "1px solid rgba(0,0,0,0.15)",
                    }}
                  />
                  {SURFACE_STATUS_NAMES[status]}
                </span>
              ),
            }))}
            optionLabelProp="label"
          />
        </div>
      </div>
    </Modal>
  );
}

function AnnotationModal({ visible, onClose, fdi, annotation, treatments, onSave, onDelete }) {
  const isRemovido = annotation?.status === "removido";
  const [text, setText] = useState(annotation?.annotation_text ?? "");
  const [status, setStatus] = useState(isRemovido ? "aberto" : (annotation?.status ?? ""));
  const [extraido, setExtraido] = useState(!!isRemovido);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setText(annotation?.annotation_text ?? "");
      const removido = annotation?.status === "removido";
      setExtraido(!!removido);
      setStatus(removido ? "aberto" : (annotation?.status ?? ""));
    }
  }, [visible, annotation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const statusToSave = extraido ? "removido" : (status || null);
      await onSave(text.trim() || "", statusToSave);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Dente ${fdi} - Anotação`}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Salvar"
      cancelText="Cancelar"
      confirmLoading={saving}
      destroyOnClose
      width={400}
      footer={[
        ...(onDelete && annotation
          ? [
              <Button key="delete" danger onClick={async () => { await onDelete(); onClose(); }}>
                Remover anotação
              </Button>,
            ]
          : []),
        <Button key="cancel" onClick={onClose}>Cancelar</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>Salvar</Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Anotação</label>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Anotação / comentário"
            maxLength={500}
            showCount
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4 }}>Status</label>
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: "100%" }}
            allowClear
            placeholder="Sem status"
            options={[
              { value: "", label: "Sem status" },
              { value: "aberto", label: "Em tratamento" },
              { value: "finalizado", label: "Finalizado" },
            ]}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Dente extraído</label>
          <Segmented
            value={extraido ? "sim" : "nao"}
            onChange={(v) => setExtraido(v === "sim")}
            options={[
              { value: "nao", label: "Não" },
              { value: "sim", label: "Sim" },
            ]}
            block
          />
        </div>
        {treatments && treatments.length > 0 && (
          <div>
            <label style={{ display: "block", marginBottom: 4 }}>Tratamentos vinculados</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {treatments.map((t) => (
                <span key={t.id} style={{ background: "#e6f4ff", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>
                  {t.procedure_name || "Tratamento"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default React.memo(OdontogramGrid);
