/**
 * PdfExporter.js - Componente per l'esportazione dei dati della fattura in formato PDF
 * 
 * Questo componente si occupa di:
 * - Convertire i dati della fattura in un documento PDF
 * - Formattare il documento in modo leggibile e professionale
 * - Permettere il download del PDF generato
 */

class PdfExporter {
    constructor() {
        // Verifica che jsPDF sia disponibile - correzione per supportare diverse versioni della libreria
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.error('jsPDF non è disponibile. Assicurati di includerlo prima di utilizzare PdfExporter.');
        }
    }

    /**
     * Genera un documento PDF dalla fattura
     * @param {Object} invoiceData - Dati della fattura
     * @returns {Promise} - Promise che risolve con l'URL del PDF o rigetta con un errore
     */
    generatePdf(invoiceData) {
        return new Promise((resolve, reject) => {
            try {
                if (!invoiceData) {
                    throw new Error('Dati della fattura non validi');
                }

                // Crea un nuovo documento PDF - supporto per diverse versioni di jsPDF
                let doc;
                if (typeof jspdf !== 'undefined' && jspdf.jsPDF) {
                    // Nuova versione come modulo ES
                    const { jsPDF } = jspdf;
                    doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });
                } else if (typeof jsPDF !== 'undefined') {
                    // Versione globale
                    doc = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });
                } else {
                    throw new Error('jsPDF non è disponibile');
                }

                // Impostazioni documento
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 20;
                let yPos = margin;
                const lineHeight = 7;
                const contentWidth = pageWidth - (margin * 2);

                // Funzione per aggiungere una riga di testo
                const addLine = (text, fontSize = 10, isBold = false) => {
                    doc.setFontSize(fontSize);
                    doc.setFont(undefined, isBold ? 'bold' : 'normal');
                    doc.text(text, margin, yPos);
                    yPos += lineHeight;
                };

                // Funzione per aggiungere una coppia chiave-valore
                const addKeyValuePair = (key, value, fontSize = 10) => {
                    doc.setFontSize(fontSize);
                    doc.setFont(undefined, 'bold');
                    doc.text(key, margin, yPos);
                    doc.setFont(undefined, 'normal');
                    const keyWidth = doc.getTextWidth(key);
                    doc.text(value || 'N/A', margin + keyWidth + 5, yPos);
                    yPos += lineHeight;
                };

                // Funzione per aggiungere una sezione
                const addSection = (title) => {
                    yPos += 5;
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    addLine(title, 14, true);
                    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
                    yPos += 3;
                };

                // Intestazione del documento
                doc.setDrawColor(0, 0, 150);
                doc.setFillColor(240, 240, 255);
                doc.rect(margin - 5, yPos - 5, contentWidth + 10, 15, 'F');
                addLine('FATTURA ELETTRONICA', 16, true);
                yPos += 5;

                // Sezione intestazione fattura
                addSection('Dati Generali');
                addKeyValuePair('Numero Fattura:', invoiceData.numero);
                addKeyValuePair('Data:', invoiceData.data);
                addKeyValuePair('Tipo Documento:', invoiceData.tipoDocumento);
                addKeyValuePair('Valuta:', invoiceData.valuta);
                addKeyValuePair('Importo Totale:', invoiceData.importoTotale ? `${invoiceData.importoTotale} ${invoiceData.valuta || '€'}` : 'N/A');

                // Sezione fornitore
                if (invoiceData.fornitore) {
                    addSection('Dati Fornitore');
                    addKeyValuePair('Denominazione:', invoiceData.fornitore.denominazione);
                    addKeyValuePair('Partita IVA:', invoiceData.fornitore.partitaIVA);
                    addKeyValuePair('Codice Fiscale:', invoiceData.fornitore.codiceFiscale);
                    addKeyValuePair('Regime Fiscale:', invoiceData.fornitore.regime);
                }

                // Sezione cliente
                if (invoiceData.cliente) {
                    addSection('Dati Cliente');
                    addKeyValuePair('Denominazione:', invoiceData.cliente.denominazione);
                    addKeyValuePair('Partita IVA:', invoiceData.cliente.partitaIVA);
                    addKeyValuePair('Codice Fiscale:', invoiceData.cliente.codiceFiscale);
                    
                    // Indirizzo completo
                    let indirizzo = '';
                    if (invoiceData.cliente.indirizzo) indirizzo += invoiceData.cliente.indirizzo;
                    if (invoiceData.cliente.cap) indirizzo += ` - ${invoiceData.cliente.cap}`;
                    if (invoiceData.cliente.comune) indirizzo += ` ${invoiceData.cliente.comune}`;
                    if (invoiceData.cliente.provincia) indirizzo += ` (${invoiceData.cliente.provincia})`;
                    
                    addKeyValuePair('Indirizzo:', indirizzo);
                }

                // Sezione pagamento
                if (invoiceData.pagamento) {
                    addSection('Dati Pagamento');
                    addKeyValuePair('Modalità:', invoiceData.pagamento.modalita);
                    addKeyValuePair('Data Scadenza:', invoiceData.pagamento.dataScadenza);
                    addKeyValuePair('Importo:', invoiceData.pagamento.importoPagamento 
                        ? `${invoiceData.pagamento.importoPagamento} ${invoiceData.valuta || '€'}` 
                        : 'N/A');
                    addKeyValuePair('IBAN:', invoiceData.pagamento.IBAN);
                }

                // Sezione dettagli (se presenti)
                if (invoiceData.dettagli && invoiceData.dettagli.length > 0) {
                    addSection('Dettaglio Voci');
                    
                    // Verifica se c'è abbastanza spazio per la tabella, altrimenti nuova pagina
                    if (yPos > 230) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    // Intestazione tabella
                    const colWidths = [60, 20, 20, 20, 20];
                    const startX = margin;
                    
                    doc.setFillColor(240, 240, 240);
                    doc.rect(startX, yPos, contentWidth, lineHeight, 'F');
                    
                    doc.setFont(undefined, 'bold');
                    doc.setFontSize(9);
                    doc.text('Descrizione', startX + 2, yPos + 5);
                    doc.text('Q.tà', startX + colWidths[0] + 5, yPos + 5);
                    doc.text('Prezzo', startX + colWidths[0] + colWidths[1] + 5, yPos + 5);
                    doc.text('IVA %', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPos + 5);
                    doc.text('Totale', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, yPos + 5);
                    
                    yPos += lineHeight;
                    doc.line(startX, yPos, startX + contentWidth, yPos);
                    
                    // Dettagli fattura
                    doc.setFont(undefined, 'normal');
                    invoiceData.dettagli.forEach((item, i) => {
                        // Verifica se c'è abbastanza spazio, altrimenti nuova pagina
                        if (yPos > 270) {
                            doc.addPage();
                            yPos = margin;
                            
                            // Ripeti intestazione tabella sulla nuova pagina
                            doc.setFillColor(240, 240, 240);
                            doc.rect(startX, yPos, contentWidth, lineHeight, 'F');
                            
                            doc.setFont(undefined, 'bold');
                            doc.setFontSize(9);
                            doc.text('Descrizione', startX + 2, yPos + 5);
                            doc.text('Q.tà', startX + colWidths[0] + 5, yPos + 5);
                            doc.text('Prezzo', startX + colWidths[0] + colWidths[1] + 5, yPos + 5);
                            doc.text('IVA %', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPos + 5);
                            doc.text('Totale', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, yPos + 5);
                            
                            yPos += lineHeight;
                            doc.line(startX, yPos, startX + contentWidth, yPos);
                            doc.setFont(undefined, 'normal');
                        }
                        
                        // Riga alternata
                        if (i % 2 === 0) {
                            doc.setFillColor(248, 248, 248);
                            doc.rect(startX, yPos, contentWidth, lineHeight, 'F');
                        }
                        
                        // Scrivi i dati della riga
                        doc.text(item.descrizione || '', startX + 2, yPos + 5);
                        doc.text(item.quantita ? item.quantita.toString() : '', startX + colWidths[0] + 5, yPos + 5);
                        doc.text(item.prezzo ? item.prezzo.toString() : '', startX + colWidths[0] + colWidths[1] + 5, yPos + 5);
                        doc.text(item.aliquotaIVA ? item.aliquotaIVA.toString() : '', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, yPos + 5);
                        doc.text(item.importo ? item.importo.toString() : '', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5, yPos + 5);
                        
                        yPos += lineHeight;
                        doc.line(startX, yPos, startX + contentWidth, yPos);
                    });
                }

                // Piè di pagina
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    
                    // Linea superiore del footer
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.line(margin, doc.internal.pageSize.getHeight() - 20, pageWidth - margin, doc.internal.pageSize.getHeight() - 20);
                    
                    // Testo del footer
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text(
                        `Documento generato automaticamente - Pagina ${i} di ${pageCount}`,
                        pageWidth / 2,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'center' }
                    );
                }

                // Genera il blob del PDF
                const pdfBlob = doc.output('blob');
                
                // Crea URL per il download
                const pdfUrl = URL.createObjectURL(pdfBlob);
                
                resolve(pdfUrl);
            } catch (error) {
                console.error('Errore nella generazione del PDF:', error);
                reject(error);
            }
        });
    }

    /**
     * Esporta i dati della fattura in PDF e avvia il download
     */
    exportToPdf(invoiceData) {
        return this.generatePdf(invoiceData)
            .then(pdfUrl => {
                // Crea un link temporaneo per il download
                const downloadLink = document.createElement('a');
                downloadLink.href = pdfUrl;
                
                // Crea un nome file basato sui dati della fattura
                const fileName = invoiceData.numero 
                    ? `Fattura_${invoiceData.numero.replace(/[\/\\?%*:|"<>]/g, '_')}.pdf`
                    : 'Fattura.pdf';
                
                downloadLink.download = fileName;
                
                // Aggiungi il link al documento, clicca e rimuovilo
                document.body.appendChild(downloadLink);
                downloadLink.click();
                
                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(downloadLink);
                    URL.revokeObjectURL(pdfUrl);
                }, 100);
                
                return { success: true, fileName };
            })
            .catch(error => {
                console.error('Errore nell\'esportazione del PDF:', error);
                alert(`Errore nell'esportazione del PDF: ${error.message}`);
                return { success: false, error: error.message };
            });
    }
}

// Esporta la classe
export default PdfExporter;
