import { Card, Typography } from "antd";
import { BuildOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function DocumentsTab({ patientId }) {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <Card>
        <BuildOutlined style={{ fontSize: 64, color: "#1890ff", marginBottom: 16 }} />
        <Title level={4}>Documentos</Title>
        <Text type="secondary">Esta funcionalidade está em construção.</Text>
      </Card>
    </div>
  );
}
