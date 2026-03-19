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

export const getDocumentTemplate = (type, patient = null) => {
  const templates = {
    [DOCUMENT_TYPES.CONTRACT]: {
      title: 'Termo de Prestação de Serviços Odontológicos',
      body: mdToHtml(`
## I - IDENTIFICAÇÃO DAS PARTES

**PACIENTE (CONTRATANTE):**

**${patient?.full_name || '[NOME DO PACIENTE]'}**  
CPF: ${patient?.cpf || '[CPF]'}  
Data de Nascimento: ${patient?.birth_date || '[DATA DE NASCIMENTO]'}  
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
[LISTA DE PROCEDIMENTOS]

§ 1º Os atendimentos serão realizados conforme agenda previamente acordada entre as partes, respeitando os horários estabelecidos no momento do agendamento.

§ 2º Caso se identifique, durante a execução do tratamento, a necessidade de procedimentos complementares não previstos inicialmente, estes somente serão realizados com a concordância expressa do(a) paciente, após devida comunicação e esclarecimento.

§ 3º O(A) CONTRATANTE declara estar ciente das características dos materiais e produtos a serem utilizados, bem como de que a durabilidade dos resultados pode variar de acordo com fatores individuais, incluindo hábitos, saúde geral e colaboração com as orientações fornecidas.

**Cláusula 2ª - Consentimento Informado**

O(A) CONTRATANTE declara, de forma livre e esclarecida, que o(a) profissional apresentou de maneira clara e acessível todas as informações relevantes sobre os procedimentos a serem realizados, incluindo: finalidade, técnicas empregadas, possíveis desconfortos, riscos conhecidos, alternativas de tratamento e expectativas de resultado, considerando as condições clínicas individuais do(a) paciente.

*Parágrafo único.* O(A) CONTRATANTE compreende que os resultados estão condicionados às características fisiológicas, anatômicas e biológicas de cada indivíduo, e que não há garantia de satisfação subjetiva, mas sim o compromisso do profissional de empregar a melhor técnica disponível e agir com zelo e diligência.

## III - HONORÁRIOS E CONDIÇÕES DE PAGAMENTO

**Cláusula 3ª - Valor dos Serviços**

O valor total acordado para a realização dos procedimentos contratados é de [VALOR TOTAL], correspondente aos custos de materiais, insumos descartáveis e honorários profissionais.

§ 1º As condições de pagamento são as seguintes: [CONDIÇÕES DE PAGAMENTO].

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

**Cláusula 11ª - Validade da Assinatura Eletrônica**

As partes reconhecem como legítima e juridicamente válida a assinatura digital ou eletrônica do presente instrumento, dispensada a assinatura física, nos termos da legislação vigente aplicável aos documentos eletrônicos.

**Cláusula 12ª - Título Executivo Extrajudicial**

As partes reconhecem o presente instrumento como título executivo extrajudicial, nos termos do art. 784 do Código de Processo Civil.

**Cláusula 13ª - Foro de Eleição**

Para a resolução de quaisquer conflitos decorrentes deste instrumento, as partes elegem o foro da comarca onde está situado o consultório ou clínica, ou o foro mais próximo dentro da mesma circunscrição judiciária, com renúncia expressa a qualquer outro.

## IX - ASSINATURAS

Cidade: [CIDADE], data: [DATA] (____/____/______).

_____________________________________________  
**${patient?.full_name || '[NOME DO PACIENTE]'}** - CPF: ${patient?.cpf || '[CPF]'}  
CONTRATANTE

_____________________________________________  
[NOME DO PROFISSIONAL OU CLÍNICA] - CRO: [CRO]  
CONTRATADO(A)
      `),
      hasPatientSignature: true,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.CONSENT]: {
      title: 'Termo de Consentimento Livre e Esclarecido — Procedimentos Odontológicos',
      body: mdToHtml(`
## TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
### TCLE — PROCEDIMENTOS ODONTOLÓGICOS
*Conforme Código de Ética Odontológica (CFO) e legislação vigente*

## 1. IDENTIFICAÇÃO DAS PARTES

**Paciente:**

**${patient?.full_name || '[NOME DO PACIENTE]'}**  
Data de Nascimento: ${patient?.birth_date || '[DATA DE NASCIMENTO]'}  
CPF: ${patient?.cpf || '[CPF]'}  
RG: ${patient?.rg || '[RG]'}  
Telefone: ${patient?.phone || '[TELEFONE]'}  
E-mail: ${patient?.email || '[E-MAIL]'}

**Responsável legal (quando aplicável):**  
${patient?.responsible_name || '[NOME DO RESPONSÁVEL]'} – CPF: ${patient?.responsible_cpf || '[CPF]'}  
Grau de parentesco ou vínculo: ${patient?.responsible_relationship || '[VÍNCULO]'}

## 2. PROFISSIONAL RESPONSÁVEL

**Cirurgião(ã)-Dentista:** [NOME DO DENTISTA]  
**CRO:** [CRO]  
**Especialidade (se aplicável):** [ESPECIALIDADE]  
**Nome da Clínica / Consultório:** [NOME DA CLÍNICA]  
**Endereço:** [ENDEREÇO DA CLÍNICA]

## 3. PROCEDIMENTO(S) PROPOSTO(S)

O(A) paciente declara ter sido informado(a) pelo(a) Cirurgião(ã)-Dentista [NOME DO DENTISTA], CRO [CRO], sobre o(s) seguinte(s) procedimento(s) a ser(em) realizado(s):

**Denominação do procedimento:** [NOME DO PROCEDIMENTO]  
**Dente(s) / Região(ões) envolvida(s):** [DENTES/REGIÕES]  
**Número estimado de sessões:** [NÚM. SESSÕES]  
**Data prevista de início:** [DATA DE INÍCIO]

**Descrição do procedimento:**  
[DESCRIÇÃO DO PROCEDIMENTO]

*(Espaço para o profissional descrever, de forma clara e acessível ao paciente, em que consiste o procedimento, como será realizado, quais instrumentos e materiais serão utilizados e o tempo estimado.)*

## 4. DIAGNÓSTICO E JUSTIFICATIVA DO TRATAMENTO

Declaro ter sido informado(a) sobre o diagnóstico que justifica a realização do(s) procedimento(s) acima descrito(s):

[DIAGNÓSTICO E JUSTIFICATIVA]

*(Descrever o quadro clínico identificado, por exemplo: cárie, infecção, inflamação, fratura, necessidade estética etc.)*

## 5. BENEFÍCIOS ESPERADOS

Fui esclarecido(a) sobre os benefícios que se espera obter com o tratamento proposto:

[BENEFÍCIOS ESPERADOS]

## 6. RISCOS, INTERCORRÊNCIAS E POSSÍVEIS COMPLICAÇÕES

Fui devidamente informado(a) de que todo procedimento odontológico está sujeito a riscos e possíveis intercorrências, independente da habilidade do profissional. Os riscos específicos deste tratamento incluem:

[RISCOS ESPECÍFICOS]

Adicionalmente, fui orientado(a) sobre riscos gerais que podem ocorrer em qualquer atendimento odontológico, incluindo, mas não se limitando a:

- [ ] Reação alérgica ou hipersensibilidade a anestésicos, materiais ou medicamentos  
- [ ] Sangramento durante ou após o procedimento  
- [ ] Edema (inchaço), equimose (hematoma) ou desconforto na região tratada  
- [ ] Infecção pós-operatória, mesmo com todas as medidas de controle adotadas  
- [ ] Dor ou sensibilidade temporária após o procedimento  
- [ ] Necessidade de procedimento complementar não previsto inicialmente  
- [ ] Variação nos resultados em razão de fatores biológicos individuais  
- [ ] Limitações anatômicas que possam interferir no resultado  
- [ ] Outros: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

Estou ciente de que a Odontologia não é uma ciência exata e que os resultados podem variar em razão da resposta biológica do meu organismo, de minha colaboração com o tratamento e das limitações inerentes à ciência, conforme previsto pelo Conselho Federal de Odontologia (CFO).

## 7. ALTERNATIVAS DE TRATAMENTO

Fui informado(a) sobre as alternativas disponíveis para o meu caso, com as respectivas vantagens e desvantagens:

[ALTERNATIVAS DE TRATAMENTO]

Após ser esclarecido(a) sobre as opções disponíveis, optei pelo tratamento descrito na Seção 3, de forma livre e voluntária.

## 8. ORIENTAÇÕES PRÉ E PÓS-OPERATÓRIAS

**Cuidados antes do procedimento:**  
[ORIENTAÇÕES PRÉ-OPERATÓRIAS]

**Cuidados após o procedimento:**  
[ORIENTAÇÕES PÓS-OPERATÓRIAS]

Declaro ter recebido as orientações acima de forma clara e compreensível, comprometendo-me a segui-las rigorosamente. Estou ciente de que o não cumprimento das orientações pode comprometer o resultado do tratamento e que, neste caso, o(a) profissional não poderá ser responsabilizado(a) pelo insucesso decorrente.

## 9. DECLARAÇÃO SOBRE HISTÓRICO DE SAÚDE

Declaro que a ficha de anamnese foi preenchida com informações verdadeiras e completas, especialmente no que diz respeito a:

- [ ] Doenças sistêmicas conhecidas (diabetes, hipertensão, cardiopatias, coagulopatias, etc.)  
- [ ] Uso atual de medicamentos, incluindo anticoagulantes, bifosfonatos, imunossupressores e outros  
- [ ] Alergias a medicamentos, anestésicos, látex ou materiais odontológicos  
- [ ] Histórico de reações adversas a tratamentos odontológicos anteriores  
- [ ] Gravidez ou suspeita de gravidez  
- [ ] Histórico de tabagismo, etilismo ou uso de outras substâncias  
- [ ] Tratamentos oncológicos em curso ou recentes  

Compreendo que a omissão de informações relevantes sobre minha saúde pode interferir negativamente no planejamento do tratamento, na resposta biológica ao procedimento e na escolha de medicamentos e anestésicos, podendo ocasionar danos à minha saúde geral e bucal.

## 10. RESPONSABILIDADE DO PROFISSIONAL

Tenho ciência de que o(a) Cirurgião(ã)-Dentista assume responsabilidade de meio, comprometendo-se a empregar as melhores técnicas e materiais disponíveis, pautar-se pelo estado atual da ciência e zelar pela minha segurança e bem-estar durante todo o tratamento. Não se trata, portanto, de uma obrigação de resultado garantido.

O(A) profissional responderá por insucessos decorrentes de comprovada falha técnica na execução dos serviços, nos termos do Código de Ética Odontológica e do Código de Defesa do Consumidor (Lei nº 8.078/1990).

## 11. PROTEÇÃO DE DADOS PESSOAIS — LGPD

Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), declaro estar ciente de que meus dados pessoais e de saúde coletados neste documento serão utilizados exclusivamente para fins de execução do tratamento odontológico, sendo armazenados com segurança pelo período legalmente exigido, com total resguardo de minha privacidade e sigilo profissional.

## 12. AUTORIZAÇÃO DE USO DE IMAGENS PARA FINS CIENTÍFICOS E EDUCACIONAIS
*(Marque apenas uma opção)*

- [ ] **AUTORIZO** o(a) profissional [NOME DO DENTISTA], CRO [CRO], a utilizar registros fotográficos, radiográficos, tomográficos, em vídeo ou qualquer outra documentação do meu tratamento odontológico para fins de: documentação clínica, publicações em periódicos científicos, congressos, cursos, aulas, livros, plataformas digitais e redes sociais de cunho profissional, sendo garantida a preservação de minha identidade em qualquer divulgação pública, em conformidade com a LGPD e as normas do CFO.

- [ ] **NÃO AUTORIZO** a utilização das imagens e documentação do meu tratamento para finalidades além do prontuário clínico.

## 13. DECLARAÇÃO FINAL DE CONSENTIMENTO

Eu, **${patient?.full_name || '[NOME DO PACIENTE]'}**, declaro, de forma livre, voluntária e esclarecida, que:

- [ ] Li (ou me foi lido) este Termo na íntegra e tive oportunidade de esclarecer todas as minhas dúvidas com o(a) profissional antes de assiná-lo;  
- [ ] Compreendi em linguagem acessível as informações sobre o procedimento, seus benefícios, riscos, alternativas e cuidados necessários;  
- [ ] Tive liberdade para fazer perguntas e recebi respostas satisfatórias;  
- [ ] Sei que posso revogar este consentimento a qualquer momento, antes do início do procedimento, sem nenhum prejuízo ao meu atendimento;  
- [ ] Concordo com a realização do(s) procedimento(s) descrito(s) neste Termo e autorizo o(a) profissional a executá-lo(s);  
- [ ] Reconheço este documento como parte integrante do meu prontuário odontológico.

**Local:** [CIDADE] / **Data:** [DATA]

_____________________________________________  
**${patient?.full_name || '[NOME DO PACIENTE]'}**  
Assinatura do(a) Paciente

_____________________________________________  
[NOME DO DENTISTA] — CRO [CRO]  
Assinatura do(a) Cirurgião(ã)-Dentista

_____________________________________________  
${patient?.responsible_name || '[NOME DO RESPONSÁVEL]'} — CPF: ${patient?.responsible_cpf || '[CPF]'} — Grau de parentesco: ${patient?.responsible_relationship || '[VÍNCULO]'}  
Assinatura do(a) Responsável Legal (quando aplicável)
      `),
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
      title: 'Atestado Médico',
      defaultPatientName: patient?.full_name || '',
      defaultCpf: patient?.cpf || '',
      defaultPeriodoAte: dayjs(),
      defaultDiagnosticos: '',
      defaultRecomendacoes: '',
      defaultLocal: '',
      defaultData: dayjs(),
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
