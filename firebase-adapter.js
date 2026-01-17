// ===== OHILICWAY BUSINESS SYSTEM ADAPTER =====
console.log("🚀 BUSINESS ADAPTER LOADING...");

// Use the CORRECT storage key
const STORAGE_KEY = 'ohilicway_data';

// 1. Create dataSdk IMMEDIATELY
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called");
    
    // Load existing data
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    console.log(`📥 Loaded ${savedData.length} records`);
    
    if (options && options.onDataChanged) {
      // Store callback for updates
      window.ohilicwayUpdateCallback = options.onDataChanged;
      // Send data immediately
      options.onDataChanged(savedData);
    }
    
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`➕ CREATE: ${data.type} - ${data.product_name || data.expense_name}`);
    
    try {
      // Get current data
      const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      
      // Add with ID
      const newItem = {
        ...data,
        id: Date.now(),
        created_at: new Date().toISOString()
      };
      
      // Save
      currentData.push(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      console.log("💾 Saved to localStorage");
      
      // Update UI
      if (window.ohilicwayUpdateCallback) {
        window.ohilicwayUpdateCallback(currentData);
      }
      
      // ===== CRITICAL FIX: HIDE LOADING SPINNER =====
      hideLoadingSpinner();
      
      // Show success
      if (typeof showNotification === 'function') {
        showNotification(`✅ ${data.type} saved successfully!`, 'success');
      } else {
        console.log("✅ Saved successfully!");
      }
      
      return { isOk: true, id: newItem.id };
      
    } catch (error) {
      console.error("❌ Save error:", error);
      
      // STILL hide loading on error
      hideLoadingSpinner();
      
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ UPDATE:", id);
    const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const index = currentData.findIndex(item => item.id === id);
    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...data };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      if (window.ohilicwayUpdateCallback) window.ohilicwayUpdateCallback(currentData);
    }
    return { isOk: true };
  },
  
  async delete(id) {
    console.log("🗑️ DELETE:", id);
    const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newData = currentData.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    if (window.ohilicwayUpdateCallback) window.ohilicwayUpdateCallback(newData);
    return { isOk: true };
  }
};

// 2. Create elementSdk
window.elementSdk = {
  init: (config) => {
    console.log("🎨 elementSdk.init() called");
    if (config?.defaultConfig) {
      localStorage.setItem('ohilicway_config', JSON.stringify(config.defaultConfig));
    }
    return { isOk: true };
  },
  setConfig: () => ({ isOk: true }),
  getConfig: () => ({ isOk: true, config: {} })
};

// ===== CRITICAL FUNCTION TO HIDE SPINNER =====
function hideLoadingSpinner() {
  console.log("🔄 Hiding loading spinner...");
  
  // Method 1: Use existing hideLoading function
  if (typeof hideLoading === 'function') {
    hideLoading();
  }
  
  // Method 2: Direct DOM manipulation
  const loader = document.getElementById('loadingIndicator');
  if (loader && !loader.classList.contains('hidden')) {
    loader.classList.add('hidden');
    console.log("✅ Spinner hidden via DOM");
  }
  
  // Method 3: Close any modal
  const modal = document.getElementById('modalContainer');
  if (modal) {
    modal.innerHTML = '';
    console.log("✅ Modal cleared");
  }
}

console.log("✅✅✅ BUSINESS ADAPTER READY!");
