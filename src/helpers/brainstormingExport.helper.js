const PdfPrinter = require('pdfmake');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};


function formatChecklistContent(checklist) {
    if (!checklist) return [];
    
    const formattedLines = [];
    
    Object.keys(checklist).forEach(key => {
        const item = checklist[key];
        if (item === true) {
             formattedLines.push({ type: 'MX', text: key });
        } 
        else if (typeof item === 'object') {
             formattedLines.push({ type: 'MX', text: item.name || key });
             if (item.requirements) formattedLines.push({ type: 'RX', text: item.requirements });
             if (item.prototyping) formattedLines.push({ type: 'PX', text: item.prototyping });
        }
    });
    return formattedLines;
}

module.exports = {

  generatePDF(brainstorming, participants, sessionData) {
    return new Promise((resolve, reject) => {
      try {
        const printer = new PdfPrinter(fonts);

        const docDefinition = {
          content: [
            { text: 'Relatório de Brainstorming - USARP', style: 'header' },
            { text: '\n' },
            
            { text: 'Dados da Sessão', style: 'subheader' },
            {
              table: {
                widths: ['*', '*'],
                body: [
                  ['Título:', brainstorming.brainstormingTitle],
                  ['Projeto:', brainstorming.project?.projectName || 'N/A'],
                  ['Data:', brainstorming.brainstormingDate || 'N/A'],
                  ['Horário:', brainstorming.brainstormingTime || 'N/A'],
                ]
              }
            },
            { text: '\n' },

            { text: 'Participantes', style: 'subheader' },
            {
              table: {
                widths: ['*', '*', '*'],
                body: [
                  [{ text: 'Nome', bold: true }, { text: 'Email', bold: true }, { text: 'Cargo/Perfil', bold: true }],
                  ...participants.map(p => {
                    const u = p.User || {};
                    return [
                        u.fullName || 'N/A', 
                        u.email || 'N/A', 
                        u.profile || u.organization || '-'
                    ];
                  })
                ]
              }
            },
            { text: '\n' },

            { text: 'Resultados e Mecanismos (Modelo 3C)', style: 'subheader' },
            ...sessionData.map(item => {
                const us = item.UserStory || {};
                const checks = formatChecklistContent(item.checklist);
                
                return [
                    { text: `US${us.userStorieNumber || '?'} - ${us.userStoriesTitle || 'Sem Título'}`, style: 'storyTitle', margin: [0, 10, 0, 5] },
                    { text: `Cartão: ${us.card || '-'}`, fontSize: 10, italics: true },
                    
                    {
                        ul: checks.length > 0 ? checks.map(c => {
                            let label = '';
                            let color = 'black';
                            if (c.type === 'MX') { label = 'MX - Mecanismo: '; color = '#2c3e50'; }
                            if (c.type === 'RX') { label = 'RX - Requisito: '; color = '#e67e22'; }
                            if (c.type === 'PX') { label = 'PX - Prototipação: '; color = '#27ae60'; }
                            
                            return { text: [{text: label, bold: true, color: color}, c.text] };
                        }) : ['Nenhum mecanismo selecionado.']
                    },
                    { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] }
                ];
            }).flat()
          ],
          styles: {
            header: { fontSize: 18, bold: true, alignment: 'center' },
            subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
            storyTitle: { fontSize: 12, bold: true, background: '#f0f0f0' }
          }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  },

  async generateWord(brainstorming, participants, sessionData) {
    const children = [];

    children.push(new Paragraph({
        text: "Relatório de Brainstorming - USARP",
        heading: "Heading1",
        alignment: "center"
    }));

    children.push(new Paragraph({ text: "Dados da Sessão", heading: "Heading2" }));
    children.push(new Paragraph({ text: `Título: ${brainstorming.brainstormingTitle}` }));
    children.push(new Paragraph({ text: `Projeto: ${brainstorming.project?.projectName || 'N/A'}` }));
    children.push(new Paragraph({ text: `Data: ${brainstorming.brainstormingDate} - Horário: ${brainstorming.brainstormingTime}` }));
    
    children.push(new Paragraph({ text: "Participantes", heading: "Heading2" }));
    
    const participantRows = participants.map(p => {
        const u = p.User || {};
        return new TableRow({
            children: [
                new TableCell({ children: [new Paragraph(u.fullName || 'N/A')] }),
                new TableCell({ children: [new Paragraph(u.email || 'N/A')] }),
                new TableCell({ children: [new Paragraph(u.profile || u.organization || '-')] }),
            ],
        });
    });

    const tableUsers = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "Nome", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Email", bold: true })] }),
                    new TableCell({ children: [new Paragraph({ text: "Cargo", bold: true })] }),
                ],
            }),
            ...participantRows
        ],
    });
    children.push(tableUsers);

    children.push(new Paragraph({ text: "Resultados e Mecanismos (Modelo 3C)", heading: "Heading2" }));

    sessionData.forEach(item => {
        const us = item.UserStory || {};
        const checks = formatChecklistContent(item.checklist);

        children.push(new Paragraph({
            text: `US${us.userStorieNumber || '?'} - ${us.userStoriesTitle || ''}`,
            heading: "Heading3",
            spacing: { before: 200 }
        }));
        
        children.push(new Paragraph({
            text: `Cartão: ${us.card || '-'}`,
            italics: true
        }));

        if (checks.length > 0) {
            checks.forEach(c => {
                let prefix = "";
                if (c.type === 'MX') prefix = "MX - Mecanismo: ";
                if (c.type === 'RX') prefix = "RX - Requisito: ";
                if (c.type === 'PX') prefix = "PX - Prototipação: ";

                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: prefix, bold: true }),
                        new TextRun({ text: c.text })
                    ],
                    bullet: { level: 0 }
                }));
            });
        } else {
            children.push(new Paragraph({ text: "Nenhum mecanismo selecionado.", bullet: { level: 0 } }));
        }
    });

    const doc = new Document({
        sections: [{ properties: {}, children: children }],
    });

    return await Packer.toBuffer(doc);
  }
};