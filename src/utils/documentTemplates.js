import dayjs from "dayjs";
import { marked } from "marked";

export const DOCUMENT_TYPES = {
  CONTRACT: 'contract',
  CONSENT: 'consent',
  PRESCRIPTION: 'prescription',
  CERTIFICATE: 'certificate',
  CUSTOM: 'custom'
};

/** Converte Markdown em HTML para o editor e PDF */
function mdToHtml(md) {
  if (!md || typeof md !== "string") return md || "";
  return marked(md.trim(), { async: false });
}

/** Envolve placeholders [CAMPO] não preenchidos em span vermelho para destaque */
function wrapUnfilledPlaceholders(html) {
  if (!html || typeof html !== "string") return html || "";
  return html.replace(
    /\[([^\]]+)\]/g,
    '<span class="doc-placeholder-unfilled">[$1]</span>'
  );
}

function formatCurrency(value) {
  if (value == null || isNaN(value)) return "R$ 0,00";
  return `R$ ${Number(value).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function getProceduresListFromBudget(budget) {
  if (!budget?.treatments?.length) return "[LISTA DE PROCEDIMENTOS]";
  return budget.treatments
    .map((t) => {
      const proc = t.procedure_name || "Procedimento";
      const target = t.target_type === "dente" ? `Dente ${t.tooth_fdi}` : t.region_name || "";
      return target ? `• ${proc} (${target}) - ${formatCurrency(t.value)}` : `• ${proc} - ${formatCurrency(t.value)}`;
    })
    .join("\n\n");
}

function getPaymentConditionsFromBudget(budget) {
  if (!budget) return "[CONDIÇÕES DE PAGAMENTO]";
  const total = Number(budget.total) || 0;
  const down = Number(budget.down_payment) || 0;
  const installments = Number(budget.installments_count) || 1;
  if (installments <= 1 && down <= 0) {
    return `Pagamento à vista no valor total de ${formatCurrency(total)}.`;
  }
  const parts = [];
  if (down > 0) parts.push(`Entrada de ${formatCurrency(down)}`);
  if (installments > 1) {
    const remainder = Math.max(0, total - down);
    const perInstallment = remainder / installments;
    parts.push(`${installments}x de ${formatCurrency(perInstallment)}`);
  }
  return parts.join(" e ") + ".";
}

export const getDocumentTemplate = (type, patient = null, budget = null) => {
  const proceduresList = budget ? getProceduresListFromBudget(budget) : "[LISTA DE PROCEDIMENTOS]";
  const budgetTotal =
    budget?.total != null
      ? budget.total
      : budget?.treatments?.length
        ? budget.treatments.reduce((s, t) => s + (Number(t.value) || 0), 0) - (Number(budget.discount) || 0)
        : null;
  const valorTotal = budgetTotal != null ? formatCurrency(budgetTotal) : "[VALOR TOTAL]";
  const condicoesPagamento = budget ? getPaymentConditionsFromBudget({ ...budget, total: budgetTotal ?? budget.total }) : "[CONDIÇÕES DE PAGAMENTO]";

  const templates = {
    [DOCUMENT_TYPES.CONTRACT]: {
      title: 'Termo de Prestação de Serviços Odontológicos',
      body: wrapUnfilledPlaceholders(mdToHtml(`
## I - IDENTIFICAÇÃO DAS PARTES

**PACIENTE (CONTRATANTE):**

**${patient?.full_name || '[NOME DO PACIENTE]'}**  
CPF: ${patient?.cpf || '[CPF]'}  
Data de Nascimento: ${patient?.birth_date ? dayjs(patient.birth_date).format('DD/MM/YYYY') : '[DATA DE NASCIMENTO]'}  
Endereço: ${patient?.street ? [patient.street, patient.complement, patient.neighborhood, patient.city, patient.state].filter(Boolean).join(', ') : '[ENDEREÇO COMPLETO]'}  
CEP: ${patient?.zip_code || '[CEP]'}  
Telefone: ${patient?.phone || '[TELEFONE]'}  
E-mail: [E-MAIL]

**PROFISSIONAL / CLÍNICA (CONTRATADO):**

[NOME DO PROFISSIONAL OU CLÍNICA]  
CPF/CNPJ: [CPF/CNPJ]  
CRO: [CRO]  
Endereço do Consultório: [ENDEREÇO DO CONSULTÓRIO]

As partes acima identificadas, de comum acordo e com plena capacidade civil, celebram o presente Termo de Prestação de Serviços Odontológicos, regido pelo Código Civil Brasileiro, pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), pelo Código de Ética Odontológica e pela legislação correlata.

## II - SERVIÇOS CONTRATADOS E PLANO DE TRATAMENTO

**Cláusula 1ª - Objeto do Contrato**

O presente instrumento tem como finalidade a prestação de serviços odontológicos pelo(a) CONTRATADO(A), devidamente habilitado(a) perante o Conselho Regional de Odontologia, ao(à) paciente **${patient?.full_name || '[NOME DO PACIENTE]'}**, abrangendo os procedimentos descritos a seguir:

**Procedimentos contratados:**  
${proceduresList}

§ 1º Os atendimentos serão realizados conforme agenda previamente acordada entre as partes, respeitando os horários estabelecidos no momento do agendamento.

§ 2º Caso se identifique, durante a execução do tratamento, a necessidade de procedimentos complementares não previstos inicialmente, estes somente serão realizados com a concordância expressa do(a) paciente, após devida comunicação e esclarecimento.

§ 3º O(A) CONTRATANTE declara estar ciente das características dos materiais e produtos a serem utilizados, bem como de que a durabilidade dos resultados pode variar de acordo com fatores individuais, incluindo hábitos, saúde geral e colaboração com as orientações fornecidas.

**Cláusula 2ª - Consentimento Informado**

O(A) CONTRATANTE declara, de forma livre e esclarecida, que o(a) profissional apresentou de maneira clara e acessível todas as informações relevantes sobre os procedimentos a serem realizados, incluindo: finalidade, técnicas empregadas, possíveis desconfortos, riscos conhecidos, alternativas de tratamento e expectativas de resultado, considerando as condições clínicas individuais do(a) paciente.

*Parágrafo único.* O(A) CONTRATANTE compreende que os resultados estão condicionados às características fisiológicas, anatômicas e biológicas de cada indivíduo, e que não há garantia de satisfação subjetiva, mas sim o compromisso do profissional de empregar a melhor técnica disponível e agir com zelo e diligência.

## III - HONORÁRIOS E CONDIÇÕES DE PAGAMENTO

**Cláusula 3ª - Valor dos Serviços**

O valor total acordado para a realização dos procedimentos contratados é de ${valorTotal}, correspondente aos custos de materiais, insumos descartáveis e honorários profissionais.

§ 1º As condições de pagamento são as seguintes: ${condicoesPagamento}

§ 2º O inadimplemento dos honorários poderá acarretar a suspensão do tratamento, garantidos os cuidados necessários à saúde do(a) paciente, bem como a adoção das medidas extrajudiciais e judiciais cabíveis para a cobrança dos valores devidos.

§ 3º Nos casos em que procedimentos forem parcialmente realizados e superem os valores já adimplidos, o(a) CONTRATANTE se responsabiliza pelo pagamento proporcional dos serviços prestados.

**Cláusula 4ª - Reequilíbrio Econômico-Financeiro**

Na hipótese de ocorrência de fatos imprevisíveis que gerem desproporção manifesta entre o valor originalmente contratado e o custo efetivo dos serviços no momento de sua execução, as partes poderão negociar o reequilíbrio econômico-financeiro do contrato, nos termos dos arts. 317, 478 e 479 do Código Civil.

## IV - DEVERES E RESPONSABILIDADES DO(A) PACIENTE

**Cláusula 5ª - Obrigações do(a) Contratante**

Para o bom andamento do tratamento, o(a) CONTRATANTE se compromete a:

- Reconhecer sua condição de corresponsável pelo tratamento, seguindo rigorosamente as orientações pré e pós-procedimentais fornecidas pelo(a) profissional, comunicando qualquer desconforto ou intercorrência imediatamente;
- Manter seus dados cadastrais atualizados junto ao consultório, facilitando a comunicação e o agendamento de consultas;
- Honrar pontualmente os compromissos financeiros assumidos, conforme as condições acordadas;
- Informar ao(à) profissional, no momento da anamnese e sempre que necessário, sobre alergias, sensibilidades a medicamentos ou anestésicos, histórico de sangramento, doenças sistêmicas, tratamentos anteriores e qualquer condição de saúde relevante;
- Comparecer às consultas no horário agendado, comunicando eventual impossibilidade com a maior antecedência possível;
- Realizar os exames diagnósticos solicitados pelo(a) profissional, que se reserva o direito de não executar procedimentos sem os subsídios técnicos necessários por inércia do(a) paciente;
- Seguir todas as prescrições e recomendações do(a) profissional, incluindo uso de medicamentos e cuidados domiciliares;
- Em caso de qualquer sinal de reação adversa, intercorrência ou complicação, entrar em contato diretamente com o(a) CONTRATADO(A), que possui o histórico odontológico completo, antes de buscar atendimento com outro profissional.

*Parágrafo único.* O abandono injustificado do tratamento ou o não comparecimento reiterado às consultas agendadas implica rescisão automática deste contrato, eximindo o(a) CONTRATADO(A) de responsabilidade pelos resultados esperados e ensejando o pagamento integral do valor contratado a título de compensação por perdas e danos.

## V - DEVERES E RESPONSABILIDADES DO(A) PROFISSIONAL

**Cláusula 6ª - Obrigações do(a) Contratado(a)**

O(A) CONTRATADO(A) se compromete a:

- Realizar os procedimentos em ambiente adequado, com rigorosos padrões de higiene, biossegurança e assepsia;
- Aplicar as melhores técnicas disponíveis, pautando-se pelo estado atual da ciência, pela prudência e pela ética profissional;
- Esclarecer previamente o(a) CONTRATANTE sobre cada procedimento, incluindo suas vantagens, riscos, alternativas e valores correspondentes;
- Manter o(a) CONTRATANTE informado(a) sobre a evolução do plano de tratamento a cada etapa realizada;
- Observar integralmente o Código de Ética Odontológica e demais normas regulamentadoras da profissão;
- Garantir a confidencialidade das informações do(a) paciente, resguardando prontuários e dados sensíveis nos termos da LGPD (Lei nº 13.709/2018);
- Acompanhar o(a) CONTRATANTE durante todo o tratamento, prestando assistência no período pós-procedimento até a recuperação adequada;
- Disponibilizar o prontuário odontológico completo ao(à) titular, mediante solicitação e agendamento prévio.

## VI - NATUREZA DA RESPONSABILIDADE PROFISSIONAL

**Cláusula 7ª - Obrigação de Meio**

A responsabilidade do(a) CONTRATADO(A), nos termos deste instrumento, é de meio - isto é, o(a) profissional assume o compromisso de empregar todos os recursos técnicos, científicos e éticos disponíveis para alcançar o melhor resultado possível, sem, contudo, responsabilizar-se pelo resultado final, dado que a prestação de serviços de saúde é naturalmente permeada por variáveis biológicas e individuais imprevisíveis.

§ 1º O(A) CONTRATADO(A) não se responsabiliza por insucesso total ou parcial do tratamento decorrente da não cooperação do(a) paciente, do ocultamento de informações relevantes ou da inobservância das orientações prescritas.

§ 2º Configura não cooperação, entre outros: ausências às consultas, atrasos recorrentes, abandono do tratamento e descumprimento das recomendações pós-procedimentais.

§ 3º Eventuais efeitos imprevisíveis ou de baixíssima previsibilidade, ocorridos mesmo com observância da boa técnica, não geram responsabilidade do(a) profissional, à luz do art. 14, § 1º, do Código de Defesa do Consumidor e dos excludentes do Código de Ética Odontológica.

§ 4º Defeitos originários de materiais, equipamentos ou insumos fornecidos por terceiros são de responsabilidade exclusiva do fabricante ou fornecedor, exceto em casos de uso inadequado pelo(a) profissional.

## VII - PROTEÇÃO DE DADOS PESSOAIS (LGPD)

**Cláusula 8ª - Tratamento de Dados**

Em conformidade com a Lei Geral de Proteção de Dados - LGPD (Lei nº 13.709/2018), o(a) CONTRATADO(A) informa que os dados pessoais coletados neste contrato e durante o tratamento serão utilizados exclusivamente para viabilizar a execução dos serviços contratados, sendo armazenados pelo prazo necessário ao cumprimento das obrigações legais aplicáveis.

*Parágrafo único.* Ambas as partes reconhecem seus direitos e deveres perante a LGPD e se comprometem a adotar as medidas necessárias para garantir a segurança e a confidencialidade dos dados pessoais envolvidos, incluindo colaboradores e prestadores de serviço eventualmente envolvidos no tratamento.

## VIII - DISPOSIÇÕES GERAIS

**Cláusula 9ª - Rescisão**

Este contrato poderá ser rescindido por qualquer das partes em caso de descumprimento de suas cláusulas, ruptura da relação de confiança entre profissional e paciente, ou ocorrência de qualquer das hipóteses legais previstas. A parte responsável pela rescisão responderá pelas perdas e danos comprovadamente causados à parte inocente.

**Cláusula 10ª - Autorização de Uso de Imagem para Fins Científicos**

O(A) CONTRATANTE [AUTORIZA / NÃO AUTORIZA] a utilização dos registros fotográficos e/ou documentais de seu tratamento para fins de estudo, publicação científica ou divulgação educacional, garantida em qualquer hipótese a preservação de sua identidade e dados pessoais, conforme a LGPD.

**Cláusula 11ª - Título Executivo Extrajudicial**

As partes reconhecem o presente instrumento como título executivo extrajudicial, nos termos do art. 784 do Código de Processo Civil.

**Cláusula 12ª - Foro de Eleição**

Para a resolução de quaisquer conflitos decorrentes deste instrumento, as partes elegem o foro da comarca onde está situado o consultório ou clínica, ou o foro mais próximo dentro da mesma circunscrição judiciária, com renúncia expressa a qualquer outro.
`)),
      hasPatientSignature: true,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.CONSENT]: {
      title: 'Termo de Consentimento Livre e Esclarecido',
      defaultPatientName: patient?.full_name || '',
      defaultDocumento: patient?.cpf || '',
      defaultResponsavel: patient?.responsible_name || '',
      defaultNomeDentista: '',
      defaultProcedimento: '',
      defaultRiscos: '',
      defaultAutorizaImagem: null,
      defaultLocal: '',
      defaultData: dayjs(),
      hasPatientSignature: true,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.PRESCRIPTION]: {
      title: 'Receituário',
      defaultPrescriptionText: '',
      defaultShowOrientacoes: false,
      defaultOrientacoesText: '',
      hasPatientSignature: false,
      hasProfessionalSignature: true
    },

    [DOCUMENT_TYPES.CERTIFICATE]: {
      title: 'ATESTADO',
      defaultPatientName: patient?.full_name || '',
      defaultCpf: patient?.cpf || '',
      defaultEndereco: patient?.street
        ? [patient.street, patient.complement, patient.neighborhood, patient.city, patient.state]
            .filter(Boolean)
            .join(', ')
        : '',
      defaultHoraInicio: dayjs().set('hour', 8).set('minute', 0).set('second', 0),
      defaultHoraFim: dayjs().set('hour', 9).set('minute', 0).set('second', 0),
      defaultData: dayjs(),
      defaultDiasRepouso: null,
      defaultLocal: '',
      hasPatientSignature: false,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.CUSTOM]: {
      title: '',
      body: '',
      hasPatientSignature: false,
      hasProfessionalSignature: false
    }
  };
  
  return templates[type] || templates[DOCUMENT_TYPES.CUSTOM];
};
