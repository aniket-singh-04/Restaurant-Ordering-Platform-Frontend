export interface AddOn {
  id: string;
  name: string;
  price: number;
}

export interface multiImage{
  altText: string;
  isPrimary: boolean;
  mimeType: string;
  s3Key: string;
  sizeBytes: number;
  url: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  images: multiImage[];
  category: string;
  isVeg: boolean;
  isSpicy: boolean;
  rating: number;
  avgRating?: number;
  totalRatings?: number;
  myRating?: number | null;
  prepTime: string;
  addOns: AddOn[];
  has3DModel: boolean;
}

export interface MenuCardProps {
  item: MenuItem;
  index: number;
}
