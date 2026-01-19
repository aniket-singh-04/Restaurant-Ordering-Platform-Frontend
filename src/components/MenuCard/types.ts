export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  topView?: string;
  frontView?: string;
  angleView?: string;
  category: string;
  isVeg: boolean;
  isSpicy: boolean;
  rating: number;
  prepTime: string;
  addOns: AddOn[];
  has3DModel: boolean;
}

export interface MenuCardProps {
  item: MenuItem;
  index: number;
}
