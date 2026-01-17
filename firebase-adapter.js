// ===== OHILICWAY BUSINESS SYSTEM ADAPTER =====
console.log("🚀 BUSINESS ADAPTER LOADING...");

// Storage keys
const LOCAL_STORAGE_KEY = 'ohilicway_data';
const CONFIG_STORAGE_KEY = 'ohilicway_config';

// Global state
let firestore = null;
let isFirebaseReady = false;
let currentData = [];

// Initialize Firebase
async function initializeFirebase() {
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length && window.firebaseReady) {
      firestore = firebase.firestore();
      isFirebaseReady = true;
      console.log("✅ Firebase Firestore ready!");
      return true;
    }
    console.log("⚠️ Firebase not available, using localStorage");
    return false;
  } catch (error) {
    console.error("❌ Firebase error:", error);
    return false;
  }
}

// Ensure hideLoading function exists globally
if (typeof window.hideLoading !== 'function') {
  window.hideLoading = function() {
    console.log("🔧 hideLoading() created by adapter");
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.classList.add('hidden');
      console.log("✅ Loading spinner hidden");
    }
  };
}

// Ensure showLoading function exists
if (typeof window.showLoading !== 'function') {
  window.showLoading = function() {
    console.log("🔧 showLoading() created by adapter");
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
      loader.classList.remove('hidden');
    }
  };
}

// Load data from Firebase or localStorage
async function loadData() {
  try {
    // Try Firebase first
    if (isFirebaseReady && firestore) {
      console.log("📥 Loading from Firebase...");
      try {
        const snapshot = await firestore.collection('business_data').orderBy('timestamp', 'desc').get();
        const firebaseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (firebaseData.length > 0) {
          console.log(`✅ Loaded ${firebaseData.length} records from Firebase`);
          currentData = firebaseData;
          
          // Also save to localStorage for offline use
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(firebaseData));
          
          return currentData;
        }
      } catch (firebaseError) {
        console.log("⚠️ Couldn't load from Firebase, using localStorage:", firebaseError.message);
      }
    }
    
    // Fallback to localStorage
    console.log("📥 Loading from localStorage...");
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    console.log(`✅ Loaded ${localData.length} records from localStorage`);
    currentData = localData;
    return currentData;
    
  } catch (error) {
    console.error("❌ Error loading data:", error);
    const fallbackData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    currentData = fallbackData;
    return fallbackData;
  }
}

// Save data to both Firebase and localStorage
async function saveData(data) {
  try {
    // Always save to localStorage first (for immediate access)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    console.log(`💾 Saved ${data.length} records to localStorage`);
    
    // Try to save to Firebase
    if (isFirebaseReady && firestore) {
      console.log("💾 Saving to Firebase...");
      
      try {
        // Get existing Firebase data to sync
        const snapshot = await firestore.collection('business_data').get();
        
        // Delete all existing Firebase data
        const batch = firestore.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        // Add all current data
        data.forEach(item => {
          const docRef = firestore.collection('business_data').doc();
          batch.set(docRef, {
            ...item,
            synced_at: new Date().toISOString()
          });
        });
        
        await batch.commit();
        console.log(`✅ Synced ${data.length} records to Firebase`);
        
      } catch (firebaseError) {
        console.error("⚠️ Couldn't save to Firebase:", firebaseError.message);
        console.log("📦 Data saved to localStorage only");
      }
    }
    
  } catch (error) {
    console.error("❌ Error saving data:", error);
  }
}

// ===== DATA SDK IMPLEMENTATION =====
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called");
    
    // Initialize Firebase
    await initializeFirebase();
    
    // Load data
    const data = await loadData();
    currentData = data;
    
    // Store callback for updates
    if (options && options.onDataChanged) {
      window.ohilicwayUpdateCallback = options.onDataChanged;
      options.onDataChanged(data);
    }
    
    // Hide any stuck loading spinner
    setTimeout(() => {
      window.hideLoading();
    }, 500);
    
    console.log(`✅ System ready with ${data.length} records`);
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`➕ CREATE: ${data.type} - ${data.product_name || data.expense_name}`);
    
    try {
      // Show loading
      window.showLoading();
      
      // Add metadata
      const newItem = {
        ...data,
        id: Date.now().toString(),
        timestamp: data.timestamp || Date.now(),
        created_at: new Date().toISOString()
      };
      
      // Add to current data
      currentData.unshift(newItem); // Add to beginning
      
      // Save data
      await saveData(currentData);
      
      // Update UI
      if (window.ohilicwayUpdateCallback) {
        window.ohilicwayUpdateCallback(currentData);
      }
      
      // HIDE LOADING SPINNER
      setTimeout(() => {
        window.hideLoading();
      }, 300);
      
      // Show success
      if (typeof showNotification === 'function') {
        showNotification(`✅ ${data.type} added successfully!`, 'success');
      }
      
      return { isOk: true, id: newItem.id };
      
    } catch (error) {
      console.error("❌ Create error:", error);
      
      // Still hide loading
      window.hideLoading();
      
      if (typeof showNotification === 'function') {
        showNotification('Failed to save data', 'error');
      }
      
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ UPDATE:", id);
    try {
      const index = currentData.findIndex(item => item.id === id);
      if (index !== -1) {
        currentData[index] = { ...currentData[index], ...data };
        await saveData(currentData);
        if (window.ohilicwayUpdateCallback) window.ohilicwayUpdateCallback(currentData);
      }
      return { isOk: true };
    } catch (error) {
      return { isOk: false, error: error.message };
    }
  },
  
  async delete(id) {
    console.log("🗑️ DELETE:", id);
    try {
      currentData = currentData.filter(item => item.id !== id);
      await saveData(currentData);
      if (window.ohilicwayUpdateCallback) window.ohilicwayUpdateCallback(currentData);
      return { isOk: true };
    } catch (error) {
      return { isOk: false, error: error.message };
    }
  }
};

// ===== ELEMENT SDK IMPLEMENTATION =====
window.elementSdk = {
  init: (config) => {
    console.log("🎨 elementSdk.init() called");
    
    // Load or save config
    let savedConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
    if (config?.defaultConfig) {
      savedConfig = { ...savedConfig, ...config.defaultConfig };
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(savedConfig));
    }
    
    return { isOk: true, config: savedConfig };
  },
  
  setConfig: (newConfig) => {
    const currentConfig = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
    const updatedConfig = { ...currentConfig, ...newConfig };
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    return { isOk: true };
  },
  
  getConfig: () => {
    const config = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
    return { isOk: true, config };
  }
};

// ===== EMERGENCY SPINNER FIX =====
// Force hide any stuck spinner on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 DOM loaded, checking for stuck spinner...");
  
  setTimeout(() => {
    const loader = document.getElementById('loadingIndicator');
    if (loader && !loader.classList.contains('hidden')) {
      console.log("🛑 Found stuck spinner, hiding it...");
      loader.classList.add('hidden');
    }
  }, 1000);
});

// Auto-hide spinner safety net
setInterval(() => {
  const loader = document.getElementById('loadingIndicator');
  if (loader && !loader.classList.contains('hidden')) {
    console.log("⏰ Auto-hiding stuck spinner (safety net)");
    loader.classList.add('hidden');
  }
}, 5000);

console.log("✅✅✅ BUSINESS ADAPTER READY!");
