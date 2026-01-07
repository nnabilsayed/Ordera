export interface Product {
  id: string;
  title: string;
  base_price: string;
  image_url?: string | null;
  variants: { id: string; name: string; stock: number; color: string; size: string; image_url?: string | null }[];
  link_refs?: { ref_tag: string }[];
}

export interface Order {
  id: string;
  human_id: number;
  total_amount: string;
  status: string;
  created_at: string;
  payment_proof_url?: string | null;
  customer: {
    full_name: string;
    phone: string;
    address: string;
  };
  link_ref?: {
    ref_tag: string;
    product: { title: string };
  };
  items?: {
    id: string;
    product_id: string;
    variant_id?: string;
    quantity: number;
    unit_price: string;
  }[];
  variant?: {
    name: string;
  };
}
