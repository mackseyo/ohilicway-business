// ===== OHILICWAY BUSINESS ADAPTER =====
console.log("🚀 BUSINESS SYSTEM ADAPTER LOADED");

// 1. Create dataSdk IMMEDIATELY (no waiting)
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called");
    
    // Load existing data
    const savedData = JSON.parse(localStorage.getItem('ohilicway_business_data') || '[]');
    console.log(`📊 Loaded ${savedData.length} business records`);
    
    if (options && options.onDataChanged) {
      // Store callback
      window.businessDataCallback = options.onDataChanged;
      // Send data immediately
      options.onDataChanged(savedData);
    }
    
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`💰 Creating: ${data.type} - ${data.product_name || data.expense_name}`);
    
    try {
      // Get current data
      const currentData = JSON.parse(localStorage.getItem('ohilicway_business_data') || '[]');
      
      // Add with ID
      const newItem = {
        ...data,
        id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      
      // Save
      currentData.push(newItem);
      localStorage.setItem('ohilicway_business_data', JSON.stringify(currentData));
      
      // Update UI
      if (window.businessDataCallback) {
        window.businessDataCallback(currentData);
      }
      
      // Hide loading spinner (CRITICAL FIX!)
      if (typeof hideLoading === 'function') {
        hideLoading();
      }
      
      // Show success
      if (typeof showNotification === 'function') {
        showNotification(`✅ ${data.type} saved successfully!`, 'success');
      } else {
        console.log("✅ Saved successfully!");
      }
      
      return { isOk: true, id: newItem.id };
      
    } catch (error) {
      console.error("❌ Save error:", error);
      
      // IMPORTANT: Hide loading even on error
      if (typeof hideLoading === 'function') hideLoading();
      
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ Updating:", id);
    const currentData = JSON.parse(localStorage.getItem('ohilicway_business_data') || '[]');
    const index = currentData.findIndex(item => item.id === id);
    if (index !== -1) {
      currentData[index] = { ...currentData[index], ...data };
      localStorage.setItem('ohilicway_business_data', JSON.stringify(currentData));
      if (window.businessDataCallback) window.businessDataCallback(currentData);
    }
    return { isOk: true };
  },
  
  async delete(id) {
    console.log("🗑️ Deleting:", id);
    const currentData = JSON.parse(localStorage.getItem('ohilicway_business_data') || '[]');
    const newData = currentData.filter(item => item.id !== id);
    localStorage.setItem('ohilicway_business_data', JSON.stringify(newData));
    if (window.businessDataCallback) window.businessDataCallback(newData);
    return { isOk: true };
  }
};

// 2. Create elementSdk
window.elementSdk = {
  init: (config) => {
    console.log("🎨 elementSdk.init() called");
    return { isOk: true };
  },
  setConfig: () => ({ isOk: true }),
  getConfig: () => ({ isOk: true, config: {} })
};

console.log("✅ BUSINESS ADAPTER READY FOR USE");
