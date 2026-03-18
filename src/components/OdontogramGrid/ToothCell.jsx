import React from "react";
import ToothFiveFaces from "./ToothFiveFaces";

/**
 * Anatomical tooth outline (root + crown), lateral view.
 */
function ToothAnatomy({ className }) {
  return (
    <svg className={className} viewBox="0 0 20 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* root */}
      <path d="M4 8 L4 28 L16 28 L16 8" stroke="#bfbfbf" strokeWidth="1.2" fill="none" />
      {/* crown outline */}
      <path d="M2 4 Q10 0 18 4 L16 8 L4 8 Z" stroke="#bfbfbf" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export default function ToothCell({ fdi, isUpper, annotation, status, surfaceAnnotations = {}, onSurfaceClick, onClick }) {
  const hasSurfaceAnnotation = surfaceAnnotations && Object.keys(surfaceAnnotations).length > 0;
  const hasAnnotation = !!annotation || hasSurfaceAnnotation;
  const isRemoved = status === "removido";
  const statusClass = status === "aberto" ? "status-aberto" : status === "finalizado" ? "status-finalizado" : "";

  if (isRemoved) {
    return (
      <div
        className={`tooth-cell tooth-cell-removed ${isUpper ? "" : "lower"}`}
        onClick={() => onClick(fdi)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick(fdi)}
      >
        {isUpper && (
          <span className="tooth-fdi-num">
            {fdi}
            {hasAnnotation && <span className="tooth-annotation-badge">!</span>}
          </span>
        )}
        <span className="tooth-removed-x" aria-hidden>×</span>
        {!isUpper && (
          <span className="tooth-fdi-num below">
            {fdi}
            {hasAnnotation && <span className="tooth-annotation-badge">!</span>}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`tooth-cell ${isUpper ? "" : "lower"} ${hasAnnotation ? "has-annotation" : ""} ${statusClass}`}
      onClick={() => onClick(fdi)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(fdi)}
    >
      {isUpper && (
        <span className="tooth-fdi-num">
          {fdi}
          {hasAnnotation && <span className="tooth-annotation-badge">!</span>}
        </span>
      )}
      <ToothAnatomy className="tooth-anatomy" />
      <div className="tooth-five-faces" onClick={(e) => e.stopPropagation()}>
        <ToothFiveFaces
          fdi={fdi}
          surfaceStatus={surfaceAnnotations}
          onSurfaceClick={onSurfaceClick}
        />
      </div>
      {!isUpper && (
        <span className="tooth-fdi-num below">
          {fdi}
          {hasAnnotation && <span className="tooth-annotation-badge">!</span>}
        </span>
      )}
    </div>
  );
}
