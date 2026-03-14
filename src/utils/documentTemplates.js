export const DOCUMENT_TYPES = {
  CONTRACT: 'contract',
  CONSENT: 'consent',
  PRESCRIPTION: 'prescription',
  CERTIFICATE: 'certificate',
  CUSTOM: 'custom'
};

export const getDocumentTemplate = (type, patient = null) => {
  const templates = {
    [DOCUMENT_TYPES.CONTRACT]: {
      title: 'Contrato de Prestação de Serviços',
      body: `
        <p><strong>CONTRATO DE PRESTAÇÃO DE SERVIÇOS MÉDICOS</strong></p>
        <p>Pelo presente instrumento particular, de um lado como CONTRATANTE, <strong>${patient?.full_name || '[NOME DO PACIENTE]'}</strong>, 
        ${patient?.cpf ? `CPF ${patient.cpf}` : 'CPF [CPF]'}, e de outro lado como CONTRATADO, 
        a clínica/prestador de serviços médicos, têm entre si justo e acordado o seguinte:</p>
        
        <p><strong>CLÁUSULA 1ª - DO OBJETO</strong></p>
        <p>O presente contrato tem por objeto a prestação de serviços médicos especializados, 
        conforme plano de tratamento a ser estabelecido entre as partes.</p>
        
        <p><strong>CLÁUSULA 2ª - DAS OBRIGAÇÕES DO CONTRATANTE</strong></p>
        <p>O CONTRATANTE se compromete a:</p>
        <ul>
          <li>Comparecer aos atendimentos agendados;</li>
          <li>Informar corretamente seu histórico médico;</li>
          <li>Efetuar o pagamento dos serviços conforme acordado.</li>
        </ul>
        
        <p><strong>CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATADO</strong></p>
        <p>O CONTRATADO se compromete a:</p>
        <ul>
          <li>Prestar serviços médicos com qualidade e ética profissional;</li>
          <li>Manter sigilo sobre informações do paciente;</li>
          <li>Fornecer documentação necessária quando solicitado.</li>
        </ul>
        
        <p><strong>CLÁUSULA 4ª - DO PRAZO</strong></p>
        <p>Este contrato vigorará pelo período necessário à conclusão do tratamento, 
        podendo ser prorrogado mediante acordo entre as partes.</p>
        
        <p>E, por estarem assim justos e contratados, assinam o presente instrumento em duas vias de igual teor.</p>
        
        <p>Local e data: _______________, ____ de _______________ de _______.</p>
      `,
      hasPatientSignature: true,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.CONSENT]: {
      title: 'Termo de Consentimento Informado',
      body: `
        <p><strong>TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO</strong></p>
        <p>Eu, <strong>${patient?.full_name || '[NOME DO PACIENTE]'}</strong>, 
        ${patient?.cpf ? `CPF ${patient.cpf}` : 'CPF [CPF]'}, 
        ${patient?.rg ? `RG ${patient.rg}` : 'RG [RG]'}, 
        declaro que fui devidamente informado(a) sobre:</p>
        
        <p><strong>1. PROCEDIMENTO PROPOSTO</strong></p>
        <p>Fui informado(a) sobre a natureza do procedimento, seus objetivos, 
        riscos, benefícios e alternativas disponíveis.</p>
        
        <p><strong>2. RISCOS E COMPLICAÇÕES</strong></p>
        <p>Compreendi que todo procedimento médico pode apresentar riscos, 
        incluindo, mas não limitado a: reações adversas, complicações, 
        necessidade de procedimentos adicionais, entre outros.</p>
        
        <p><strong>3. BENEFÍCIOS ESPERADOS</strong></p>
        <p>Fui informado(a) sobre os benefícios esperados do procedimento proposto.</p>
        
        <p><strong>4. ALTERNATIVAS</strong></p>
        <p>Fui informado(a) sobre as alternativas disponíveis, incluindo a opção 
        de não realizar o procedimento.</p>
        
        <p><strong>5. DIREITO DE RECUSA</strong></p>
        <p>Compreendi que tenho o direito de recusar o procedimento a qualquer momento, 
        mesmo após ter dado meu consentimento inicial.</p>
        
        <p><strong>6. DÚVIDAS ESCLARECIDAS</strong></p>
        <p>Tive oportunidade de fazer perguntas e todas as minhas dúvidas foram 
        esclarecidas de forma satisfatória.</p>
        
        <p>Diante do exposto, consinto livremente com a realização do procedimento 
        proposto, estando ciente de todos os aspectos mencionados acima.</p>
        
        <p>Local e data: _______________, ____ de _______________ de _______.</p>
      `,
      hasPatientSignature: true,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.PRESCRIPTION]: {
      title: 'Receituário Médico',
      body: `
        <p><strong>RECEITUÁRIO MÉDICO</strong></p>
        <p><strong>Paciente:</strong> ${patient?.full_name || '[NOME DO PACIENTE]'}</p>
        <p><strong>Data:</strong> ____ de _______________ de _______</p>
        <p><strong>Idade:</strong> ${patient?.birth_date ? `[IDADE]` : '[IDADE]'} anos</p>
        
        <p><strong>PRESCRIÇÃO:</strong></p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        
        <p><strong>ORIENTAÇÕES:</strong></p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
      `,
      hasPatientSignature: false,
      hasProfessionalSignature: true
    },
    
    [DOCUMENT_TYPES.CERTIFICATE]: {
      title: 'Atestado Médico',
      body: `
        <p style="text-align: center;"><strong>ATESTADO MÉDICO</strong></p>
        
        <p>Atesto para os devidos fins que o(a) paciente <strong>${patient?.full_name || '[NOME DO PACIENTE]'}</strong>, 
        ${patient?.cpf ? `CPF ${patient.cpf}` : 'CPF [CPF]'}, 
        esteve sob meus cuidados médicos no período de ____ de _______________ de _______ 
        até ____ de _______________ de _______.</p>
        
        <p><strong>DIAGNÓSTICO:</strong></p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        
        <p><strong>RECOMENDAÇÕES:</strong></p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        <p>_________________________________________________________________</p>
        
        <p>Este atestado é válido para os fins a que se destina.</p>
        
        <p>Local e data: _______________, ____ de _______________ de _______.</p>
      `,
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
