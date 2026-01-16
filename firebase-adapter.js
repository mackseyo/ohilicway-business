// ===== SIMPLE FIREBASE ADAPTER =====
console.log("🔥 Firebase adapter loading...");

// Wait for Firebase to load
let firebaseInitialized = false;

function initializeFirebase() {
  if (typeof firebase === 'undefined') {
    console.log("⏳ Firebase not loaded yet, waiting...");
    setTimeout(initializeFirebase, 500);
    return;
  }
  
  try {
    // Your Firebase config - UPDATE THIS!
    const firebaseConfig = {
      apiKey: "AIzaSyDEXAMPLEKEY1234567890",
      authDomain: "ohilicway-business.firebaseapp.com",
      projectId: "ohilicway-business",
      storageBucket: "ohilicway-business.appspot.com",
      messagingSenderId: "123456789012",
      appId: "1:123456789012:web:abc123def456789"
    };
    
    // Initialize Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    console.log("✅ Firebase initialized");
    firebaseInitialized = true;
    initializeDataSdk();
    
  } catch (error) {
    console.error("❌ Firebase init error:", error);
    setupLocalStorageFallback();
  }
}

function initializeDataSdk() {
  const db = firebase.firestore();
  
  // Create the dataSdk your app expects
  window.dataSdk = {
    async init(options) {
      console.log("📊 dataSdk.init() called");
      
      try {
        if (options && options.onDataChanged) {
          // Listen for all transactions
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
      console.log("➕ Creating record:", data);
      
      try {
        const docRef = await db.collection("transactions").add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("✅ Record created with ID:", docRef.id);
        return { isOk: true, id: docRef.id };
      } catch (error) {
        console.error("❌ Create error:", error);
        // Fallback to localStorage
        return localStorageCreate(data);
      }
    },
    
    async update(id, data) {
      console.log("✏️ Updating record:", id);
      
      try {
        await db.collection("transactions").doc(id).update(data);
        return { isOk: true };
      } catch (error) {
        console.error("❌ Update error:", error);
        return { isOk: false, error: error.message };
      }
    },
    
    async delete(id) {
      console.log("🗑️ Deleting record:", id);
      
      try {
        await db.collection("transactions").doc(id).delete();
        return { isOk: true };
      } catch (error) {
        console.error("❌ Delete error:", error);
        return { isOk: false, error: error.message };
      }
    }
  };
  
  // Create simple elementSdk
  window.elementSdk = {
    init: () => ({ isOk: true }),
    setConfig: () => ({ isOk: true }),
    getConfig: () => ({ isOk: true, config: {} })
  };
  
  console.log("✅ SDKs created successfully");
}

// LocalStorage fallback
function setupLocalStorageFallback() {
  console.log("🔄 Setting up localStorage fallback");
  
  window.dataSdk = {
    async init(options) {
      console.log("📊 Using localStorage");
      const data = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
      if (options?.onDataChanged) {
        options.onDataChanged(data);
        // Store callback for updates
        window.dataUpdateCallback = options.onDataChanged;
      }
      return { isOk: true };
    },
    
    async create(data) {
      console.log("➕ Saving to localStorage:", data);
      const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
      items.push({ ...data, id: Date.now() });
      localStorage.setItem('ohilicway_data', JSON.stringify(items));
      
      // Update UI
      if (window.dataUpdateCallback) {
        window.dataUpdateCallback(items);
      }
      
      return { isOk: true };
    }
  };
  
  window.elementSdk = {
    init: () => ({ isOk: true }),
    setConfig: () => ({ isOk: true })
  };
}

// LocalStorage create helper
function localStorageCreate(data) {
  const items = JSON.parse(localStorage.getItem('ohilicway_data') || '[]');
  items.push({ ...data, id: Date.now() });
  localStorage.setItem('ohilicway_data', JSON.stringify(items));
  
  // Trigger update
  if (window.dataUpdateCallback) {
    window.dataUpdateCallback(items);
  }
  
  return { isOk: true };
}

// Start initialization
initializeFirebase();
