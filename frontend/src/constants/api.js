export const API_URL = import.meta.env.VITE_API_URL || "ai-learning-assistant-prakash.duckdns.org";
export const BACKEND_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;
