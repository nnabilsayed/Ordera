'use client';

import { useState } from 'react';

const styles = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign: 'right',
  } as React.CSSProperties,

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
    border: '2px solid #E5E7EB',
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
  variants: { id: string; name: string }[];
}

interface OrderResponse {
    human_id: number;
}

export default function OrderForm({ refTag, sellerName, variants }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Variant State
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // VALIDATION
    if (variants && variants.length > 0 && !selectedVariantId) {
        alert("Please select a size/variant");
        return;
    }

    setStatus('submitting');

    try {
      const data = new FormData();
      data.append('refTag', refTag);
      data.append('customerName', formData.name);
      data.append('customerPhone', formData.phone);
      data.append('customerAddress', formData.address);
      
      if (selectedVariantId) {
          data.append('variantId', selectedVariantId);
      }

      if (file) {
        data.append('paymentProof', file);
      }

      // Use LAN IP for external device support
      // Note: In production this should be an env var or relative path
      const res = await fetch('http://192.168.1.2:3001/orders', {
        method: 'POST',
        body: data, // FormData sets Content-Type automatically
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to create order');
      }

      setOrderId(responseData.human_id);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
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
      
      {/* 1. VARIANT SELECTOR */}
      {variants && variants.length > 0 && (
            <div style={styles.field}>
                <label style={styles.label}>Select Size / تحديد المقاس</label>
                <div style={styles.variantContainer}>
                    {variants.map(v => (
                        <button
                            key={v.id}
                            type="button" // Prevent form submit
                            onClick={() => setSelectedVariantId(v.id)}
                            style={{
                                ...styles.variantPill,
                                ...(selectedVariantId === v.id ? styles.variantPillActive : {})
                            }}
                        >
                            {v.name}
                        </button>
                    ))}
                </div>
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
