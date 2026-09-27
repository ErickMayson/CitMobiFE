import {
  formatTransitLocation,
  abbreviateTransitLocation,
  expandTransitLocation,
  TRANSIT_TERMS,
} from './transit.utils';

describe('transit.utils', () => {
  describe('TRANSIT_TERMS dictionary', () => {
    it('should have standard rules for transit and urban entities', () => {
      const fullNames = TRANSIT_TERMS.map((t) => t.full);
      expect(fullNames).toContain('Praça');
      expect(fullNames).toContain('Terminal');
      expect(fullNames).toContain('Avenida');
      expect(fullNames).toContain('Rua');
      expect(fullNames).toContain('Estação');
      expect(fullNames).toContain('Metrô');
      expect(fullNames).toContain('Hospital');
      expect(fullNames).toContain('Shopping');
      expect(fullNames).toContain('Parque');
      expect(fullNames).toContain('Jardim');
      expect(fullNames).toContain('Vila');
      expect(fullNames).toContain('Aeroporto');
      expect(fullNames).toContain('Rodoviária');
    });
  });

  describe('abbreviateTransitLocation (mode: "short")', () => {
    it('should abbreviate "Praça do Avião" to "Pça. do Avião"', () => {
      expect(abbreviateTransitLocation('Praça do Avião')).toBe('Pça. do Avião');
      expect(abbreviateTransitLocation('Praça do Aviao')).toBe('Pça. do Avião');
      expect(abbreviateTransitLocation('PRACA DO AVIAO')).toBe('Pça. do Avião');
      expect(abbreviateTransitLocation('Pca do Aviao')).toBe('Pça. do Avião');
    });

    it('should abbreviate "Praça do Correio" to "Pça. do Correio"', () => {
      expect(abbreviateTransitLocation('Praça do Correio')).toBe('Pça. do Correio');
      expect(abbreviateTransitLocation('PÇA. DO CORREIO')).toBe('Pça. do Correio');
    });

    it('should abbreviate "Terminal São Miguel" to "Term. São Miguel"', () => {
      expect(abbreviateTransitLocation('Terminal São Miguel')).toBe('Term. São Miguel');
      expect(abbreviateTransitLocation('TERMINAL SAO MIGUEL')).toBe('Term. São Miguel');
    });

    it('should abbreviate "Avenida Paulista" to "Av. Paulista"', () => {
      expect(abbreviateTransitLocation('Avenida Paulista')).toBe('Av. Paulista');
      expect(abbreviateTransitLocation('AVENIDA PAULISTA')).toBe('Av. Paulista');
    });

    it('should abbreviate other urban places correctly', () => {
      expect(abbreviateTransitLocation('Hospital das Clínicas')).toBe('Hosp. das Clínicas');
      expect(abbreviateTransitLocation('Shopping Morumbi')).toBe('Shp. Morumbi');
      expect(abbreviateTransitLocation('Estação da Luz')).toBe('Est. da Luz');
      expect(abbreviateTransitLocation('Parque do Ibirapuera')).toBe('Pq. do Ibirapuera');
      expect(abbreviateTransitLocation('Jardim Ângela')).toBe('Jd. Ângela');
      expect(abbreviateTransitLocation('Vila Mariana')).toBe('Vl. Mariana');
      expect(abbreviateTransitLocation('Rodoviária Tietê')).toBe('Rodov. Tietê');
      expect(abbreviateTransitLocation('Aeroporto de Congonhas')).toBe('Aerop. de Congonhas');
    });
  });

  describe('expandTransitLocation (mode: "full")', () => {
    it('should expand "Pça. do Avião" or "Pca do Aviao" to "Praça do Avião"', () => {
      expect(expandTransitLocation('Pça. do Avião')).toBe('Praça do Avião');
      expect(expandTransitLocation('Pca do Aviao')).toBe('Praça do Avião');
      expect(expandTransitLocation('praca do aviao')).toBe('Praça do Avião');
    });

    it('should expand "Pça. do Correio" to "Praça do Correio"', () => {
      expect(expandTransitLocation('Pça. do Correio')).toBe('Praça do Correio');
      expect(expandTransitLocation('PÇA. DO CORREIO')).toBe('Praça do Correio');
    });

    it('should expand "Term. São Miguel" to "Terminal São Miguel"', () => {
      expect(expandTransitLocation('Term. São Miguel')).toBe('Terminal São Miguel');
    });

    it('should expand "Av. Paulista" to "Avenida Paulista"', () => {
      expect(expandTransitLocation('Av. Paulista')).toBe('Avenida Paulista');
      expect(expandTransitLocation('AV. PAULISTA')).toBe('Avenida Paulista');
    });

    it('should expand "Hosp. das Clínicas" to "Hospital das Clínicas"', () => {
      expect(expandTransitLocation('Hosp. das Clínicas')).toBe('Hospital das Clínicas');
    });
  });

  describe('formatTransitLocation with default "standard" mode', () => {
    it('should maintain standard transit convention (Term. for Terminal, Praça for Praça)', () => {
      expect(formatTransitLocation('TERMINAL SÃO MIGUEL')).toBe('Term. São Miguel');
      expect(formatTransitLocation('PÇA. DO CORREIO')).toBe('Praça do Correio');
      expect(formatTransitLocation('Praça do Avião')).toBe('Praça do Avião');
      expect(formatTransitLocation('praca do aviao')).toBe('Praça do Avião');
    });

    it('should preserve lowercase prepositions in middle of phrase', () => {
      expect(formatTransitLocation('PARQUE DO IBIRAPUERA')).toBe('Parque do Ibirapuera');
      expect(formatTransitLocation('HOSPITAL DAS CLINICAS')).toBe('Hospital das Clínicas');
      expect(formatTransitLocation('VILA DE SANTA CATARINA')).toBe('Vila de Santa Catarina');
    });

    it('should return empty string for null, undefined or empty input', () => {
      expect(formatTransitLocation('')).toBe('');
      expect(formatTransitLocation(null)).toBe('');
      expect(formatTransitLocation(undefined)).toBe('');
    });
  });
});
