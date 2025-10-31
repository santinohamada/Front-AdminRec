export const loadFromMockStorage = <T>(key: string, fallback: T[] = []): T[] => {
    // 1. Verificar si estamos en el navegador
    if (typeof window === "undefined") {
      return fallback
    }
  
    // 2. Si estamos en el navegador, intentar cargar y parsear
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T[]) : fallback
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error)
      return fallback
    }
  }