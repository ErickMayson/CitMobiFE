export interface Operador {
  cnpj: string;
  razaoSocial: string;
}

export interface User {
  login: string;
  email: string;
  nome: string;
  telefone: string;
  cpf: string;
  role: string;
  operador: Operador;
}
