const rawApiUrl = 'https://citmobi2.onrender.com'.replace(/\/+$/, '');
const resolvedApiUrl = rawApiUrl.endsWith('/citmobi') ? rawApiUrl : `${rawApiUrl}/citmobi`;

export const environment = {
  production: true,
  apiUrl: resolvedApiUrl,
  googleMapsApiKey: '',
};
