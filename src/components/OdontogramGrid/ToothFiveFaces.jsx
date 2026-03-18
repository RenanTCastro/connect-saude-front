import React from "react";

/** Surface status → fill color (legenda do usuário) */
export const SURFACE_STATUS_COLORS = {
  caries: "#f5222d",       // Vermelho – Cárie / Doença ativa
  restoration: "#1890ff",  // Azul – Restauração existente
  completed: "#52c41a",    // Verde – Tratamento concluído
  planned: "#faad14",      // Amarelo – Tratamento planejado
};

/** Occlusal view: outer rect, inner rect (center), 4 trapezoids = B, D, L, M. */
const VIEWBOX = "0 0 100 100";
const PAD = 5;
const OUTER = 90;
const INNER_SIZE = 30;
const INNER_PAD = (100 - INNER_SIZE) / 2; // 35

const PATHS = {
  B: "M 5 5 L 95 5 L 65 35 L 35 35 Z",   // top – Buccal
  D: "M 95 5 L 95 95 L 65 65 L 65 35 Z", // right – Distal
  L: "M 95 95 L 5 95 L 35 65 L 65 65 Z", // bottom – Lingual
  M: "M 5 95 L 5 5 L 35 35 L 35 65 Z",  // left – Mesial
  O: "M 35 35 L 65 35 L 65 65 L 35 65 Z", // center – Occlusal
};

const STROKE = "#1890ff";

export default function ToothFiveFaces({ surfaceStatus = {}, onSurfaceClick, fdi }) {
  const getFill = (surface) => {
    const status = surfaceStatus[surface]?.status;
    return status ? SURFACE_STATUS_COLORS[status] || "transparent" : "transparent";
  };

  const handleClick = (e, surface) => {
    e.stopPropagation();
    e.preventDefault();
    onSurfaceClick?.(fdi, surface);
  };

  return (
    <svg
      className="tooth-five-faces-svg"
      viewBox={VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Draw trapezoids first, then center so center is on top */}
      {(["B", "D", "L", "M", "O"]).map((surface) => (
        <path
          key={surface}
          d={PATHS[surface]}
          fill={getFill(surface)}
          stroke={STROKE}
          strokeWidth="1"
          style={{ cursor: onSurfaceClick ? "pointer" : "default" }}
          onClick={(e) => handleClick(e, surface)}
          aria-label={`Face ${surface}`}
        />
      ))}
    </svg>
  );
}
