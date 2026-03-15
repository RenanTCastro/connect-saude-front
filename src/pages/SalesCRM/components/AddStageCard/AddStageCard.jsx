import { Card, Typography } from 'antd';
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

const STAGE_CARD_WIDTH = 300;

const addStageCardStyles = {
  width: STAGE_CARD_WIDTH,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  borderStyle: "dashed",
  flexShrink: 0,
};

const addStageCardBodyStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
  height: "100%"
};

/**
 * Card para adicionar novo estágio
 * @param {function} onClick - Callback ao clicar no card
 */
export const AddStageCard = ({ onClick }) => (
  <Card
    style={addStageCardStyles}
    bodyStyle={addStageCardBodyStyles}
    onClick={onClick}
  >
    <Text style={{ fontSize: 16, fontWeight: 500, color: "#8c8c8c" }}>Adicionar Estágio</Text>
    <PlusOutlined style={{ fontSize: 32, color: "#8c8c8c" }} />
  </Card>
);
