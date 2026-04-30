declare global {
  interface Window {
    __VIRA_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export const environment = {
  production: false,
  //apiUrl: window.__VIRA_CONFIG__?.apiUrl || 'http://localhost:3000'
  apiUrl: window.__VIRA_CONFIG__?.apiUrl || 'http://192.168.1.9:3000'

};
