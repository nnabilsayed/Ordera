import React from 'react';
import OrderForm from './OrderForm';
import { API_URL } from '../../config';

// Force dynamic rendering since we are fetching based on params
export const dynamic = 'force-dynamic';

async function getLinkDetails(refTag: string) {
  // Try 127.0.0.1 to avoid Windows localhost resolution issues
  const apiUrl = `${API_URL}/links/${refTag}`;
  console.log(`[Buyer App] Fetching: ${apiUrl}`);
  
  try {
    const res = await fetch(apiUrl, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      console.error(`[Buyer App] API Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error(`[Buyer App] API Response: ${text}`);
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error(`[Buyer App] Network Error:`, error);
    return null;
  }
}

// Next.js 15+ / 16: params is a Promise
export default async function PayPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ refTag: string }>,
  searchParams: Promise<{ color?: string, size?: string }>
}) {
  const { refTag } = await params;
  const search = await searchParams;
  const data = await getLinkDetails(refTag);

  if (!data) {
    return (
      <div style={styles.container}>
        <h1 style={styles.error}>الرابط غير صالح أو انتهت صلاحيته</h1>
      </div>
    );
  }

  const { product, seller } = data;

  return (
    <div style={styles.container} dir="rtl">
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.badge}>طلب جديد</span>
          <h2 style={styles.sellerName}>{seller.businessName}</h2>
        </div>

        <div style={styles.productSection}>
          <h1 style={styles.productTitle}>{product.title}</h1>
          <div style={styles.priceContainer}>
            <span style={styles.currency}>ج.م</span>
            <span style={styles.price}>{product.price}</span>
          </div>
          {product.isPriceLocked && (
            <div style={styles.lockedTag}>🔒 سعر مثبت</div>
          )}
        </div>

        <div style={styles.divider}></div>

        <OrderForm 
            refTag={refTag} 
            sellerName={seller.businessName} 
            variants={product.variants || []}
            initialColor={search.color}
            initialSize={search.size}
        />

        <p style={styles.footer}>
          رقم هذا العرض: #{refTag}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F9FAFB', // Clean Off-White
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit', // Inherit Cairo
    padding: '20px',
  } as React.CSSProperties,
  
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    textAlign: 'right',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  } as React.CSSProperties,

  sellerName: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '600',
    margin: 0,
  } as React.CSSProperties,

  badge: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5', // Primary Brand Color
    fontSize: '12px',
    padding: '6px 16px',
    borderRadius: '9999px',
    fontWeight: '700',
  } as React.CSSProperties,

  productSection: {
    marginBottom: '40px',
  } as React.CSSProperties,

  productTitle: {
    fontSize: '28px',
    fontWeight: '800', // Cairo Bold
    color: '#111827',
    marginBottom: '16px',
    lineHeight: '1.3',
  } as React.CSSProperties,

  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  } as React.CSSProperties,

  currency: {
    fontSize: '18px',
    color: '#6B7280',
    fontWeight: '600',
  } as React.CSSProperties,

  price: {
    fontSize: '42px',
    fontWeight: '900',
    color: '#4F46E5', // Primary
    letterSpacing: '-1px',
  } as React.CSSProperties,

  lockedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    padding: '4px 12px',
    borderRadius: '8px',
    fontWeight: '600',
  } as React.CSSProperties,

  divider: {
    height: '1px',
    backgroundColor: '#F3F4F6',
    marginBottom: '32px',
  } as React.CSSProperties,

  footer: {
    marginTop: '32px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#9CA3AF',
  } as React.CSSProperties,

  error: {
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: 'bold',
  } as React.CSSProperties
};
