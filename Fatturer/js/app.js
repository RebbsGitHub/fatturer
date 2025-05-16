
import FileUploader from './FileUploader.js';
import DataDisplay from './DataDisplay.js';
import PdfExporter from './PdfExporter.js';
import { XmlParser } from './xmlParser.js';

export class App {
    constructor() {
        this.state = {
            fileLoaded: false,
            fileName: '',
            fileContent: null,
            parsedData: null,
            isLoading: false,
            error: null
        };

        this.xmlParser = new XmlParser();
        this.fileUploader = new FileUploader({
            containerId: 'file-upload-container',
            onFileLoaded: this.handleFileLoaded.bind(this),
            onError: this.handleFileError.bind(this)
        });
        this.dataDisplay = new DataDisplay('invoice-data-container');
        this.pdfExporter = new PdfExporter();
        this.errorMessage = document.getElementById('error-message');
        this.invoiceDataContainer = document.getElementById('invoice-data-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorContainer = document.getElementById('error-container');
        
        // Inizializza subito il pulsante di export se disponibile
        this.exportPdfButton = document.getElementById('export-pdf');
        if (this.exportPdfButton) {
            this.exportPdfButton.addEventListener('click', this.handleExportPdf.bind(this));
            console.log('Export PDF button inizializzato');
        } else {
            console.warn('Elemento #export-pdf non trovato nel DOM al caricamento. Verrà cercato dopo il caricamento completo.');
        }
        
        this.initEventListeners();
        console.log('App inizializzata');
    }

    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Se il pulsante non è stato trovato nel costruttore, riprova qui
            if (!this.exportPdfButton) {
                this.exportPdfButton = document.getElementById('export-pdf');
                if (this.exportPdfButton) {
                    this.exportPdfButton.addEventListener('click', this.handleExportPdf.bind(this));
                    console.log('Export PDF button inizializzato dopo DOMContentLoaded');
                } else {
                    console.error('Elemento #export-pdf non trovato anche dopo DOMContentLoaded.');
                }
            }
            console.log('Event listeners inizializzati');
        });
    }

    handleFileLoaded(fileData) {
        console.log('File caricato:', fileData);
        
        this.updateState({
            fileLoaded: true,
            fileName: fileData.file.name,
            fileContent: fileData.content,
            isLoading: true,
            error: null
        });

        this.showLoading();

        try {
            if (fileData.fileType === 'xml') {
                const parsedData = this.xmlParser.parseXmlContent(fileData.content);
                console.log('Dati parsati:', parsedData);
                this.updateState({
                    parsedData: parsedData,
                    isLoading: false
                });
                this.renderInvoiceData();
                
                // Abilita il pulsante di export dopo il caricamento dei dati
                if (this.exportPdfButton) {
                    this.exportPdfButton.disabled = false;
                    console.log('Export PDF button abilitato');
                }
            } else {
                throw new Error('Formato file non supportato. Carica un file XML.');
            }
        } catch (error) {
            console.error('Errore durante l\'analisi del file:', error);
            this.updateState({
                isLoading: false,
                error: `Errore durante l'elaborazione del file: ${error.message || 'Formato non valido'}`
            });
            this.showError();
        }
    }

    handleFileError(error) {
        console.error('Errore di caricamento file:', error);
        this.updateState({
            isLoading: false,
            error: `Errore di caricamento: ${error.message || 'Errore sconosciuto'}`
        });
        this.showError();
    }

    handleFileUploaded(file, content) {
        console.log('Metodo deprecato handleFileUploaded chiamato');
        this.handleFileLoaded({
            file: file,
            fileType: file.name.toLowerCase().endsWith('.xml') ? 'xml' : 'unknown',
            content: content
        });
    }

    handleExportPdf() {
        console.log('handleExportPdf chiamato', this.state.parsedData);
        
        if (!this.state.parsedData) {
            this.showError('Nessun dato disponibile per l\'esportazione');
            return;
        }

        try {
            this.pdfExporter.exportToPdf(this.state.parsedData)
                .then(result => {
                    if (result.success) {
                        console.log(`PDF esportato con successo: ${result.fileName}`);
                    } else {
                        this.showError(`Errore durante l'esportazione: ${result.error}`);
                    }
                })
                .catch(error => {
                    console.error('Errore durante l\'esportazione in PDF:', error);
                    this.showError(`Errore durante l'esportazione in PDF: ${error.message || 'Errore sconosciuto'}`);
                });
        } catch (error) {
            console.error('Errore durante l\'esportazione in PDF:', error);
            this.showError(`Errore durante l'esportazione in PDF: ${error.message || 'Errore sconosciuto'}`);
        }
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        console.log('Stato applicazione aggiornato:', this.state);
    }

    renderInvoiceData() {
        if (!this.state.parsedData) return;
        this.hideLoading();
        this.invoiceDataContainer.classList.remove('hidden');
        console.log('Visualizzazione dati fattura:', this.state.parsedData);
        this.dataDisplay.displayInvoiceData(this.state.parsedData);
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.remove('hidden');
        }
        if (this.invoiceDataContainer) {
            this.invoiceDataContainer.classList.add('hidden');
        }
        this.hideError();
        console.log('Visualizzazione caricamento');
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.classList.add('hidden');
        }
        console.log('Nascosto caricamento');
    }

    showError(message = null) {
        const errorMsg = message || this.state.error;
        if (!errorMsg) return;
        if (this.errorMessage) {
            this.errorMessage.textContent = errorMsg;
        }
        if (this.errorContainer) {
            this.errorContainer.classList.remove('hidden');
        }
        console.error('Errore visualizzato:', errorMsg);
    }

    hideError() {
        if (this.errorContainer) {
            this.errorContainer.classList.add('hidden');
        }
    }

    resetState() {
        this.updateState({
            fileLoaded: false,
            fileName: '',
            fileContent: null,
            parsedData: null,
            isLoading: false,
            error: null
        });
        if (this.invoiceDataContainer) {
            this.invoiceDataContainer.classList.add('hidden');
        }
    }
}

// Assicurati che l'App venga inizializzata dopo il caricamento del DOM
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM caricato, inizializzazione App');
    window.app = new App();
});
