// ===== FIREBASE DATA ADAPTER =====
console.log("🔥 Firebase adapter v2 loading...");

// Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeMa8R95fGULSNaF-VvXCw7UD5JnKwVUU",
  authDomain: "ohilicway-business.firebaseapp.com",
  projectId: "ohilicway-business",
  storageBucket: "ohilicway-business.firebasestorage.app",
  messagingSenderId: "744328322546",
  appId: "1:744328322546:web:bfdc4db10149414fdf9f6b"
};

// Initialize Firebase
try {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");
  }
} catch (error) {
  console.warn("⚠️ Firebase init warning:", error.message);
}

// Create the SDKs your app expects
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called");
    
    try {
      // Try Firebase first
      if (firebase && firebase.firestore) {
        const db = firebase.firestore();
        
        if (options && options.onDataChanged) {
          db.collection("transactions")
            .orderBy("timestamp", "desc")
            .onSnapshot(snapshot => {
              const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              console.log(`📥 Firebase data: ${data.length} records`);
              options.onDataChanged(data);
            });
        }
      } else {
        // Fallback to localStorage
        return this.initLocalStorage(options);
      }
      
      return { isOk: true };
    } catch (error) {
      console.error("❌ Firebase error, using localStorage:", error);
      return this.initLocalStorage(options);
    }
  },
  
  async create(data) {
    console.log(`➕ Creating ${data.type}:`, data.product_name || data.expense_name);
    
    try {
      // Try Firebase first
      if (firebase && firebase.firestore) {
        const db = firebase.firestore();
        const docRef = await db.collection("transactions").add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          timestamp: data.timestamp || Date.now()
        });
        console.log("✅ Saved to Firebase, ID:", docRef.id);
        return { isOk: true, id: docRef.id };
      } else {
        // Fallback to localStorage
        return this.createLocalStorage(data);
      }
    } catch (error) {
      console.error("❌ Save error, using localStorage:", error);
      return this.createLocalStorage(data);
    }
  },
  
  // LocalStorage fallback methods
  async initLocalStorage(options) {
    const data = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    console.log(`📥 LocalStorage data: ${data.length} records`);
    
    if (options?.onDataChanged) {
      window._dataUpdateCallback = options.onDataChanged;
      options.onDataChanged(data);
    }
    return { isOk: true };
  },
  
  async createLocalStorage(data) {
    const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    items.push({ ...data, id: Date.now() });
    localStorage.setItem('ohilicway_data', JSON.stringify(items));
    
    // Update UI
    if (window._dataUpdateCallback) {
      window._dataUpdateCallback(items);
    }
    
    // Show notification
    if (typeof showNotification === 'function') {
      showNotification(`${data.type} added successfully!`, 'success');
    }
    
    return { isOk: true };
  }
};

// Element SDK
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

console.log("✅ All adapters ready!");