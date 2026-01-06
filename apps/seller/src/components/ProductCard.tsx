import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, Alert } from 'react-native';
import { Product } from '../types';
import { THEME, getAccessibleUrl } from '../utils';
import { WEB_URL, API_URL, SELLER_ID } from '../config';

interface ProductCardProps {
  item: Product;
  onOpenGallery: (item: Product) => void;
  onInfoPress: (item: Product) => void;
  onEditPress: (item: Product) => void;
  onDeletePress: (id: string) => void;
  onRefresh: () => void; // For refreshing data after generating link
}

export const ProductCard = ({ item, onOpenGallery, onInfoPress, onEditPress, onDeletePress, onRefresh }: ProductCardProps) => {

  // Smart Share: General or Specific Variant
  const shareProduct = async (product: Product) => {
    try {
        let refTag = product.link_refs?.[0]?.ref_tag;

        // If no link exists yet, generate it on the fly
        if (!refTag) {
             const res = await fetch(`${API_URL}/links/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sellerId: SELLER_ID,
                  productId: product.id,
                  isPriceLocked: false
                }),
              });
              const data = await res.json();
              if (data.refTag) {
                  refTag = data.refTag;
                  onRefresh(); // Sync local state for next time
              }
        }

        if (!refTag) {
             Alert.alert("Error", "Could not generate link");
             return;
        }

        // Check if product has variants to determine share mode
        const hasVariants = product.variants && product.variants.length > 0;

        if (!hasVariants) {
             // Simple Share for single product
             Share.share({ message: `${WEB_URL}/pay/${refTag}`, title: product.title });
             return;
        }

        // If we have variants AND a refTag, show options
        Alert.alert("Share Options", "Choose type:", [
          { text: "General", onPress: () => Share.share({ message: `${WEB_URL}/pay/${refTag}` }) },
          { text: "Specific", onPress: () => {
              Alert.alert("Select Variant", "Pick one:", product.variants.map(v => ({
                text: `${v.color} - ${v.size}`,
                onPress: () => Share.share({ message: `${WEB_URL}/pay/${refTag}?color=${encodeURIComponent(v.color)}&size=${encodeURIComponent(v.size)}` })
              })).concat([{ text: "Cancel", style: "cancel" } as any]));
            }
          },
          { text: "Cancel", style: "cancel" }
        ]);

    } catch (error: any) {
        Alert.alert("Share Error", error.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row' }}>
         {/* 1. Main Image */}
         {/* Use first variant image or placeholder */}
         <TouchableOpacity onPress={() => onOpenGallery(item)}>
            <Image 
                source={{ uri: getAccessibleUrl(item.image_url || item.variants?.[0]?.image_url) || 'https://via.placeholder.com/150' }} 
                style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#eee' }} 
            />
         </TouchableOpacity>
         
         <View style={{ flex: 1, marginLeft: 15, justifyContent: 'center' }}>
           {/* 2. Title & Price */}
           <Text style={{ fontSize: 18, fontWeight: 'bold', color: THEME.text }}>{item.title}</Text>
           <Text style={{ fontSize: 16, color: THEME.primary, marginTop: 4, fontWeight: '600' }}>{item.base_price} EGP</Text>
           
           {/* 3. Variant Count */}
           <Text style={{ color: 'gray', fontSize: 12, marginTop: 4 }}>
             {item.variants ? `${item.variants.length} Variants` : 'No variants'}
           </Text>
         </View>
      </View>

      {/* 4. Buttons Row */}
      <View style={{ flexDirection: 'row', marginTop: 15, justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }}>
         {/* Share Button (Acting as primary action) */}
         <TouchableOpacity 
            onPress={() => shareProduct(item)} 
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}
         >
           <Text style={{ color: THEME.primary, fontWeight: '600' }}>Share Link 🔗</Text>
         </TouchableOpacity>

         {/* Icons Row */}
         <View style={{ flexDirection: 'row', gap: 15 }}>
           {/* Info */}
           <TouchableOpacity onPress={() => onInfoPress(item)}>
             <Text style={{ fontSize: 22 }}>ℹ️</Text>
           </TouchableOpacity>
           
           {/* Edit */}
           <TouchableOpacity onPress={() => onEditPress(item)}>
             <Text style={{ fontSize: 22 }}>✏️</Text>
           </TouchableOpacity>

           {/* Delete */}
           <TouchableOpacity onPress={() => onDeletePress(item.id)}>
             <Text style={{ fontSize: 22 }}>🗑</Text>
           </TouchableOpacity>
         </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: THEME.border,
  }
});
