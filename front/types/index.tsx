// type para cliente
export interface Customer {
  customer_name: string;
  surname: string;
  nickname: string;
  cpf: string;
  phone: string;
  email: string;
  address: string;
  emergency_phone: string;
  emergency_name: string;
  emergency_relationship: string;
  birth_date: string;
  base_image_url: string;
  created_at?: string;
  updated_at?: string;
}
