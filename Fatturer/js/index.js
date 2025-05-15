/**
 * index.js - Punto di ingresso dell'applicazione
 * Inizializza l'applicazione e gestisce gli eventi a livello globale
 */

// Attendi il caricamento completo del DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza l'applicazione
    const app = new App();
    
    // Registra l'app nella finestra per l'accesso globale (utile per debug)
    try {
        // Verifichiamo se window.app esiste
        if (!window.app) {
            // Se non esiste già, creiamo un'istanza di App
            window.app = new App();
        }
        
        console.log('Applicazione inizializzata correttamente');
    } catch (error) {
        console.error('Errore durante l\'inizializzazione dell\'app:', error);
    }
    
    // Gestisci la comunicazione tra i componenti
    setupInterComponentCommunication();
    
    // Aggiungi funzionalità di gestione errori globale
    setupGlobalErrorHandling();
});

/**
 * Configura la comunicazione tra i componenti dell'applicazione
 */
function setupInterComponentCommunication() {
    // Gestisce l'evento di rimozione del file
    const removeFileButton = document.getElementById('remove-file');
    if (removeFileButton) {
        removeFileButton.addEventListener('click', () => {
            console.log('Rimozione del file richiesta');
            // Resetta il file uploader
            if (window.appInstance.fileUploader) {
                window.appInstance.fileUploader.reset();
            }
            
            // Resetta lo stato dell'applicazione
            if (window.appInstance) {
                window.appInstance.resetState();
            }
        });
    }
    
    // Altri eventi di comunicazione tra componenti possono essere aggiunti qui
}

/**
 * Configura la gestione degli errori a livello globale
 */
function setupGlobalErrorHandling() {
    // Gestione degli errori non catturati
    window.addEventListener('error', (event) => {
        console.error('Errore globale rilevato:', event.error);
        
        // Mostra un messaggio di errore appropriato nell'interfaccia
        if (window.appInstance) {
            window.appInstance.showError('Si è verificato un errore imprevisto. Ricarica la pagina e riprova.');
        }
        
        // Impedisce la visualizzazione dell'errore nella console del browser
        event.preventDefault();
    });
}

/**
 * Funzione di utilità per formattare i valori monetari
 * @param {number} value - Il valore da formattare
 * @returns {string} Il valore formattato come valuta
 */
window.formatCurrency = (value) => {
    if (value === undefined || value === null) return '0,00 €';
    
    // Converti il valore in numero
    const numValue = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    
    // Formatta il valore come valuta
    return numValue.toLocaleString('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
    });
};

/**
 * Funzione di utilità per formattare le date
 * @param {string} dateString - La data in formato ISO o simile
 * @returns {string} La data formattata in formato italiano (dd/mm/yyyy)
 */
window.formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT');
    } catch (error) {
        console.error('Errore durante la formattazione della data:', error);
        return dateString; // Restituisce la stringa originale se c'è un errore
    }
};

/**
 * Funzione di utilità per sanitizzare il testo per l'output HTML
 * @param {string} text - Il testo da sanitizzare
 * @returns {string} Il testo sanitizzato
 */
window.sanitizeHtml = (text) => {
    if (!text) return '';
    
    const element = document.createElement('div');
    element.textContent = text;
    return element.innerHTML;
};
