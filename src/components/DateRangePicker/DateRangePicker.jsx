import { DatePicker, Space, Typography } from 'antd';

const { RangePicker } = DatePicker;
const { Text } = Typography;

/**
 * Seletor de período reutilizável
 * @param {array} value - Valor do range picker (dayjs array)
 * @param {function} onChange - Callback ao alterar data
 * @param {string} format - Formato da data (padrão: "DD/MM/YYYY")
 * @param {object} style - Estilos customizados
 */
export const DateRangePicker = ({
  value,
  onChange,
  format = "DD/MM/YYYY",
  style,
}) => {
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Text strong>Selecione o período:</Text>
      <RangePicker
        value={value}
        onChange={onChange}
        format={format}
        style={{ width: "100%", maxWidth: 300, ...style }}
      />
    </Space>
  );
};
