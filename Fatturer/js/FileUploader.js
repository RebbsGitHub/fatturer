class FileUploader {

  // Inizializza il componente di upload
  // @param {Object} options - Opzioni di configurazione
  // @param {string} options.containerId - ID del container HTML
  // @param {Function} options.onFileLoaded - Callback chiamata quando un file è caricato
  // @param {Function} options.onError - Callback chiamata in caso di errore
  constructor(options = {}) {
    this.containerId = options.containerId || 'file-upload-container';
    this.onFileLoaded = options.onFileLoaded || function () {};
    this.onError = options.onError || function (error) { console.error(error); };

    this.supportedFormats = {
      'xml': 'text/xml,application/xml',
      'pdf': 'application/pdf'
    };

    this.currentFileType = null;
    this.currentFile = null;

    this.init();
  }

  // Inizializza l'interfaccia di upload
  init() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container con ID ${this.containerId} non trovato`);
      return;
    }

    // Pulisci il container
    container.innerHTML = '';

    // Crea l'interfaccia di upload
    const uploadArea = document.createElement('div');
    uploadArea.className = 'upload-area';

    // Titolo
    const title = document.createElement('h3');
    title.textContent = 'Carica un file';
    uploadArea.appendChild(title);

    // Area di drop
    const dropZone = document.createElement('div');
    dropZone.className = 'drop-zone';
    dropZone.innerHTML = `
      <p>Trascina qui il tuo file</p>
      <div class="button-group">
        <button id="upload-xml-btn" class="btn btn-primary">Carica XML</button>
        <button id="upload-pdf-btn" class="btn">Carica PDF</button>
      </div>
      <p class="file-info">Nessun file selezionato</p>
    `;
    uploadArea.appendChild(dropZone);

    // Input file nascosti
    const xmlInput = document.createElement('input');
    xmlInput.type = 'file';
    xmlInput.id = 'xml-file-input';
    xmlInput.accept = this.supportedFormats.xml;
    xmlInput.style.display = 'none';

    const pdfInput = document.createElement('input');
    pdfInput.type = 'file';
    pdfInput.id = 'pdf-file-input';
    pdfInput.accept = this.supportedFormats.pdf;
    pdfInput.style.display = 'none';

    uploadArea.appendChild(xmlInput);
    uploadArea.appendChild(pdfInput);

    container.appendChild(uploadArea);

    // Aggiungi gli event listener
    this._setupEventListeners();
  }

  // Configura tutti gli event listener
  _setupEventListeners() {
    const dropZone = document.querySelector('.drop-zone');
    const xmlBtn = document.getElementById('upload-xml-btn');
    const pdfBtn = document.getElementById('upload-pdf-btn');
    const xmlInput = document.getElementById('xml-file-input');
    const pdfInput = document.getElementById('pdf-file-input');

    // Drag and drop
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });

      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
      });

      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file) {
          this._handleFile(file);
        }
      });
    }

    // Button clicks
    if (xmlBtn) {
      xmlBtn.addEventListener('click', () => {
        this.currentFileType = 'xml';
        xmlInput.click();
      });
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        this.currentFileType = 'pdf';
        pdfInput.click();
      });
    }

    // File input changes
    if (xmlInput) {
      xmlInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this._handleFile(file, 'xml');
        }
      });
    }

    if (pdfInput) {
      pdfInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this._handleFile(file, 'pdf');
        }
      });
    }
  }

  // Gestisce un file caricato
  // @param {File} file - File caricato
  // @param {string} [forceType] - Forza un tipo specifico di file
  _handleFile(file, forceType = null) {
    // Determina il tipo di file
    const fileType = forceType || this._determineFileType(file);

    if (!this._validateFile(file, fileType)) {
      return;
    }

    // Aggiorna l'UI con le informazioni sul file
    this._updateFileInfo(file);

    // Salva il file corrente
    this.currentFile = file;
    this.currentFileType = fileType;

    // Leggi il file
    this._readFile(file, fileType);
  }

  // Determina il tipo di file in base all'estensione
  // @param {File} file - File da analizzare
  // @returns {string} - Tipo di file ('xml' o 'pdf')
  _determineFileType(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.xml')) {
      return 'xml';
    } else if (fileName.endsWith('.pdf')) {
      return 'pdf';
    }

    // Controlla il tipo MIME
    if (file.type === 'application/xml' || file.type === 'text/xml') {
      return 'xml';
    } else if (file.type === 'application/pdf') {
      return 'pdf';
    }

    // Default
    return 'unknown';
  }

  // Valida il file caricato
  // @param {File} file - File da validare
  // @param {string} fileType - Tipo di file
  // @returns {boolean} - True se il file è valido
  _validateFile(file, fileType) {
    if (!file) {
      this.onError(new Error('Nessun file selezionato'));
      return false;
    }

    if (fileType === 'unknown') {
      this.onError(new Error('Tipo di file non supportato. Carica un file XML o PDF.'));
      return false;
    }

    // Controlla dimensione massima (5MB)
    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      this.onError(new Error('Il file è troppo grande. La dimensione massima è 5MB.'));
      return false;
    }

    return true;
  }

  // Aggiorna l'interfaccia con le informazioni sul file
  // @param {File} file - File caricato
  _updateFileInfo(file) {
    const fileInfo = document.querySelector('.file-info');
    if (fileInfo) {
      const fileSize = this._formatFileSize(file.size);
      fileInfo.textContent = `File ${file.name} (${fileSize})`;
      fileInfo.classList.add('file-selected');
    }

    // Aggiorna i pulsanti
    const xmlBtn = document.getElementById('upload-xml-btn');
    const pdfBtn = document.getElementById('upload-pdf-btn');

    if (this._determineFileType(file) === 'xml') {
      xmlBtn.classList.add('active');
      pdfBtn.classList.remove('active');
    } else {
      xmlBtn.classList.remove('active');
      pdfBtn.classList.add('active');
    }
  }

  // Formatta la dimensione del file in un formato leggibile
  // @param {number} bytes - Dimensione in bytes
  // @returns {string} - Dimensione formattata
  _formatFileSize(bytes) {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  // Legge il contenuto del file
  // @param {File} file - File da leggere
  // @param {string} fileType - Tipo di file
  _readFile(file, fileType) {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const fileContent = event.target.result;

        // Notifica che il file è stato caricato
        this.onFileLoaded({
          file,
          fileType,
          content: fileContent
        });

        // Aggiorna stato UI
        this._setLoadingState(false);
      } catch (error) {
        this.onError(error);
        this._setLoadingState(false);
      }
    };

    reader.onerror = () => {
      this.onError(new Error('Errore nella lettura del file'));
      this._setLoadingState(false);
    };

    // Mostra stato di caricamento
    this._setLoadingState(true);

    // Leggi il file in base al tipo
    if (fileType === 'xml') {
      reader.readAsText(file);
    } else if (fileType === 'pdf') {
      reader.readAsArrayBuffer(file);
    }
  }

  // Imposta lo stato di caricamento nell'UI
  // @param {boolean} isLoading - True se è in corso il caricamento
  _setLoadingState(isLoading) {
    const dropZone = document.querySelector('.drop-zone');

    if (isLoading) {
      dropZone.classList.add('loading');
    } else {
      dropZone.classList.remove('loading');
    }
  }

  // Ottiene il file caricato corrente
  // @returns {Object} - Informazioni sul file corrente
  getCurrentFile() {
    if (!this.currentFile) {
      return null;
    }

    return {
      file: this.currentFile,
      fileType: this.currentFileType
    };
  }

  // Resetta il componente di upload
  reset() {
    this.currentFile = null;
    this.currentFileType = null;

    const fileInfo = document.querySelector('.file-info');
    if (fileInfo) {
      fileInfo.textContent = 'Nessun file selezionato';
      fileInfo.classList.remove('file-selected');
    }

    const xmlBtn = document.getElementById('upload-xml-btn');
    const pdfBtn = document.getElementById('upload-pdf-btn');
    xmlBtn.classList.remove('active');
    pdfBtn.classList.remove('active');

    // Reset input file
    const xmlInput = document.getElementById('xml-file-input');
    const pdfInput = document.getElementById('pdf-file-input');
    if (xmlInput) xmlInput.value = '';
    if (pdfInput) pdfInput.value = '';
  }
}

export default FileUploader;
