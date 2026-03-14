import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  Table,
  Switch,
  InputNumber,
  Tag,
  Radio,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../../../services/api";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function IncomesTab({ patientId }) {
  const [incomes, setIncomes] = useState([]);
  const [loadingIncomes, setLoadingIncomes] = useState(false);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeForm] = Form.useForm();
  const [editingIncome, setEditingIncome] = useState(null);
  const [hasInstallments, setHasInstallments] = useState(false);
  const [isEditingInstallment, setIsEditingInstallment] = useState(false);
  const [deleteIncomeConfirm, setDeleteIncomeConfirm] = useState({ 
    open: false, 
    id: null, 
    title: null,
    isInstallment: false,
    deleteOption: "all"
  });
  const [messageApi, contextHolder] = message.useMessage();

  const fetchIncomes = async () => {
    try {
      setLoadingIncomes(true);
      const res = await api.get(`/patients/${patientId}/invoices`);
      // Transformar os dados para o formato esperado pela tabela
      const formattedIncomes = res.data.map((invoice) => {
        // Se for uma parcela: type === "installment" OU (installment existe E total > 1)
        const isInstallment = invoice.type === "installment" || 
          (invoice.installment && invoice.installment.total > 1);
        
        if (isInstallment) {
          return {
            id: `installment_${invoice.id}`,
            transactionId: invoice.transactionId,
            title: `${invoice.title} (${invoice.installment.current}/${invoice.installment.total})`,
            description: invoice.description,
            amount: invoice.amount,
            dueDate: invoice.dueDate,
            paymentDate: invoice.paymentDate,
            isPaid: invoice.isPaid,
            paymentType: invoice.paymentType,
            patientId: patientId,
            installmentNumber: invoice.installment.current,
            isInstallment: true,
          };
        }
        // Se for débito simples (type: "transaction" ou installment com current === total === 1)
        // Remover o prefixo "transaction_" se existir
        const cleanId = invoice.id?.toString().startsWith('transaction_') 
          ? invoice.id.toString().replace('transaction_', '') 
          : invoice.id;
        
        return {
          id: cleanId,
          title: invoice.title,
          description: invoice.description,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          paymentDate: invoice.paymentDate,
          isPaid: invoice.isPaid,
          paymentType: invoice.paymentType,
          patientId: patientId,
          transactionId: invoice.transactionId,
          isInstallment: false,
        };
      });
      setIncomes(formattedIncomes);
    } catch (err) {
      console.error(err);
      messageApi.error("Erro ao buscar débitos do paciente.");
      setIncomes([]);
    } finally {
      setLoadingIncomes(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [patientId]);

  const handleIncomeSubmit = async (values) => {
    try {
      setLoadingIncomes(true);
      
      if (editingIncome) {
        // Editar débito existente
        if (isEditingInstallment) {
          // Para parcelas, enviar apenas os campos permitidos
          const formData = {
            title: values.title,
            description: values.description,
            paymentType: values.paymentType,
            patientId: patientId,
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Débito parcelado atualizado com sucesso!");
        } else {
          // Para débitos simples, enviar todos os campos
          const formData = {
            ...values,
            dueDate: values.dueDate?.format("YYYY-MM-DD"),
            patientId: patientId,
          };
          await api.put(`/cashflow/income/${editingIncome.id}`, formData);
          messageApi.success("Débito atualizado com sucesso!");
        }
      } else {
        // Criar novo débito
        const formData = {
          ...values,
          dueDate: values.dueDate?.format("YYYY-MM-DD"),
          firstInstallmentDate: values.firstInstallmentDate?.format("YYYY-MM-DD"),
          patientId: patientId,
        };
        
        if (values.hasInstallments) {
          formData.installments = {
            count: values.installmentCount,
            firstDate: formData.firstInstallmentDate,
            interval: 1, // Intervalo fixo de 1
            intervalType: values.intervalType,
          };
        }
        
        await api.post("/cashflow/income", formData);
        messageApi.success("Débito criado com sucesso!");
      }
      
      setIsIncomeModalOpen(false);
      incomeForm.resetFields();
      setEditingIncome(null);
      setHasInstallments(false);
      setIsEditingInstallment(false);
      await fetchIncomes();
    } catch (err) {
      console.error(err);
      messageApi.error(editingIncome ? "Erro ao atualizar débito" : "Erro ao criar débito");
    } finally {
      setLoadingIncomes(false);
    }
  };

  const handleEditIncome = (record) => {
    // Verificar se é uma parcela - usar o flag isInstallment ou verificar o ID
    const isInstallment = record.isInstallment || (typeof record.id === 'string' && record.id.startsWith('installment_'));
    
    if (isInstallment) {
      // Para parcelas, usar o transactionId e mostrar apenas campos permitidos
      if (!record.transactionId) {
        messageApi.warning("Não foi possível encontrar o débito principal.");
        return;
      }
      
      // Remover o sufixo de parcela do título
      const cleanTitle = record.title?.replace(/\s*\(\d+\/\d+\)$/, '') || "";
      
      setEditingIncome({
        id: record.transactionId,
        title: cleanTitle,
        description: record.description || "",
        patientId: patientId,
        paymentType: record.paymentType,
      });
      setIsEditingInstallment(true);
      
      incomeForm.setFieldsValue({
        title: cleanTitle,
        description: record.description || "",
        patientId: patientId,
        paymentType: record.paymentType,
      });
    } else {
      // Para débitos simples, mostrar todos os campos
      setEditingIncome(record);
      setIsEditingInstallment(false);
      
      incomeForm.setFieldsValue({
        title: record.title || "",
        description: record.description || "",
        amount: record.amount,
        dueDate: record.dueDate ? dayjs(record.dueDate) : null,
        patientId: patientId,
        paymentType: record.paymentType,
      });
    }
    
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = async () => {
    try {
      setLoadingIncomes(true);
      
      // Se for uma parcela, usar o endpoint de parcelas com a opção escolhida
      if (deleteIncomeConfirm.isInstallment) {
        const installmentId = deleteIncomeConfirm.id.replace('installment_', '');
        await api.delete(`/cashflow/installments/${installmentId}`, {
          params: { option: deleteIncomeConfirm.deleteOption }
        });
        messageApi.success(
          deleteIncomeConfirm.deleteOption === "single" 
            ? "Parcela deletada com sucesso!"
            : deleteIncomeConfirm.deleteOption === "from-this"
            ? "Parcela e próximas deletadas com sucesso!"
            : "Toda a recorrência deletada com sucesso!"
        );
      } else {
        // Se for débito simples, deletar normalmente
        await api.delete(`/cashflow/income/${deleteIncomeConfirm.id}`);
        messageApi.success("Débito deletado com sucesso!");
      }
      
      setDeleteIncomeConfirm({ 
        open: false, 
        id: null, 
        title: null,
        isInstallment: false,
        deleteOption: "all"
      });
      await fetchIncomes();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Erro ao deletar débito";
      messageApi.error(errorMessage);
    } finally {
      setLoadingIncomes(false);
    }
  };

  const handleTogglePaidStatus = async (record) => {
    try {
      setLoadingIncomes(true);
      
      // Se for uma parcela (verificar flag isInstallment ou ID começa com "installment_")
      const isInstallment = record.isInstallment || (typeof record.id === 'string' && record.id.startsWith('installment_'));
      
      if (isInstallment) {
        const installmentId = typeof record.id === 'string' && record.id.startsWith('installment_')
          ? record.id.replace('installment_', '')
          : record.id;
        const res = await api.put(`/cashflow/installments/${installmentId}/pay`);
        messageApi.success(res.data.message);
      } else {
        // Se for transaction simples, usar endpoint de transactions
        const res = await api.put(`/cashflow/transactions/${record.id}/toggle-paid?type=income`);
        messageApi.success(res.data.message);
      }
      
      // Recarregar os dados após o toggle
      await fetchIncomes();
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Erro ao alterar status de pagamento";
      messageApi.error(errorMessage);
      // Recarregar mesmo em caso de erro para garantir sincronização
      await fetchIncomes();
    } finally {
      setLoadingIncomes(false);
    }
  };

  // Colunas da tabela de débitos
  const incomeColumns = [
    {
      title: "Data",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Título",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tipo",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (type) => (
        <Tag color={type === "Dinheiro" ? "green" : type === "PIX" ? "blue" : "purple"}>
          {type}
        </Tag>
      ),
    },
    {
      title: "Valor",
      dataIndex: "amount",
      key: "amount",
      render: (value) => (
        <Text strong style={{ color: "#52c41a" }}>
          R$ {Number(value).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
      align: "right",
    },
    {
      title: "Pago",
      key: "isPaid",
      render: (_, record) => (
        <Switch
          checked={record.isPaid || false}
          onChange={() => handleTogglePaidStatus(record)}
          checkedChildren="Sim"
          unCheckedChildren="Não"
        />
      ),
      align: "center",
    },
    {
      title: "Ações",
      key: "actions",
      render: (_, record) => {
        const isInstallment = record.isInstallment || (typeof record.id === 'string' && record.id.startsWith('installment_'));
        return (
          <Space>
            <Button
              type="default"
              icon={<EditOutlined />}
              onClick={() => handleEditIncome(record)}
              size="small"
              title={isInstallment ? "Editar débito parcelado (apenas alguns campos)" : "Editar"}
            >
              Editar
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const isInstallment = record.isInstallment || (typeof record.id === 'string' && record.id.startsWith('installment_'));
                setDeleteIncomeConfirm({ 
                  open: true, 
                  id: record.id, 
                  title: record.title,
                  isInstallment: isInstallment,
                  deleteOption: isInstallment ? "single" : "all"
                });
              }}
              size="small"
            >
              Excluir
            </Button>
          </Space>
        );
      },
      align: "right",
    },
  ];

  return (
    <div>
      {contextHolder}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={4} style={{ margin: 0 }}>Débitos do Paciente</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingIncome(null);
            setHasInstallments(false);
            setIsEditingInstallment(false);
            incomeForm.resetFields();
            incomeForm.setFieldsValue({ patientId: patientId });
            setIsIncomeModalOpen(true);
          }}
        >
          Novo Débito
        </Button>
      </div>
      <Table
        columns={incomeColumns}
        dataSource={incomes}
        loading={loadingIncomes}
        pagination={{ pageSize: 10, showSizeChanger: false, responsive: true }}
        rowKey="id"
        scroll={{ x: true }}
        showHeader={incomes.length > 0}
        locale={{ emptyText: "Nenhum débito registrado" }}
      />

      {/* Modal de Confirmação de Exclusão de Débito */}
      <Modal
        title="Confirmar Exclusão"
        open={deleteIncomeConfirm.open}
        onOk={handleDeleteIncome}
        onCancel={() => setDeleteIncomeConfirm({ 
          open: false, 
          id: null, 
          title: null,
          isInstallment: false,
          deleteOption: "all"
        })}
        okText="Sim, excluir"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
        confirmLoading={loadingIncomes}
      >
        <div>
          <p style={{ marginBottom: 16 }}>
            Tem certeza que deseja excluir o débito <strong>{deleteIncomeConfirm.title}</strong>?
          </p>
          
          {deleteIncomeConfirm.isInstallment && (
            <div>
              <p style={{ marginBottom: 12, fontWeight: 500 }}>O que você deseja excluir?</p>
              <Radio.Group
                value={deleteIncomeConfirm.deleteOption}
                onChange={(e) => setDeleteIncomeConfirm({ ...deleteIncomeConfirm, deleteOption: e.target.value })}
                style={{ width: "100%" }}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Radio value="single">
                    <strong>Apenas esta parcela</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove apenas a parcela selecionada
                    </div>
                  </Radio>
                  <Radio value="from-this">
                    <strong>Esta e as próximas</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove esta parcela e todas as parcelas futuras
                    </div>
                  </Radio>
                  <Radio value="all">
                    <strong>Toda a recorrência</strong>
                    <div style={{ marginLeft: 24, fontSize: 12, color: "#8c8c8c" }}>
                      Remove todas as parcelas deste débito
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Novo/Editar Débito */}
      <Modal
        title={editingIncome ? (isEditingInstallment ? "Editar Débito Parcelado" : "Editar Débito") : "Novo Débito"}
        open={isIncomeModalOpen}
        onOk={() => incomeForm.submit()}
        onCancel={() => {
          setIsIncomeModalOpen(false);
          incomeForm.resetFields();
          setHasInstallments(false);
          setEditingIncome(null);
          setIsEditingInstallment(false);
        }}
        okText={editingIncome ? "Salvar" : "Criar"}
        cancelText="Cancelar"
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <Form
          form={incomeForm}
          layout="vertical"
          onFinish={handleIncomeSubmit}
        >
          <Form.Item
            name="title"
            label="Título"
            rules={[{ required: true, message: "Informe o título!" }]}
          >
            <Input placeholder="Título do débito" />
          </Form.Item>

          <Form.Item name="description" label="Descrição">
            <TextArea rows={3} placeholder="Descrição do débito" />
          </Form.Item>

          {!isEditingInstallment && (
            <>
              <Form.Item
                name="amount"
                label="Valor"
                rules={[{ required: true, message: "Informe o valor!" }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: "100%" }}
                  prefix="R$"
                  placeholder="0,00"
                  decimalSeparator=","
                  thousandSeparator="."
                />
              </Form.Item>

              <Form.Item
                name="dueDate"
                label="Data de Vencimento"
                rules={[{ required: !hasInstallments, message: "Informe a data de vencimento!" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  format="DD/MM/YYYY"
                  disabled={hasInstallments}
                />
              </Form.Item>
            </>
          )}

          {isEditingInstallment && (
            <div style={{ 
              padding: "12px", 
              backgroundColor: "#f0f0f0", 
              borderRadius: "4px",
              marginBottom: "16px"
            }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <strong>Nota:</strong> Ao editar um débito parcelado, você pode alterar apenas o título, descrição, tipo de pagamento e paciente. 
                O valor e as datas das parcelas não podem ser alterados.
              </Text>
            </div>
          )}

          <Form.Item
            name="paymentType"
            label="Tipo de Pagamento"
            rules={[{ required: true, message: "Selecione o tipo de pagamento!" }]}
          >
            <Select placeholder="Selecione o tipo">
              <Option value="Dinheiro">Dinheiro</Option>
              <Option value="PIX">PIX</Option>
              <Option value="Cartão">Cartão</Option>
              <Option value="Transferência">Transferência</Option>
            </Select>
          </Form.Item>

          {!editingIncome && !isEditingInstallment && (
            <Form.Item name="hasInstallments" valuePropName="checked">
              <Switch 
                checkedChildren="Parcelado" 
                unCheckedChildren="À vista"
                onChange={(checked) => {
                  setHasInstallments(checked);
                  if (!checked) {
                    incomeForm.setFieldsValue({
                      installmentCount: undefined,
                      firstInstallmentDate: undefined,
                      intervalType: undefined,
                    });
                  }
                }}
              />
            </Form.Item>
          )}

          {hasInstallments && !editingIncome && !isEditingInstallment && (
            <>
              <Form.Item
                name="installmentCount"
                label="Número de Parcelas"
                rules={[
                  {
                    required: true,
                    message: "Informe o número de parcelas!",
                  },
                ]}
              >
                <InputNumber min={2} max={60} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="firstInstallmentDate"
                label="Data da Primeira Parcela"
                rules={[
                  {
                    required: true,
                    message: "Informe a data da primeira parcela!",
                  },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item
                name="intervalType"
                label="Intervalo entre Parcelas"
                rules={[{ required: true, message: "Selecione o intervalo!" }]}
              >
                <Select placeholder="Selecione o intervalo">
                  <Option value="daily">Diário</Option>
                  <Option value="weekly">Semanal</Option>
                  <Option value="monthly">Mensal</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
