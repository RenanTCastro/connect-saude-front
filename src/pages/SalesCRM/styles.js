export const STAGE_CARD_WIDTH = 300;
export const DRAG_HIGHLIGHT_COLOR = "#1890ff";
export const DRAG_BACKGROUND_COLOR = "#f0f8ff";

export const containerStyles = {
  height: "calc(100vh - 80px)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden"
};

export const headerStyles = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  flexShrink: 0,
  paddingRight: 24
};

export const kanbanBoardStyles = {
  display: "flex",
  gap: 16,
  overflowX: "auto",
  overflowY: "hidden",
  flex: 1,
  paddingBottom: 8,
  paddingRight: 24,
  WebkitOverflowScrolling: "touch"
};
