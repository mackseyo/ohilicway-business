// ===== SIMPLE 100% WORKING ADAPTER =====
console.log("💯 SIMPLE ADAPTER LOADING");

// Use CORRECT localStorage key
const STORAGE_KEY = 'ohilicway_data';

// Create dataSdk IMMEDIATELY
window.dataSdk = {
  async init(options) {
    console.log("📊 INIT called");
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    console.log(`📊 Found ${data.length} records`);
    
    if (options?.onDataChanged) {
      window.dataCallback = options.onDataChanged;
      options.onDataChanged(data);
    }
    
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`➕ CREATE: ${data.type}`, data.product_name || data.expense_name);
    
    // Get current
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // Add
    items.push({
      ...data,
      id: Date.now(),
      created: new Date().toISOString()
    });
    
    // Save
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    console.log("💾 Saved to localStorage");
    
    // Update UI
    if (window.dataCallback) {
      window.dataCallback(items);
    }
    
    // HIDE LOADING SPINNER (CRITICAL!)
    const loader = document.getElementById('loadingIndicator');
    if (loader) loader.classList.add('hidden');
    
    // Close modal
    const modal = document.getElementById('modalContainer');
    if (modal) modal.innerHTML = '';
    
    // Show success
    if (typeof showNotification === 'function') {
      showNotification(`✅ ${data.type} saved!`, 'success');
    }
    
    return { isOk: true };
  }
};

// Element SDK
window.elementSdk = {
  init: () => {
    console.log("🎨 elementSdk.init() called");
    return { isOk: true };
  },
  setConfig: () => ({ isOk: true }),
  getConfig: () => ({ isOk: true, config: {} })
};

console.log("✅✅✅ ADAPTER 100% READY");
