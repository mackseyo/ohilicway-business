// ===== SIMPLE WORKING ADAPTER =====
console.log("🚀 Loading SIMPLE adapter...");

// Create the REQUIRED SDKs immediately
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() - SIMPLE VERSION");
    
    // Load from localStorage
    const data = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    console.log(`📥 Loaded ${data.length} records from localStorage`);
    
    if (options && options.onDataChanged) {
      // Send data immediately
      options.onDataChanged(data);
      
      // Store callback for updates
      window._dataUpdateCallback = options.onDataChanged;
    }
    
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`➕ CREATE: ${data.type} - ${data.product_name || data.expense_name}`);
    
    try {
      // Load current data
      const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
      
      // Add new item
      const newItem = {
        ...data,
        id: Date.now(),
        timestamp: data.timestamp || Date.now()
      };
      items.push(newItem);
      
      // Save to localStorage
      localStorage.setItem('ohilicway_data', JSON.stringify(items));
      console.log("💾 Saved to localStorage");
      
      // Update UI if callback exists
      if (window._dataUpdateCallback) {
        window._dataUpdateCallback(items);
      }
      
      // Show success
      if (typeof showNotification === 'function') {
        showNotification(`${data.type} added successfully!`, 'success');
      }
      
      return { isOk: true, id: newItem.id };
      
    } catch (error) {
      console.error("❌ Create error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ UPDATE:", id);
    const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data };
      localStorage.setItem('ohilicway_data', JSON.stringify(items));
      if (window._dataUpdateCallback) window._dataUpdateCallback(items);
    }
    return { isOk: true };
  },
  
  async delete(id) {
    console.log("🗑️ DELETE:", id);
    const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    const newItems = items.filter(item => item.id !== id);
    localStorage.setItem('ohilicway_data', JSON.stringify(newItems));
    if (window._dataUpdateCallback) window._dataUpdateCallback(newItems);
    return { isOk: true };
  }
};

// Element SDK
window.elementSdk = {
  init: (config) => {
    console.log("🎨 elementSdk.init() - SIMPLE VERSION");
    if (config?.defaultConfig) {
      localStorage.setItem('ohilicway_config', JSON.stringify(config.defaultConfig));
    }
    return { isOk: true };
  },
  
  setConfig: (newConfig) => {
    const current = JSON.parse(localStorage.getItem('ohilicway_config') || '{}');
    const updated = { ...current, ...newConfig };
    localStorage.setItem('ohilicway_config', JSON.stringify(updated));
    return { isOk: true };
  },
  
  getConfig: () => ({
    isOk: true,
    config: JSON.parse(localStorage.getItem('ohilicway_config') || '{}')
  })
};

console.log("✅ SIMPLE adapter READY!");
