import FileUploader from './FileUploader.js';
import DataDisplay from './DataDisplay.js';
import PdfExporter from './PdfExporter.js';

class App {
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
        this.fileUploader = new FileUploader(this.handleFileUploaded.bind(this));
        this.dataDisplay = new DataDisplay('invoice-data-container');
        this.pdfExporter = new PdfExporter();

        this.invoiceDataContainer = document.getElementById('invoice-data-container');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.errorContainer = document.getElementById('error-container');
        this.errorMessage = document.getElementById('error-message');
        this.exportPdfButton = document.getElementById('export-pdf');

        this.initEventListeners();
    }

initEventListeners() {
    this.exportPdfButton = document.getElementById('export-pdf');

    if (this.exportPdfButton) {
        this.exportPdfButton.addEventListener('click', this.handleExportPdf.bind(this));
    } else {
        console.error('Elemento #export-pdf non trovato.');
    }
}


    handleFileUploaded(file, content) {
        this.updateState({
            fileLoaded: true,
            fileName: file.name,
            fileContent: content,
            isLoading: true,
            error: null
        });

        this.showLoading();

        try {
            const parsedData = this.xmlParser.parseXmlContent(content);
            this.updateState({
                parsedData: parsedData,
                isLoading: false
            });
            this.renderInvoiceData();
        } catch (error) {
            console.error('Errore durante l\'analisi del file XML:', error);
            this.updateState({
                isLoading: false,
                error: `Errore durante l'elaborazione del file: ${error.message || 'Formato non valido'}`
            });
            this.showError();
        }
    }

    handleExportPdf() {
        if (!this.state.parsedData) {
            this.showError('Nessun dato disponibile per l\'esportazione');
            return;
        }

        try {
            this.pdfExporter.exportToPdf(this.state.parsedData, this.state.fileName);
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
        this.dataDisplay.displayInvoiceData(this.state.parsedData);
    }

    showLoading() {
        this.invoiceDataContainer.classList.remove('hidden');
        this.loadingIndicator.classList.remove('hidden');
        this.hideError();
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
    }

    showError(message = null) {
        const errorMsg = message || this.state.error;
        if (!errorMsg) return;
        this.errorMessage.textContent = errorMsg;
        this.errorContainer.classList.remove('hidden');
    }

    hideError() {
        this.errorContainer.classList.add('hidden');
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
        this.invoiceDataContainer.classList.add('hidden');
    }
}

window.App = App;