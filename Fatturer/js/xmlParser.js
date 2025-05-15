class XmlParser {
    parseXmlContent(xmlContent) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

        const invoiceData = {};

        invoiceData.header = this.parseHeader(xmlDoc);
        invoiceData.supplier = this.parseSupplier(xmlDoc);
        invoiceData.customer = this.parseCustomer(xmlDoc);
        invoiceData.lines = this.parseInvoiceLines(xmlDoc);
        invoiceData.summary = this.parseSummary(xmlDoc);

        return invoiceData;
    }

    parseHeader(xml) {
        const header = {};
        header.version = this.getText(xml, 'FormatoTrasmissione');
        header.progressive = this.getText(xml, 'ProgressivoInvio');
        header.transmissionDate = this.getText(xml, 'Data');
        header.number = this.getText(xml, 'Numero');
        header.date = this.getText(xml, 'Data');
        return header;
    }

    parseSupplier(xml) {
        const supplier = {};
        const base = xml.getElementsByTagName('CedentePrestatore')[0];

        supplier.name = this.getText(base, 'Denominazione') || this.getText(base, 'Nome') || '';
        supplier.vat = this.getText(base, 'IdFiscaleIVA > IdCodice');
        supplier.taxCode = this.getText(base, 'CodiceFiscale');
        supplier.address = this.getText(base, 'Indirizzo');
        supplier.zip = this.getText(base, 'CAP');
        supplier.city = this.getText(base, 'Comune');
        supplier.province = this.getText(base, 'Provincia');
        supplier.country = this.getText(base, 'Nazione');

        return supplier;
    }

    parseCustomer(xml) {
        const customer = {};
        const base = xml.getElementsByTagName('CessionarioCommittente')[0];

        customer.name = this.getText(base, 'Denominazione') || this.getText(base, 'Nome') || '';
        customer.vat = this.getText(base, 'IdFiscaleIVA > IdCodice');
        customer.taxCode = this.getText(base, 'CodiceFiscale');
        customer.address = this.getText(base, 'Indirizzo');
        customer.zip = this.getText(base, 'CAP');
        customer.city = this.getText(base, 'Comune');
        customer.province = this.getText(base, 'Provincia');
        customer.country = this.getText(base, 'Nazione');

        return customer;
    }

    parseInvoiceLines(xml) {
        const lines = [];
        const details = xml.getElementsByTagName('DettaglioLinee');

        for (let i = 0; i < details.length; i++) {
            const item = details[i];
            const line = {
                number: this.getText(item, 'NumeroLinea'),
                description: this.getText(item, 'Descrizione'),
                quantity: this.getText(item, 'Quantita'),
                unit: this.getText(item, 'UnitaMisura'),
                price: this.getText(item, 'PrezzoUnitario'),
                total: this.getText(item, 'PrezzoTotale'),
                vatRate: this.getText(item, 'AliquotaIVA'),
            };
            lines.push(line);
        }

        return lines;
    }

    parseSummary(xml) {
        const summary = [];
        const summaries = xml.getElementsByTagName('DatiRiepilogo');

        for (let i = 0; i < summaries.length; i++) {
            const item = summaries[i];
            const line = {
                taxableAmount: this.getText(item, 'ImponibileImporto'),
                vatAmount: this.getText(item, 'Imposta'),
                vatRate: this.getText(item, 'AliquotaIVA'),
            };
            summary.push(line);
        }

        return summary;
    }

    getText(context, selector) {
        try {
            const parts = selector.split(' > ');
            let element = context;

            for (const part of parts) {
                if (!element) return '';
                element = element.getElementsByTagName(part)[0];
            }

            return element ? element.textContent.trim() : '';
        } catch {
            return '';
        }
    }
}

window.XmlParser = XmlParser;
