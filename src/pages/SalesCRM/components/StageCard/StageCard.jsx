import { Card, Button, Dropdown } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { OpportunityCard } from '../OpportunityCard/OpportunityCard';

const STAGE_CARD_WIDTH = 300;
const DRAG_HIGHLIGHT_COLOR = "#1890ff";
const DRAG_BACKGROUND_COLOR = "#f0f8ff";

const stageCardStyles = {
  width: STAGE_CARD_WIDTH,
  height: "100%",
  position: "relative",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  transition: "all 0.2s ease"
};

const stageCardBodyStyles = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  padding: 16,
  overflow: "hidden"
};

const stageHeaderStyles = {
  paddingTop: 8,
  paddingRight: 40,
  fontSize: 16,
  fontWeight: 500,
  wordBreak: "break-word",
  marginBottom: 16,
  flexShrink: 0
};

const opportunitiesContainerStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: 4,
  WebkitOverflowScrolling: "touch"
};

const menuButtonStyles = {
  position: "absolute",
  top: 16,
  right: 16,
  cursor: "pointer",
  zIndex: 10
};

/**
 * Card de estágio no Kanban
 * @param {object} stage - Dados do estágio
 * @param {array} opportunities - Lista de oportunidades do estágio
 * @param {array} labels - Lista de rótulos disponíveis
 * @param {boolean} isDragOver - Indica se está recebendo um arrasto
 * @param {boolean} isDragging - Indica se alguma oportunidade está sendo arrastada
 * @param {object} draggedOpportunity - Oportunidade que está sendo arrastada
 * @param {boolean} loading - Estado de carregamento
 * @param {function} onDragOver - Callback ao passar sobre o card
 * @param {function} onDragLeave - Callback ao sair do card
 * @param {function} onDrop - Callback ao soltar no card
 * @param {function} onDragStart - Callback ao iniciar arrasto
 * @param {function} onDragEnd - Callback ao finalizar arrasto
 * @param {function} onEditStage - Callback ao editar estágio
 * @param {function} onDeleteStage - Callback ao excluir estágio
 * @param {function} onClickOpportunity - Callback ao clicar em oportunidade
 */
export const StageCard = ({ 
  stage, 
  opportunities,
  labels = [],
  isDragOver, 
  isDragging,
  draggedOpportunity,
  loading,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onDragEnd,
  onEditStage,
  onDeleteStage,
  onClickOpportunity
}) => {
  const getMenuItems = () => [
    {
      key: "edit",
      label: "Editar",
      icon: <EditOutlined />,
      onClick: () => onEditStage(stage),
    },
    {
      key: "delete",
      label: "Excluir",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDeleteStage(stage),
    },
  ];

  const cardStyle = {
    ...stageCardStyles,
    borderColor: isDragOver ? DRAG_HIGHLIGHT_COLOR : undefined,
    borderWidth: isDragOver ? 2 : undefined,
    backgroundColor: isDragOver ? DRAG_BACKGROUND_COLOR : undefined,
  };

  return (
    <Card
      key={stage.id}
      style={cardStyle}
      bodyStyle={stageCardBodyStyles}
      loading={loading}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      <div style={menuButtonStyles}>
        <Dropdown
          menu={{ items: getMenuItems() }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ fontSize: 18 }}
          />
        </Dropdown>
      </div>
      
      <div style={stageHeaderStyles}>
        {stage.name}
      </div>

      <div style={opportunitiesContainerStyles}>
        {opportunities.map((opportunity) => (
          <OpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
            labels={labels}
            isDragging={isDragging}
            draggedOpportunity={draggedOpportunity}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onClickOpportunity}
          />
        ))}
      </div>
    </Card>
  );
};
