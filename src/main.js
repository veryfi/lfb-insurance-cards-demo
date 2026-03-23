import './style.css';
import './lens-overrides.css';
import VeryfiLens from 'veryfi-lens-wasm';

const CLIENT_ID = import.meta.env.VITE_VERYFI_CLIENT_ID;

class ScannerApp {
 constructor() {
   this.appRoot = document.getElementById('app');
   this.statusDisplay = document.getElementById('status-display');
   this.resultDisplay = document.getElementById('result-display');
   this.settingAutoCapture = document.getElementById('setting-auto-capture');
   this.initializeEventListeners();
 }

 showApp() {
   this.appRoot.classList.remove('hidden');
 }

 hideApp() {
   this.appRoot.classList.add('hidden');
 }

 async initializeScanner(flavor) {
   try {
       this.hideApp();
       await VeryfiLens.init(CLIENT_ID, {
         lensFlavor: flavor,
         torchButton: true,
         torchOnStart: false,
         blurModal: true,
         isDocumentModal: true,
         exitButton: true,
         anydocMaxPages: 2,
         selectedBlueprint: "us_health_insurance_card",
         anydocShowFlipMessage: true,
         autoDocumentCapture: this.settingAutoCapture.checked,
         onClose: () => {
           this.showApp();
         },
       });
       this.setupEventHandlers();
     this.updateStatus('Scanner initialized');
     await VeryfiLens.showCamera();
   } catch (error) {
     this.showApp();
     this.handleError('Initialization failed', error);
   }
 }

 setupEventHandlers() {
   VeryfiLens.onSuccess((result) => {
     this.showApp();
     this.updateStatus('Scan completed');
     this.displayResult(result);
   });
   VeryfiLens.onFailure((error) => {
     this.showApp();
     this.handleError('Scan failed', error);
   });
   VeryfiLens.onUpdate((status) => {
     this.updateStatus(`Status: ${status.status}`);
   });
 }

 updateStatus(message) {
   this.statusDisplay.textContent = message;
 }

 displayResult(result) {
   const hiddenKeys = new Set([
     'id', 'external_id', 'status', 'package_id', 'is_duplicate',
     'model', 'tag', 'document_reference_number', 'ocr_text',
     'created_date', 'updated_date', 'text', 'blueprint_name',
     'template_name', 'carrier_address_raw', 'dependent_names',
     'img_url', 'img_file_name', 'img_thumbnail_url', 'pdf_url', 'meta',
   ]);

   const isEmpty = (v) => v === null || v === undefined || v === '' ||
     (Array.isArray(v) && v.length === 0);

   const escapeHTML = (v) => String(v ?? '')
     .replace(/&/g, '&amp;').replace(/</g, '&lt;')
     .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

   const formatLabel = (key) => key
     .replace(/_/g, ' ')
     .replace(/\b\w/g, c => c.toUpperCase());

   const makeField = (key, value) => `
     <div class="card-field">
       <label class="card-field-label">${formatLabel(key)}</label>
       <input class="card-field-input" type="text" value="${escapeHTML(value)}" data-key="${key}" />
     </div>`;

   const titleKey = result.insurance_company ? 'insurance_company'
     : result.vendor_name ? 'vendor_name' : null;
   const cardTitle = result.insurance_company || result.vendor_name || 'Scanned Document';

   const topFields = [];
   const sections = [];

   for (const [key, value] of Object.entries(result)) {
     if (hiddenKeys.has(key)) continue;
     if (titleKey && key === titleKey) continue;
     if (isEmpty(value)) continue;

     if (value && typeof value === 'object' && !Array.isArray(value)) {
       const sectionFields = Object.entries(value)
         .filter(([, v]) => !isEmpty(v))
         .map(([k, v]) => makeField(k, v))
         .join('');
       if (sectionFields) {
         sections.push(`
           <div class="card-section">
             <div class="card-section-label">${formatLabel(key)}</div>
             <div class="card-fields-grid">${sectionFields}</div>
           </div>`);
       }
     } else {
       topFields.push(makeField(key, value));
     }
   }

   const cardHTML = `
     <div class="virtual-card">
       <div class="virtual-card-header">
         <div class="virtual-card-logo">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 10h20"/></svg>
         </div>
         <input class="virtual-card-title" type="text" value="${escapeHTML(cardTitle)}" data-key="${titleKey || ''}" />
       </div>
       <div class="card-fields-grid">${topFields.join('')}</div>
       ${sections.join('')}
     </div>`;

   this.resultDisplay.innerHTML = `
     <h3>Scan Result:</h3>
     <div class="result-tabs">
       <button class="result-tab active" data-tab="card">Virtual Card</button>
       <button class="result-tab" data-tab="json">JSON</button>
     </div>
     <div class="result-tab-content active" id="tab-card">${cardHTML}</div>
     <div class="result-tab-content" id="tab-json">
       <pre>${JSON.stringify(result, null, 2)}</pre>
     </div>
   `;

   this.resultDisplay.querySelectorAll('.result-tab').forEach(tab => {
     tab.addEventListener('click', () => {
       this.resultDisplay.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
       this.resultDisplay.querySelectorAll('.result-tab-content').forEach(c => c.classList.remove('active'));
       tab.classList.add('active');
       this.resultDisplay.querySelector(`#tab-${tab.dataset.tab}`).classList.add('active');
     });
   });

   this.resultDisplay.querySelectorAll('.card-field-input, .virtual-card-title').forEach(input => {
     input.addEventListener('focus', () => input.closest('.card-field, .virtual-card-header')?.classList.add('editing'));
     input.addEventListener('blur', () => input.closest('.card-field, .virtual-card-header')?.classList.remove('editing'));
   });
 }

 handleError(context, error) {
   console.error(`${context}:`, error);
   this.statusDisplay.innerHTML = `
     <div class="error">
       ${context}: ${error.message}
     </div>
   `;
 }

 initializeEventListeners() {
   document.querySelectorAll('.scan-btn').forEach(button => {
     button.addEventListener('click', () => {
       const scanType = button.dataset.type;
       this.initializeScanner(scanType);
     });
   });
 }
}

document.addEventListener('DOMContentLoaded', () => {
 new ScannerApp();
});