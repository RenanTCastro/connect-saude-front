import { Card } from 'antd';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

const opportunityCardStyles = (isDragging) => ({
  backgroundColor: isDragging ? "#e6f7ff" : "#f5f5f5",
  position: "relative",
  cursor: isDragging ? "grabbing" : "grab",
  opacity: isDragging ? 0.5 : 1,
  flexShrink: 0
});

const opportunityCardBodyStyles = {
  padding: "8px 12px"
};

const opportunityTitleStyles = {
  fontSize: 14,
  fontWeight: 500,
  wordBreak: "break-word",
  marginBottom: 4
};

const opportunityInfoStyles = {
  fontSize: 12,
  color: "#8c8c8c",
  marginTop: 4,
  lineHeight: 1.4
};

const labelStyles = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  padding: "2px 6px",
  borderRadius: 4,
  backgroundColor: "#f0f0f0",
  marginTop: 4
};

const labelDotStyles = (color) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  flexShrink: 0
});

/**
 * Card de oportunidade no Kanban
 * @param {object} opportunity - Dados da oportunidade
 * @param {array} labels - Lista de rótulos disponíveis
 * @param {boolean} isDragging - Indica se alguma oportunidade está sendo arrastada
 * @param {object} draggedOpportunity - Oportunidade que está sendo arrastada
 * @param {function} onDragStart - Callback ao iniciar arrasto
 * @param {function} onDragEnd - Callback ao finalizar arrasto
 * @param {function} onClick - Callback ao clicar no card
 */
export const OpportunityCard = ({ 
  opportunity, 
  labels = [],
  isDragging, 
  draggedOpportunity, 
  onDragStart, 
  onDragEnd, 
  onClick 
}) => {
  const isThisCardDragging = draggedOpportunity?.id === opportunity.id;
  
  // Buscar informações do rótulo baseado no nome
  const labelInfo = opportunity.label 
    ? labels.find(l => l.name === opportunity.label)
    : null;
  
  return (
    <Card
      key={opportunity.id}
      size="small"
      draggable
      onDragStart={(e) => onDragStart(e, opportunity)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        if (!isThisCardDragging && onClick) {
          onClick(opportunity.id);
        }
      }}
      style={{
        ...opportunityCardStyles(isThisCardDragging),
        cursor: isThisCardDragging ? "grabbing" : "pointer"
      }}
      bodyStyle={opportunityCardBodyStyles}
    >
      <div style={opportunityTitleStyles}>
        {opportunity.title}
      </div>
      
      {labelInfo && (
        <div style={labelStyles}>
          <span style={labelDotStyles(labelInfo.color || "#8c8c8c")}></span>
          <span>{labelInfo.name}</span>
        </div>
      )}
      
      {opportunity.patient_name && (
        <div style={opportunityInfoStyles}>
          {opportunity.patient_name}
        </div>
      )}
      
      {(opportunity.created_at || opportunity.estimated_value) && (
        <div style={opportunityInfoStyles}>
          {opportunity.created_at && formatDate(opportunity.created_at)}
          {opportunity.created_at && opportunity.estimated_value && " - "}
          {opportunity.estimated_value && (
            <span style={opportunityInfoStyles}>
              {formatCurrency(opportunity.estimated_value)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
