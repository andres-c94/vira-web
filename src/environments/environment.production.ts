declare global {
  interface Window {
    __VIRA_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export const environment = {
  production: true,
  apiUrl: window.__VIRA_CONFIG__?.apiUrl || 'https://vira-api-n85f.onrender.com'
};
