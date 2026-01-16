// ===== firebase-adapter.js =====
// This creates the missing SDKs that your business logic expects
// WITHOUT changing any of your existing code

console.log("🔥 Firebase adapter loading...");

// Create the missing dataSdk that your code expects
window.dataSdk = {
  async init(options) {
    console.log("📊 dataSdk.init() called");
    
    try {
      // Get Firestore database
      const db = firebase.firestore();
      
      if (options && options.onDataChanged) {
        // Set up real-time listener for all transactions
        db.collection("transactions")
          .orderBy("timestamp", "desc")
          .onSnapshot(snapshot => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log(`📥 Data updated: ${data.length} records`);
            options.onDataChanged(data);
          });
      }
      
      return { isOk: true };
    } catch (error) {
      console.error("❌ dataSdk.init() error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async create(data) {
    console.log("➕ Creating record:", data.type, data.product_name || data.expense_name);
    
    try {
      const db = firebase.firestore();
      const docRef = await db.collection("transactions").add({
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("✅ Record created with ID:", docRef.id);
      return { isOk: true, id: docRef.id };
    } catch (error) {
      console.error("❌ Create error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async update(id, data) {
    console.log("✏️ Updating record:", id);
    
    try {
      const db = firebase.firestore();
      await db.collection("transactions").doc(id).update({
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { isOk: true };
    } catch (error) {
      console.error("❌ Update error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  async delete(id) {
    console.log("🗑️ Deleting record:", id);
    
    try {
      const db = firebase.firestore();
      await db.collection("transactions").doc(id).delete();
      return { isOk: true };
    } catch (error) {
      console.error("❌ Delete error:", error);
      return { isOk: false, error: error.message };
    }
  }
};

// Create the missing elementSdk that your code expects
window.elementSdk = {
  init(config) {
    console.log("🎨 elementSdk.init() called");
    
    // Store config in localStorage (simple implementation)
    if (config.defaultConfig) {
      const savedConfig = localStorage.getItem('ohilicway_config');
      if (!savedConfig) {
        localStorage.setItem('ohilicway_config', JSON.stringify(config.defaultConfig));
      }
    }
    
    if (config.onConfigChange) {
      // Watch for config changes
      window.addEventListener('storage', (e) => {
        if (e.key === 'ohilicway_config') {
          config.onConfigChange(JSON.parse(e.newValue || '{}'));
        }
      });
    }
    
    return { isOk: true };
  },
  
  setConfig(newConfig) {
    console.log("⚙️ Setting config:", newConfig);
    
    try {
      const current = JSON.parse(localStorage.getItem('ohilicway_config') || '{}');
      const updated = { ...current, ...newConfig };
      localStorage.setItem('ohilicway_config', JSON.stringify(updated));
      return { isOk: true };
    } catch (error) {
      console.error("❌ Config error:", error);
      return { isOk: false, error: error.message };
    }
  },
  
  getConfig() {
    const config = JSON.parse(localStorage.getItem('ohilicway_config') || '{}');
    return { isOk: true, config };
  }
};

console.log("✅ SDKs created successfully. Your business logic will work now.");