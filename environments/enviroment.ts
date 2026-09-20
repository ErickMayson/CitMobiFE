import { secrets } from './secret';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/citmobi',
  googleMapsApiKey: secrets?.googleMapsApiKey || '',
};
