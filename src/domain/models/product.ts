export interface Product {
  id?: string;
  name: string;
  imageUrl?: string;
  price: number;
  ownerId: string; // reference to user id in domain (string)
  category?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}