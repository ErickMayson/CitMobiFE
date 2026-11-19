// Exemplo de configuração de segredos locais e ambiente.
// Em build local ou CI, pode ser preenchido ou fornecido via variável GOOGLE_MAPS_API_KEY.
export const secrets = {
  googleMapsApiKey: (typeof process !== 'undefined' && process.env ? process.env['GOOGLE_MAPS_API_KEY'] : '') || '',
};
