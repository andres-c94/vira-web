declare global {
  interface Window {
    __VIRA_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export const environment = {
  production: true,
  apiUrl: window.__VIRA_CONFIG__?.apiUrl || 'http://192.168.1.9:3000'

};
