'use client';

'use client';

import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../../config';

const styles = {
  // ... existing styles ...
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,

  // Gallery Styles
  galleryContainer: {
    display: 'flex',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    gap: '16px',
    paddingBottom: '16px',
    marginBottom: '8px',
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE/Edge
    // cursor: 'grab' // Optional
  } as React.CSSProperties,

  galleryItem: {
    flex: '0 0 auto',
    width: '280px', // Fixed width or relative
    height: '350px',
    borderRadius: '16px',
    overflow: 'hidden',
    scrollSnapAlign: 'center',
    position: 'relative',
    border: '1px solid #E5E7EB',
  } as React.CSSProperties,

  galleryImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as React.CSSProperties,

  // ... rest of styles
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'right',
  } as React.CSSProperties,
  // ... rest of existing styles ...
  label: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#374151',
    marginRight: '4px',
  } as React.CSSProperties,

  input: {
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #E5E7EB', // Thicker border
    fontSize: '16px',
    color: '#111827', // Fix: Make text visible
    textAlign: 'right',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundColor: '#F9FAFB',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  // Special "Zone" for File Upload
  uploadZone: {
    border: '2px dashed #C7D2FE', // Light Purple Dashed
    backgroundColor: '#EEF2FF',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  } as React.CSSProperties,

  uploadLabel: {
    display: 'block',
    color: '#4F46E5',
    fontWeight: '700',
    marginBottom: '8px',
    cursor: 'pointer',
  } as React.CSSProperties,

  fileInput: {
    display: 'none', // Hide default ugly input
  } as React.CSSProperties,

  fileName: {
    display: 'block',
    marginTop: '8px',
    fontSize: '13px',
    color: '#059669', // Emerald Green
    fontWeight: '600',
  } as React.CSSProperties,

  button: {
    width: '100%',
    backgroundColor: '#111827', // Dark
    color: 'white',
    padding: '18px',
    borderRadius: '14px',
    border: 'none',
    fontSize: '18px',
    fontWeight: '800',
    cursor: 'pointer',
    marginTop: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.1s',
  } as React.CSSProperties,

  error: {
    color: '#EF4444',
    fontSize: '14px',
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    padding: '12px',
    borderRadius: '8px',
  } as React.CSSProperties,

  // Success State
  successCard: {
    textAlign: 'center',
    padding: '40px 0',
  } as React.CSSProperties,
  successIcon: {
    fontSize: '64px',
    marginBottom: '24px',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#111827',
    marginBottom: '8px',
  } as React.CSSProperties,
  orderNum: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: '16px',
    backgroundColor: '#EEF2FF',
    display: 'inline-block',
    padding: '8px 24px',
    borderRadius: '12px',
  } as React.CSSProperties,
  successText: {
    color: '#6B7280',
    fontSize: '16px',
    lineHeight: '1.5',
    successIcon: {
        fontSize: '64px',
        marginBottom: '24px',
      } as React.CSSProperties,
    } as React.CSSProperties,

  // Variants Styles
  variantContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'flex-end', // RTL alignment usually
  } as React.CSSProperties,

  variantPill: {
    padding: '10px 20px',
    borderRadius: '999px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    color: '#374151',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    transition: 'all 0.1s',
  } as React.CSSProperties,

  variantPillActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    borderWidth: '2px', // Ensure border remains
  } as React.CSSProperties,
};

interface OrderFormProps {
  refTag: string;
  sellerName: string;
  variants: {
    id: string;
    color: string;
    size: string;
    stock: number;
    image_url?: string | null;
  }[];
  initialColor?: string;
  initialSize?: string;
}

interface OrderResponse {
    human_id: number;
}

// Simple placeholder image if no URL
const PLACEHOLDER_IMG = "https://via.placeholder.com/400x400?text=No+Image";

export default function OrderForm({ refTag, sellerName, variants, initialColor, initialSize }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [file, setFile] = useState<File | null>(null);

  // Gallery Refs
  const galleryRef = useRef<HTMLDivElement>(null);



  // 0. Prepare Gallery Images
  // We want: [First valid image found, then unique images for each color]
  // Actually, simplified approach: Unique images per color.
  // We should extract one image per Color.
  const galleryImages = variants.reduce((acc, v) => {
     if (v.image_url && !acc.some(img => img.color === v.color)) {
         acc.push({ color: v.color, url: v.image_url });
     }
     return acc;
  }, [] as { color: string, url: string }[]);

  // If no variant images, maybe we show nothing or main product?
  // Let's assume we want to show ALL unique images available.
  

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Color/Size Selection State
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Auto-select from URL params (deep link)
  useEffect(() => {
    if (initialColor) setSelectedColor(initialColor);
    if (initialSize) setSelectedSize(initialSize);
  }, [initialColor, initialSize]);

  // Extract unique colors and sizes
  const uniqueColors = [...new Set(variants.map(v => v.color))];
  const uniqueSizes = [...new Set(variants.map(v => v.size))];

  // Sync Gallery Scroll
  useEffect(() => {
    if (selectedColor && galleryRef.current) {
      // Find index of image with this color
      const index = galleryImages.findIndex(img => img.color === selectedColor);
      if (index !== -1) {
        galleryRef.current.scrollTo({
          left: index * 296, // width (280) + gap (16) approx
          behavior: 'smooth'
        });
      }
    }
  }, [selectedColor, galleryImages]);




  // Helper: Check if a color+size combination is available with stock
  const isAvailable = (color: string, size: string): boolean => {
    const variant = variants.find(v => v.color === color && v.size === size);
    return variant ? variant.stock > 0 : false;
  };

  // Helper: Check if color has ANY available sizes
  const colorHasStock = (color: string): boolean => {
    return variants.some(v => v.color === color && v.stock > 0);
  };

  // Helper: Check if size has ANY available colors
  const sizeHasStock = (size: string): boolean => {
    return variants.some(v => v.size === size && v.stock > 0);
  };

  // Find matching variant
  const matchedVariant = variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  // Auto-reset size if color changes and combination is invalid
  const handleColorSelect = (color: string) => {
    // Toggle: if clicking the same color, deselect it
    if (selectedColor === color) {
      setSelectedColor('');
      setSelectedSize(''); // Reset size too
      return;
    }
    
    setSelectedColor(color);
    
    // 1. Reset if current size invalid for new color
    const combinationExists = variants.some(v => v.color === color && v.size === selectedSize);
    if (selectedSize && !combinationExists) {
      setSelectedSize('');
    }

    // 2. Auto-Select Size if only one option exists and has stock
    // Find all valid sizes for this new color
    const availableSizes = uniqueSizes.filter(size => {
        const v = variants.find(variant => variant.color === color && variant.size === size);
        return v && v.stock > 0;
    });

    if (availableSizes.length === 1) {
        setSelectedSize(availableSizes[0]);
    }
  };

  // Auto-reset color if size changes and combination is invalid
  const handleSizeSelect = (size: string) => {
    // Toggle: if clicking the same size, deselect it
    if (selectedSize === size) {
      setSelectedSize('');
      setSelectedColor(''); // Reset color too
      return;
    }
    
    setSelectedSize(size);
    
    // 1. Reset if current color invalid for new size
    const combinationExists = variants.some(v => v.color === selectedColor && v.size === size);
    if (selectedColor && !combinationExists) {
      setSelectedColor('');
    }

    // 2. Auto-Select Color if only one option exists and has stock
    // Find all valid colors for this new size
    const availableColors = uniqueColors.filter(color => {
        const v = variants.find(variant => variant.color === color && variant.size === size);
        return v && v.stock > 0;
    });

    if (availableColors.length === 1) {
        setSelectedColor(availableColors[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    // VALIDATION
    if (variants && variants.length > 0 && (!selectedColor || !selectedSize)) {
        alert("Please select both color and size");
        return;
    }

    if (matchedVariant && matchedVariant.stock < 1) {
        alert("Sorry, this variant is out of stock!");
        return;
    }
    
    if (!selectedColor || !selectedSize) {
      alert('Please select color and size');
      return;
    }
    
    if (!matchedVariant) {
        alert('Variant not found');
        return;
    }

    setStatus('submitting');
    
    try {
      // 1. Upload Payment Proof if exists
      let paymentProofUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`${API_URL}/upload`, {
             method: 'POST',
             body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) paymentProofUrl = uploadData.url;
      }

      // 2. Submit Order
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refTag,
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          variantId: matchedVariant.id, // Pass the variant ID!
          paymentProof: paymentProofUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      setOrderId(data.human_id);
      setStatus('success');
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      alert(error.message);
    }
  };

  if (status === 'success') {
    return (
      <div style={styles.successCard}>
        <div style={styles.successIcon}>🎉</div>
        <h3 style={styles.successTitle}>تم استلام طلبك بنجاح!</h3>
        <p style={styles.orderNum}>رقم الطلب: #{orderId}</p>
        <p style={styles.successText}>سيتواصل معك التاجر لتأكيد الطلب قريبًا.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      




      
      {/* 0. GALLERY CAROUSEL */}
      {galleryImages.length > 0 && (
        <div style={styles.galleryContainer} ref={galleryRef}>
          {galleryImages.map((img, idx) => (
             <div key={`${img.color}-${idx}`} style={styles.galleryItem}>
                {img.url ? (
                  <img src={img.url} alt={img.color} style={styles.galleryImage} />
                ) : (
                  <div style={{...styles.galleryImage, backgroundColor: '#eee'}} />
                )}
                {/* Optional Tag */}
                <span style={{
                   position: 'absolute', 
                   bottom: 8, 
                   right: 8, 
                   background: 'rgba(0,0,0,0.6)', 
                   color: 'white', 
                   padding: '4px 8px', 
                   borderRadius: 8,
                   fontSize: 12
                }}>
                  {img.color}
                </span>
             </div>
          ))}
        </div>
      )}

      {/* 1. COLOR & SIZE SELECTORS */}
      {variants && variants.length > 0 && (
        <div>
          {/* Color Selector */}
          <div style={styles.field}>
            <label style={styles.label}>اختر اللون / Select Color</label>
            <div style={styles.variantContainer}>
              {uniqueColors.map(color => {
                // Check stock availability
                const isVariantAvailable = selectedSize 
                  ? isAvailable(color, selectedSize)
                  : colorHasStock(color);
                
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    style={{
                      ...styles.variantPill,
                      ...(selectedColor === color ? styles.variantPillActive : {}),
                      ...(!isVariantAvailable ? {
                        opacity: 0.5,
                        backgroundColor: '#F3F4F6',
                        borderColor: '#E5E7EB',
                        color: '#9CA3AF',
                        cursor: 'not-allowed'
                      } : {})
                    }}
                    disabled={!isVariantAvailable}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div style={styles.field}>
            <label style={styles.label}>اختر المقاس / Select Size</label>
            <div style={styles.variantContainer}>
              {uniqueSizes.map(size => {
                // Check stock availability
                const isVariantAvailable = selectedColor 
                  ? isAvailable(selectedColor, size)
                  : sizeHasStock(size);
                
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeSelect(size)}
                    style={{
                      ...styles.variantPill,
                      ...(selectedSize === size ? styles.variantPillActive : {}),
                      ...(!isVariantAvailable ? {
                        opacity: 0.5,
                        backgroundColor: '#F3F4F6',
                        borderColor: '#E5E7EB',
                        color: '#9CA3AF',
                        cursor: 'not-allowed'
                      } : {})
                    }}
                    disabled={!isVariantAvailable}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Warning */}
          {selectedColor && selectedSize && matchedVariant && matchedVariant.stock < 1 && (
            <div style={{...styles.error, marginTop: '10px'}}>
              ⚠️ هذا المنتج غير متوفر / This variant is out of stock!
            </div>
          )}
        </div>
      )}

      {/* 2. NAME */}
      <div style={styles.field}>
        <label style={styles.label}>الاسم</label>
        <input
          type="text"
          required
          style={styles.input}
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="أحمد محمد"
        />
      </div>

      {/* 3. PHONE */}
      <div style={styles.field}>
        <label style={styles.label}>رقم الهاتف</label>
        <input
          type="tel"
          required
          style={styles.input}
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          placeholder="01xxxxxxxxx"
        />
      </div>

      {/* 4. ADDRESS */}
      <div style={styles.field}>
        <label style={styles.label}>العنوان</label>
        <input
          type="text"
          required
          style={styles.input}
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          placeholder="القاهرة، مدينة نصر..."
        />
      </div>

      {/* 5. FILE UPLOAD */}
      <div style={styles.uploadZone}>
        <label htmlFor="file-upload" style={styles.uploadLabel}>
          📸 إرفاق صورة إيصال الدفع (اختياري)
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          style={styles.fileInput}
        />
        {file && <span style={styles.fileName}>{file.name} ✅</span>}
      </div>

      {status === 'error' && (
        <div style={styles.error}>
          حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        style={{...styles.button, opacity: status === 'submitting' ? 0.7 : 1}}
      >
        {status === 'submitting' ? 'جاري الإرسال...' : 'إتمام الطلب'}
      </button>
    </form>
  );
}
