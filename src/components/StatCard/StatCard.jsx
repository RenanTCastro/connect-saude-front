import { Card, Space, Typography } from 'antd';

const { Text, Title } = Typography;

/**
 * Card de estatística reutilizável
 * @param {ReactNode} icon - Ícone a ser exibido
 * @param {string} label - Rótulo da estatística
 * @param {number} value - Valor da estatística
 * @param {string} color - Cor do valor (opcional)
 * @param {string} iconColor - Cor do ícone (opcional)
 */
export const StatCard = ({
  icon,
  label,
  value,
  color,
  iconColor,
}) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: "100%" }}>
        {icon && (
          <span style={{ fontSize: 24, color: iconColor || color }}>
            {icon}
          </span>
        )}
        <Text type="secondary">{label}</Text>
        <Title level={3} style={{ margin: 0, color: color || undefined }}>
          R$ {value.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Title>
      </Space>
    </Card>
  );
};
