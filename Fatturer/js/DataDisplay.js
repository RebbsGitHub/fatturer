class DataDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);

        // Verifica che l'elemento con l'ID fornito esista
        if (!this.container) {
            console.error(`Elemento con ID ${containerId} non trovato.`);
            return; // Interrompe l'inizializzazione se l'elemento non è trovato
        }

        this.invoiceData = null;
        this.originalData = null;
        this.modifiedFields = new Set();
        this.sections = [
            { 
                id: 'header', 
                title: 'Intestazione Fattura',
                fields: [
                    { key: 'header.number', label: 'Numero Fattura', editable: false },
                    { key: 'header.date', label: 'Data Fattura', editable: false },
                    { key: 'header.version', label: 'Tipo Documento', editable: false },
                    { key: 'valuta', label: 'Valuta', editable: false },
                    { key: 'importoTotale', label: 'Importo Totale', editable: false }
                ]
            },
            { 
                id: 'fornitore', 
                title: 'Dati Fornitore',
                fields: [
                    { key: 'supplier.name', label: 'Denominazione', editable: false },
                    { key: 'supplier.vat', label: 'Partita IVA', editable: false },
                    { key: 'supplier.taxCode', label: 'Codice Fiscale', editable: false },
                    { key: 'fornitore.regime', label: 'Regime Fiscale', editable: false }
                ]
            },
            { 
                id: 'cliente', 
                title: 'Dati Cliente',
                fields: [
                    { key: 'customer.name', label: 'Denominazione', editable: true },
                    { key: 'customer.vat', label: 'Partita IVA', editable: true },
                    { key: 'customer.taxCode', label: 'Codice Fiscale', editable: true },
                    { key: 'customer.address', label: 'Indirizzo', editable: true },
                    { key: 'customer.zip', label: 'CAP', editable: true },
                    { key: 'customer.city', label: 'Comune', editable: true },
                    { key: 'customer.province', label: 'Provincia', editable: true }
                ]
            },
            { 
                id: 'pagamento', 
                title: 'Dati Pagamento',
                fields: [
                    { key: 'pagamento.modalita', label: 'Modalità', editable: true },
                    { key: 'pagamento.dataScadenza', label: 'Data Scadenza', editable: true },
                    { key: 'pagamento.importoPagamento', label: 'Importo', editable: false },
                    { key: 'pagamento.IBAN', label: 'IBAN', editable: true }
                ]
            }
        ];
        
        // Inizializzazione dell'interfaccia vuota
        this.initUI();
    }

    /**
     * Inizializza l'interfaccia utente
     */
    initUI() {
        if (!this.container) return; // Se container è null, non eseguire l'operazione
        this.container.innerHTML = ` 
            <div class="data-display-container">
                <div class="data-display-header">
                    <h2>Visualizzazione Fattura</h2>
                    <div id="statusIndicator" class="status-indicator">
                        <span class="status-text">Nessun file caricato</span>
                    </div>
                </div>
                <div id="dataContent" class="data-content">
                    <div class="no-data-message">
                        Carica un file XML di Fattura Elettronica per visualizzare i dati
                    </div>
                </div>
                <div class="action-buttons">
                    <button id="resetChangesBtn" class="button secondary" disabled>Annulla Modifiche</button>
                    <button id="exportToPdfBtn" class="button primary" disabled>Esporta PDF</button>
                </div>
            </div>
        `;

        // Aggiungi event listeners
        document.getElementById('resetChangesBtn').addEventListener('click', () => this.resetChanges());
        document.getElementById('exportToPdfBtn').addEventListener('click', () => this.requestPdfExport());
    }

    /**
     * Ottiene il valore da un oggetto utilizzando un percorso di chiavi
     * es. "cliente.indirizzo" => invoiceData.cliente.indirizzo
     */
    getNestedValue(obj, path) {
        if (!obj) return '';
        const keys = path.split('.');
        try {
            return keys.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : '', obj);
        } catch (e) {
            console.error(`Errore nell'accesso al percorso ${path}:`, e);
            return '';
        }
    }

    /**
     * Imposta un valore all'interno di un oggetto seguendo un percorso di chiavi
     */
    setNestedValue(obj, path, value) {
        if (!obj) return;
        const keys = path.split('.');
        const lastKey = keys.pop();
        const lastObj = keys.reduce((o, key) => {
            if (o[key] === undefined) o[key] = {};
            return o[key];
        }, obj);
        lastObj[lastKey] = value;
    }

    /**
     * Aggiorna la visualizzazione con i dati della fattura
     */
    displayInvoiceData(data) {
        console.log('displayInvoiceData chiamato con:', data);
        
        if (!data) {
            console.error('Nessun dato da visualizzare');
            return;
        }

        // Salva i dati originali per eventuali reset
        this.invoiceData = JSON.parse(JSON.stringify(data)); // Deep copy
        this.originalData = JSON.parse(JSON.stringify(data)); // Deep copy
        this.modifiedFields.clear();

        // Aggiorna l'indicatore di stato
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            const invoiceNumber = this.getNestedValue(data, 'header.number') || 'N/A';
            const invoiceDate = this.getNestedValue(data, 'header.date') || 'N/A';
            statusIndicator.innerHTML = `
                <span class="status-text">Fattura caricata</span>
                <span class="status-detail">Numero: ${invoiceNumber} - Data: ${invoiceDate}</span>
            `;
        }

        // Genera la visualizzazione dei dati
        const dataContent = document.getElementById('dataContent');
        if (!dataContent) {
            console.error('Elemento dataContent non trovato');
            return;
        }
        
        dataContent.innerHTML = '';

        // Crea le sezioni
        this.sections.forEach(section => {
            const sectionElement = document.createElement('div');
            sectionElement.className = 'data-section';
            sectionElement.innerHTML = `
                <div class="section-header">
                    <h3>${section.title}</h3>
                </div>
                <div class="section-content" id="section-${section.id}"></div>
            `;
            
            dataContent.appendChild(sectionElement);
            
            const sectionContent = document.getElementById(`section-${section.id}`);
            if (!sectionContent) {
                console.error(`Elemento section-${section.id} non trovato`);
                return;
            }
            
            // Crea la tabella per i campi
            const table = document.createElement('table');
            table.className = 'data-table';
            
            // Aggiungi i campi
            section.fields.forEach(field => {
                const value = this.getNestedValue(this.invoiceData, field.key);
                console.log(`Campo ${field.key} => valore: "${value}"`);
                
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td class="field-label">${field.label}</td>
                    <td class="field-value">
                        ${field.editable 
                            ? `<input type="text" class="editable-field" data-field="${field.key}" value="${value || ''}">`
                            : `<span>${value || 'N/A'}</span>`
                        }
                    </td>
                `;
                
                table.appendChild(tr);
            });
            
            sectionContent.appendChild(table);
        });

        // Aggiungi event listeners per i campi modificabili
        document.querySelectorAll('.editable-field').forEach(input => {
            input.addEventListener('change', (e) => {
                const fieldKey = e.target.dataset.field;
                const newValue = e.target.value;
                
                // Aggiorna i dati
                this.setNestedValue(this.invoiceData, fieldKey, newValue);
                
                // Traccia la modifica
                this.modifiedFields.add(fieldKey);
                
                // Abilita il pulsante per resettare le modifiche
                const resetBtn = document.getElementById('resetChangesBtn');
                if (resetBtn) resetBtn.disabled = false;
                
                // Notifica il cambiamento
                this.notifyDataChanged();
            });
        });

        // Abilita il pulsante di esportazione
        const exportBtn = document.getElementById('exportToPdfBtn');
        if (exportBtn) exportBtn.disabled = false;
    }

    /**
     * Resetta le modifiche ai valori originali
     */
    resetChanges() {
        if (!this.originalData) return;
        
        // Ripristina i dati originali
        this.invoiceData = JSON.parse(JSON.stringify(this.originalData));
        
        // Aggiorna i campi modificati nell'interfaccia
        this.modifiedFields.forEach(fieldKey => {
            const input = document.querySelector(`.editable-field[data-field="${fieldKey}"]`);
            if (input) {
                input.value = this.getNestedValue(this.invoiceData, fieldKey) || '';
            }
        });
        
        // Resetta il set delle modifiche
        this.modifiedFields.clear();
        
        // Disabilita il pulsante di reset
        const resetBtn = document.getElementById('resetChangesBtn');
        if (resetBtn) resetBtn.disabled = true;
        
        // Notifica il cambiamento
        this.notifyDataChanged();
    }

    /**
     * Notifica che i dati sono cambiati
     */
    notifyDataChanged() {
        // Crea un evento personalizzato
        const event = new CustomEvent('invoiceDataChanged', {
            detail: {
                invoiceData: this.invoiceData,
                modifiedFields: Array.from(this.modifiedFields)
            }
        });
        
        // Dispara l'evento sul documento
        document.dispatchEvent(event);
    }

    /**
     * Richiede l'esportazione PDF
     */
    requestPdfExport() {
        if (!this.invoiceData) return;
        
        // Crea un evento personalizzato
        const event = new CustomEvent('exportInvoiceToPdf', {
            detail: {
                invoiceData: this.invoiceData
            }
        });
        
        // Dispara l'evento sul documento
        document.dispatchEvent(event);
    }

    /**
     * Mostra un messaggio di errore
     */
    showError(message) {
        const dataContent = document.getElementById('dataContent');
        if (!dataContent) return;
        
        dataContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        `;
        
        // Aggiorna l'indicatore di stato
        const statusIndicator = document.getElementById('statusIndicator');
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <span class="status-text error">Errore</span>
            `;
        }
        
        // Disabilita i pulsanti
        const resetBtn = document.getElementById('resetChangesBtn');
        if (resetBtn) resetBtn.disabled = true;
        
        const exportBtn = document.getElementById('exportToPdfBtn');
        if (exportBtn) exportBtn.disabled = true;
    }

    /**
     * Resetta la visualizzazione
     */
    reset() {
        this.invoiceData = null;
        this.originalData = null;
        this.modifiedFields.clear();
        
        // Ripristina l'interfaccia iniziale
        this.initUI();
    }

    /**
     * Ottiene i dati attuali della fattura
     */
    getCurrentInvoiceData() {
        return this.invoiceData;
    }
}

// Esporta la classe
export default DataDisplay;
