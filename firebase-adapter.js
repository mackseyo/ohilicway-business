// ===== FIREBASE-ONLY ADAPTER =====
console.log("🔥 FIREBASE-ONLY adapter loading...");

// Configuration (YOUR ACTUAL VALUES)
const firebaseConfig = {
  apiKey: "AIzaSyBeMa8R95fGULSNaF-VvXCw7UD5JnKwVUU",
  authDomain: "ohilicway-business.firebaseapp.com",
  projectId: "ohilicway-business",
  storageBucket: "ohilicway-business.firebasestorage.app",
  messagingSenderId: "744328322546",
  appId: "1:744328322546:web:bfdc4db10149414fdf9f6b"
};

// FORCE Firebase initialization
let firebaseReady = false;
let db = null;

function initializeFirebase() {
  try {
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase not loaded. Check script tags.");
      return false;
    }
    
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase app initialized");
    }
    
    db = firebase.firestore();
    
    // TEST connection immediately
    db.collection("test").doc("connection").set({
      test: true,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log("✅ Firebase connection TEST PASSED");
      firebaseReady = true;
      
      // Delete test document
      db.collection("test").doc("connection").delete();
    }).catch(error => {
      console.error("❌ Firebase connection FAILED:", error);
      alert("FIREBASE ERROR: Data won't save! Check console.");
    });
    
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization ERROR:", error);
    return false;
  }
}

// Initialize immediately
initializeFirebase();

// ===== STRICT FIREBASE-ONLY SDK =====
window.dataSdk = {
  async init(options) {
    console.log("📊 Firebase dataSdk.init() called");
    
    if (!firebaseReady) {
      console.log("⏳ Waiting for Firebase...");
      setTimeout(() => this.init(options), 1000);
      return { isOk: false, error: "Firebase not ready" };
    }
    
    if (options && options.onDataChanged) {
      // REAL-TIME Firestore listener
      db.collection("transactions")
        .orderBy("timestamp", "desc")
        .onSnapshot(snapshot => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`📥 Firebase real-time update: ${data.length} records`);
          options.onDataChanged(data);
        }, error => {
          console.error("❌ Firestore listener error:", error);
        });
    }
    
    return { isOk: true };
  },
  
  async create(data) {
    console.log(`➕ Firebase CREATE: ${data.type}`, data);
    
    if (!firebaseReady || !db) {
      console.error("❌ Firebase not ready for create");
      showNotification("Database not ready. Try again.", "error");
      return { isOk: false, error: "Firebase not ready" };
    }
    
    try {
      // ENSURE timestamp exists
      if (!data.timestamp) data.timestamp = Date.now();
      
      const docRef = await db.collection("transactions").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("✅ SAVED TO FIREBASE! ID:", docRef.id);
      showNotification(`${data.type} saved to cloud!`, "success");
      
      return { isOk: true, id: docRef.id };
      
    } catch (error) {
      console.error("❌ FIREBASE SAVE ERROR:", error);
      showNotification("Failed to save to cloud!", "error");
      
      // LAST RESORT: Save to localStorage but warn user
      const items = JSON.parse(localStorage.getItem('ohilicway_firebase_fallback') || '[]');
      items.push({ ...data, id: Date.now(), firebase_failed: true });
      localStorage.setItem('ohilicway_firebase_fallback', JSON.stringify(items));
      console.log("⚠️ Saved to localStorage fallback");
      
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ Firebase UPDATE:", id);
    if (!firebaseReady) return { isOk: false };
    
    try {
      await db.collection("transactions").doc(id).update({
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
    if (!firebaseReady) return { isOk: false };
    
    try {
      await db.collection("transactions").doc(id).delete();
      return { isOk: true };
    } catch (error) {
      console.error("Delete error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  // Special method to migrate localStorage to Firebase
  async migrateToFirebase() {
    const localData = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
    console.log(`🔄 Migrating ${localData.length} items to Firebase`);
    
    for (const item of localData) {
      await this.create(item);
    }
    
    localStorage.removeItem('ohilicway_data');
    console.log("✅ Migration complete!");
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

console.log("✅ Firebase-only adapter READY");
