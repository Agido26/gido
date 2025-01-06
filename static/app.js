class PDFSearchApp {
    constructor() {
        this.pdfs = [];
        this.apiUrl = '';
        this.initializeElements();
        this.addEventListeners();
        this.setupDragAndDrop();
    }

    initializeElements() {
        this.pdfInput = document.getElementById('pdfInput');
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.resultsDiv = document.getElementById('results');
        this.pdfList = document.getElementById('pdfList');
        this.filesDiv = document.querySelector('.files');
    }

    addEventListeners() {
        this.pdfInput.addEventListener('change', this.handleFileSelect.bind(this));
        this.searchBtn.addEventListener('click', this.performSearch.bind(this));
    }

    setupDragAndDrop() {
        const uploadArea = document.querySelector('.upload-area');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4f46e5';
            uploadArea.style.backgroundColor = '#f5f3ff';
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e5e7eb';
            uploadArea.style.backgroundColor = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e5e7eb';
            uploadArea.style.backgroundColor = '';

            const files = Array.from(e.dataTransfer.files).filter(file =>
                file.type === 'application/pdf'
            );
            if (files.length) {
                this.handleFiles(files);
            }
        });
    }

    async handleFileSelect(event) {
        const files = Array.from(event.target.files);
        await this.handleFiles(files);
    }

    async handleFiles(files) {
        for (let file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(`${this.apiUrl}/process-pdf`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Failed to process PDF');

                const pdfData = await response.json();
                this.pdfs.push({
                    name: file.name,
                    content: pdfData.content,
                    pageCount: pdfData.pageCount
                });

                this.updatePDFList();
            } catch (error) {
                console.error('Error processing PDF:', error);
                alert(`Error processing ${file.name}: ${error.message}`);
            }
        }
    }

    updatePDFList() {
        this.pdfList.classList.remove('hidden');
        this.filesDiv.innerHTML = this.pdfs.map(pdf => `
            <div class="file-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>${pdf.name}</span>
            </div>
        `).join('');
    }

    async performSearch() {
        const searchQuery = this.searchInput.value.toLowerCase().trim();
        if (!searchQuery) return;

        this.resultsDiv.innerHTML = '<div class="searching">Searching...</div>';
        const results = [];

        const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 0);
        const minMatchThreshold = 0.8;

        for (let pdf of this.pdfs) {
            for (let pageNum in pdf.content) {
                const pageText = pdf.content[pageNum].toLowerCase();
                const matchedTerms = searchTerms.filter(term => pageText.includes(term));
                const matchRatio = matchedTerms.length / searchTerms.length;

                if (matchRatio >= minMatchThreshold || pageText.includes(searchQuery)) {
                    results.push({
                        pdfName: pdf.name,
                        pageNum: pageNum,
                        matchRatio: Math.round(matchRatio * 100)
                    });
                }
            }
        }

        this.displayResults(results);
    }

    displayResults(results) {
        if (results.length === 0) {
            this.resultsDiv.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }

        this.resultsDiv.innerHTML = results
            .map(result => `
                <div class="result-item">
                    <div>Found in ${result.pdfName} on page ${result.pageNum}</div>
                    <div class="match-percentage">Match: ${result.matchRatio}%</div>
                </div>
            `)
            .join('');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new PDFSearchApp();
}); 