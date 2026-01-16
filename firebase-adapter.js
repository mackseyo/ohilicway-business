// ===== OHILICWAY FIREBASE ADAPTER =====
console.log("🚀 Loading Ohilicway Firebase adapter...");

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBeMa8R95fGULSNaF-VvXCw7UD5JnKwVUU",
  authDomain: "ohilicway-business.firebaseapp.com",
  projectId: "ohilicway-business",
  storageBucket: "ohilicway-business.firebasestorage.app",
  messagingSenderId: "744328322546",
  appId: "1:744328322546:web:bfdc4db10149414fdf9f6b"
};

<script>
// QUICK TEST: Is everything loading?
console.log("=== SYSTEM CHECK ===");
console.log("Firebase loaded:", typeof firebase !== 'undefined');
console.log("dataSdk exists:", typeof window.dataSdk !== 'undefined');
console.log("elementSdk exists:", typeof window.elementSdk !== 'undefined');

// If dataSdk doesn't exist, create a simple one
setTimeout(() => {
  if (!window.dataSdk) {
    console.log("⚠️ Creating emergency dataSdk...");
    window.dataSdk = {
      async init(options) {
        console.log("📊 Emergency dataSdk.init()");
        const data = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
        if (options?.onDataChanged) options.onDataChanged(data);
        return { isOk: true };
      },
      async create(data) {
        console.log("➕ Emergency save:", data.type);
        const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
        items.push({ ...data, id: Date.now() });
        localStorage.setItem('ohilicway_data', JSON.stringify(items));
        
        if (typeof showNotification === 'function') {
          showNotification(`${data.type} saved (emergency mode)`, 'success');
        }
        
        return { isOk: true };
      }
    };
    window.elementSdk = { init: () => ({ isOk: true }) };
    console.log("✅ Emergency SDKs created");
  }
}, 1000);
</script>

// 2. INITIALIZE FIREBASE
let db = null;
try {
  if (typeof firebase === 'undefined') {
    throw new Error("Firebase scripts not loaded!");
  }
  
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");
  }
  
  db = firebase.firestore();
  console.log("✅ Firestore database ready");
  
} catch (error) {
  console.error("❌ Firebase setup error:", error);
  alert("FIREBASE ERROR: Check browser console");
}

// 3. CREATE THE dataSdk YOUR APP NEEDS
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called - Firebase version");
    
    if (!db) {
      console.error("❌ No database connection");
      return { isOk: false, error: "Database not connected" };
    }
    
    try {
      if (options && options.onDataChanged) {
        // Listen to ALL business data in real-time
        db.collection("business_data")
          .orderBy("timestamp", "desc")
          .onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`📥 Firebase update: ${data.length} records`);
            options.onDataChanged(data);
          }, error => {
            console.error("❌ Firestore listener error:", error);
          });
      }
      
      return { isOk: true };
      
    } catch (error) {
      console.error("❌ dataSdk.init() error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async create(data) {
    console.log(`➕ FIREBASE CREATE: ${data.type}`, data.product_name || data.expense_name);
    
    if (!db) {
      console.error("❌ Cannot save: No database");
      showNotification("Database error!", "error");
      return { isOk: false, error: "No database" };
    }
    
    try {
      // Ensure timestamp exists
      if (!data.timestamp) data.timestamp = Date.now();
      
      // Save to Firebase Firestore
      const docRef = await db.collection("business_data").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("✅✅✅ SAVED TO FIREBASE! Document ID:", docRef.id);
      
      // Show success
      if (typeof showNotification === 'function') {
        showNotification(`✅ ${data.type} saved to cloud!`, 'success');
      } else {
        alert(`✅ ${data.type} saved to cloud database!`);
      }
      
      return { isOk: true, id: docRef.id };
      
    } catch (error) {
      console.error("❌❌❌ FIREBASE SAVE ERROR:", error);
      
      // EMERGENCY FALLBACK to localStorage
      const emergencyData = JSON.parse(localStorage.getItem('ohilicway_emergency') || '[]');
      emergencyData.push({ ...data, id: Date.now(), firebase_failed: true });
      localStorage.setItem('ohilicway_emergency', JSON.stringify(emergencyData));
      
      alert(`⚠️ Saved locally (Firebase error: ${error.message})`);
      
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ Firebase UPDATE:", id);
    if (!db) return { isOk: false };
    
    try {
      await db.collection("business_data").doc(id).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { isOk: true };
    } catch (error) {
      console.error("Update error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async delete(id) {
    console.log("🗑️ Firebase DELETE:", id);
    if (!db) return { isOk: false };
    
    try {
      await db.collection("business_data").doc(id).delete();
      return { isOk: true };
    } catch (error) {
      console.error("Delete error:", error);
      return { isOk: false, error: error.message };
    }
  }
};

// 4. CREATE elementSdk (simplified)
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

console.log("✅✅✅ Ohilicway Firebase adapter READY!");
console.log("window.dataSdk created:", typeof window.dataSdk !== 'undefined');

