/**
 * Busca dados de endereço a partir de um CEP usando a API ViaCEP
 * @param {string} cep - CEP a ser buscado (apenas números)
 * @returns {Promise<Object|null>} - Objeto com dados do endereço ou null em caso de erro
 */
export const fetchAddressByCEP = async (cep) => {
  // Remove caracteres não numéricos
  const cleanCEP = cep.replace(/\D/g, "");
  
  // Valida se o CEP tem 8 dígitos
  if (cleanCEP.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    const data = await response.json();
    
    // Verifica se o CEP foi encontrado (não retorna erro)
    if (data.erro) {
      return null;
    }
    
    return {
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    return null;
  }
};
