import { useEffect } from "react";
import Router from "./router/Router"
import { initDB } from "./utils/indexDB";

const App = () => {
  // Initialize IndexedDB when the app starts
  useEffect(() => {
    const setupDB = async () => {
      try {
        await initDB();
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };

    setupDB();
  }, []);
  return <Router />
}

export default App