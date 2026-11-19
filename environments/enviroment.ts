declare const process: any;
declare const window: any;

let secretKey = '';
try {
  const dynamicRequire = new Function('try { return require; } catch(e) { return null; }')();
  if (dynamicRequire) {
    const secretModule = dynamicRequire('./secret');
    secretKey = secretModule?.secrets?.googleMapsApiKey || '';
  }
} catch {
  // secret.ts does not exist
}

const envKey =
  (typeof process !== 'undefined' && process?.env
    ? process.env['googleApiKey'] ||
      process.env['googleMapsApiKey'] ||
      process.env['GOOGLE_MAPS_API_KEY'] ||
      process.env['GOOGLE_API_KEY'] ||
      ''
    : '') ||
  (typeof window !== 'undefined'
    ? window?.__env?.googleApiKey ||
      window?.__env?.googleMapsApiKey ||
      window?.googleApiKey ||
      window?.googleMapsApiKey ||
      ''
    : '');

const rawApiUrl = 'https://citmobi2.onrender.com'.replace(/\/+$/, '');
const resolvedApiUrl = rawApiUrl.endsWith('/citmobi') ? rawApiUrl : `${rawApiUrl}/citmobi`;

export const environment = {
  production: true,
  apiUrl: resolvedApiUrl,
  googleMapsApiKey: secretKey || envKey || '',
};
