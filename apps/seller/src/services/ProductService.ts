import { API_URL, SELLER_ID } from '../config';
import { Product } from '../types';

// Helper: Upload file if local URI
const uploadIfNeeded = async (uri: string | null | undefined) => {
    if (!uri || !uri.startsWith('file://')) return uri;
    
    const formData = new FormData();
    formData.append('file', {
        uri: uri,
        name: 'upload.jpg',
        type: 'image/jpeg',
    } as any);

    const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
};

export const ProductService = {
    async fetchProducts(): Promise<Product[]> {
        const res = await fetch(`${API_URL}/products/${SELLER_ID}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        return await res.json();
    },

    async uploadImage(uri: string): Promise<string> {
        return (await uploadIfNeeded(uri)) || "";
    },

    async updateProduct(data: { id: string; title: string; price: string; image: string | null; variants: Product['variants'] }) {
        // 1. Upload Main Image if needed
        let finalMainImage = data.image;
        if (data.image && data.image.startsWith('file://')) {
            finalMainImage = await uploadIfNeeded(data.image);
        }

        // 2. Upload Variant Images if needed
        const processedVariants = await Promise.all(data.variants.map(async (v) => {
             if (v.image_url && v.image_url.startsWith('file://')) {
                 const newUrl = await uploadIfNeeded(v.image_url);
                 return { ...v, image_url: newUrl };
             }
             return v;
        }));

        // 3. Update Product
        const res = await fetch(`${API_URL}/products/${data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: data.title,
                price: parseFloat(data.price),
                image_url: finalMainImage,
                variants: processedVariants
            })
        });

        if (!res.ok) throw new Error("Failed to update product");
        return await res.json();
    },

    async deleteProduct(id: string) {
        const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete product");
        return true;
    }
};
