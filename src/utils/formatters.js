import dayjs from "dayjs";

/**
 * Formata um valor numérico como moeda brasileira (BRL)
 * @param {number} value - Valor a ser formatado
 * @returns {string|null} - Valor formatado ou null se inválido
 */
export const formatCurrency = (value) => {
  if (!value) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata uma data string no formato DD/MM/YYYY
 * @param {string} dateString - Data em formato ISO ou string
 * @returns {string|null} - Data formatada ou null se inválida
 */
export const formatDate = (dateString) => {
  if (!dateString) return null;
  return dayjs(dateString).format("DD/MM/YYYY");
};
