export interface Endereco {
  id?: number;
  nome: string;
  endereco: string;
  cep?: string;
  lat: number;
  lng: number;
  ordem?: number;
}
