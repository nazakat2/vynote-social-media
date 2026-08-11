'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useShop() {
  const listProducts = async (userId) => {
    let query = supabase.from('shop_products').select('*, profiles:user_id(display_name, username, avatar_url)');
    if (userId) query = query.eq('user_id', userId);
    return query.order('created_at', { ascending: false });
  };

  const addProduct = async ({ title, description, price, image_url, link }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('shop_products').insert({ user_id: user.id, title, description, price, image_url, link });
  };

  const deleteProduct = async (id) => {
    return supabase.from('shop_products').delete().eq('id', id);
  };

  const addToCart = async (productId) => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase.from('shop_cart').upsert({ user_id: user.id, product_id: productId });
  };

  return { listProducts, addProduct, deleteProduct, addToCart };
}

export default function ShopPage({ onClose, addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', link: '' });
  const [filter, setFilter] = useState('All');
  const { listProducts, addProduct, addToCart } = useShop();

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await listProducts();
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newProduct.title.trim() || !newProduct.price) return;
    await addProduct({ ...newProduct, price: parseFloat(newProduct.price) });
    setNewProduct({ title: '', description: '', price: '', link: '' });
    setShowAdd(false);
    loadProducts();
    addToast?.('Product added!');
  };

  const categories = ['All', ...new Set(products.map(p => p.category || 'Other'))];
  const filtered = filter === 'All' ? products : products.filter(p => p.category === filter);

  const isDark = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
  const bg = isDark ? '#1e1e22' : '#ffffff';
  const ink = isDark ? '#e8e8ec' : '#222222';
  const sub = isDark ? '#9a9aa0' : '#8f8f8f';
  const line = isDark ? '#2a2a2e' : '#f0f0f2';
  const chip = isDark ? '#2a2a2e' : '#f5f5f7';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,25,.7)', backdropFilter: 'blur(4px)', zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: 'min(500px,96vw)', maxHeight: '90vh', background: bg, borderRadius: 20, overflow: 'hidden', animation: 'modalIn .25s ease', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: ink, margin: 0 }}>🛒 Shop</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(!showAdd)} style={{ padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: '#ff2442', color: '#fff', border: 'none', cursor: 'pointer' }}>+ Add</button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: sub, background: chip, border: 'none', cursor: 'pointer' }}>x</button>
          </div>
        </div>

        {showAdd && (
          <div style={{ padding: 16, borderBottom: `1px solid ${line}`, background: chip }}>
            <input value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} placeholder="Product name" style={{ width: '100%', height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
            <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} placeholder="Description" rows={2} style={{ width: '100%', borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '8px 12px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input type="number" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="Price" style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, boxSizing: 'border-box' }} />
              <input value={newProduct.link} onChange={e => setNewProduct({ ...newProduct, link: e.target.value })} placeholder="Link (optional)" style={{ flex: 2, height: 38, borderRadius: 8, border: `1px solid ${line}`, background: bg, color: ink, padding: '0 12px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleAdd} disabled={!newProduct.title.trim() || !newProduct.price} style={{ width: '100%', height: 38, borderRadius: 19, background: newProduct.title.trim() && newProduct.price ? '#ff2442' : chip, color: newProduct.title.trim() && newProduct.price ? '#fff' : sub, fontWeight: 600, fontSize: 13, border: 'none', cursor: newProduct.title.trim() && newProduct.price ? 'pointer' : 'not-allowed' }}>
              Add Product
            </button>
          </div>
        )}

        <div style={{ padding: '8px 12px', overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', gap: 6, scrollbarWidth: 'none', borderBottom: `1px solid ${line}` }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600, background: filter === cat ? '#ff2442' : chip, color: filter === cat ? '#fff' : ink, border: 'none', cursor: 'pointer' }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>
              <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🛍️</span>
              No products yet. Add your first item!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {filtered.map(p => (
                <div key={p.id} style={{ background: chip, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ height: 120, background: 'rgba(255,36,66,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏷️'}
                  </div>
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: ink, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: sub, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || 'No description'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#ff2442' }}>${p.price}</span>
                      <button onClick={() => { addToCart(p.id); addToast?.('Added to cart!'); }} style={{ padding: '4px 10px', borderRadius: 8, background: '#ff2442', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
