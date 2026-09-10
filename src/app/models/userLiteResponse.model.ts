export interface Operador {
  id?: number;
  cnpj: string;
  razaoSocial: string;
  flagRegulador?: string;
}

export interface UsuarioAcesso {
  id?: number;
  usuarioId?: string;
  glbMunicipioCod?: number;
  glbUfCod?: number;
}

export interface User {
  id?: string;
  login: string;
  email: string;
  nome: string;
  telefone: string;
  cpf: string;
  role: string;
  operador?: Operador;
  acessos?: UsuarioAcesso[];
}

