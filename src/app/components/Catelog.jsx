'use client';

import React, {createContext, useContext, useEffect, useMemo, useReducer, useRef} from "react";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";
import PriceFilter from "./PriceFilter";
import CartSummary from "./CartSummary";

const Ctx = createContext(null);

const initial = {
    products: [],
    loading: false,
    error: null,
    filters: {
        query: "",
        category: "all",
        inStockOnly: false,
        priceMin: 0,
        priceMax: Infinity,
    },
    cart: {},
};

const T = {
    START: "START", OK: "OK", ERR: "ERR",
    SET_FILTERS: "SET_FILTERS",
    ADD: "ADD", SET_QTY: "SET_QTY", REMOVE: "REMOVE", CLEAR: "CLEAR",
    STOCK_PATCH: "STOCK_PATCH",
};

function reducer(s, a) {
    switch (a.type) {
      case T.START: return { ...s, loading: true, error: null };
      case T.OK:    return { ...s, loading: false, error: null, products: a.products };
      case T.ERR:   return { ...s, loading: false, error: a.error };
  
      case T.SET_FILTERS:
        return { ...s, filters: { ...s.filters, ...a.patch } };
  
      case T.ADD: {
        const { product, qty = 1 } = a;
        const cur = s.cart[product.id]?.qty ?? 0;
        const next = Math.min(cur + qty, product.stock ?? Infinity);
        return {
          ...s,
          cart: { ...s.cart, [product.id]: { product, qty: next } },
        };
      }

      case T.SET_QTY: {
        const { id, qty } = a;
        const entry = s.cart[id]; if (!entry) return s;
        const cap = Math.max(0, Math.min(qty, entry.product.stock ?? Infinity));
        const cart = { ...s.cart };
        if (cap === 0) delete cart[id];
        else cart[id] = { ...entry, qty: cap };
        return { ...s, cart };
      }
  
      case T.REMOVE: {
        const cart = { ...s.cart }; delete cart[a.id];
        return { ...s, cart };
      }
  
      case T.CLEAR:
        return { ...s, cart: {} };
  
      case T.STOCK_PATCH: {
        const patch = a.byId; 
        const products = s.products.map(p =>
          patch[p.id] != null ? { ...p, stock: patch[p.id] } : p
        );
        const cart = { ...s.cart };
        for (const id in cart) {
          const ns = patch[id];
          if (ns == null) continue;
          const q = Math.min(cart[id].qty, ns);
          if (q <= 0) delete cart[id];
          else cart[id] = {
            ...cart[id],
            qty: q,
            product: { ...cart[id].product, stock: ns },
          };
        }
        return { ...s, products, cart };
      }
  
      default: return s;
    }
  }
  
  function Provider({ apiBase = "/api", pollMs = 15000, children }) {
    const [state, dispatch] = useReducer(reducer, initial);
    const pollRef = useRef(null);
  
    useEffect(() => {
      const ac = new AbortController();
      (async () => {
        dispatch({ type: T.START });
        try {
          const r = await fetch(`${apiBase}/products`, { signal: ac.signal });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const data = await r.json();
          dispatch({ type: T.OK, products: data });
        } catch (e) {
          if (e.name !== "AbortError") dispatch({ type: T.ERR, error: e.message });
        }
      })();
      return () => ac.abort();
    }, [apiBase]);

    useEffect(() => {
      async function poll() {
        try {
          const r = await fetch(`${apiBase}/stock`);
          if (!r.ok) return;
          const arr = await r.json(); 
          const byId = {};
          for (const { id, stock } of arr) byId[String(id)] = Number(stock);
          dispatch({ type: T.STOCK_PATCH, byId });
        } catch { /* ignore transient errors */ }
      }
  
      if (pollRef.current) clearInterval(pollRef.current);
      poll(); 
      pollRef.current = setInterval(poll, pollMs);
  
      return () => {
        clearInterval(pollRef.current);
        pollRef.current = null;
      };
    }, [apiBase, pollMs]);
  
    const actions = useMemo(() => ({
      setFilters: (patch) => dispatch({ type: T.SET_FILTERS, patch }),
      add: (product, qty = 1) => dispatch({ type: T.ADD, product, qty }),
      setQty: (id, qty) => dispatch({ type: T.SET_QTY, id, qty }),
      remove: (id) => dispatch({ type: T.REMOVE, id }),
      clear: () => dispatch({ type: T.CLEAR }),
    }), []);
  
    const value = useMemo(() => ({ state, ...actions }), [state, actions]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
  }
  
  export function useStore() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useStore must be used inside <Provider>");
    return ctx;
  }
  
  function useFilteredProducts() {
    const { state } = useStore();
    const { products, filters } = state;
  
    return useMemo(() => {
      const q = filters.query.trim().toLowerCase();
      return products.filter(p => {
        const price = Number(p.price ?? 0);
        const titleLike = (p.title ?? p.name)?.toLowerCase() ?? "";
        const catLike = p.category?.toLowerCase() ?? "";
        const qok = !q || titleLike.includes(q) || catLike.includes(q);
        const cok = filters.category === "all" || p.category === filters.category;
        const sok = !filters.inStockOnly || (p.stock ?? 0) > 0;
        const pok = price >= (filters.priceMin ?? 0) && price <= (Number.isFinite(filters.priceMax) ? filters.priceMax : Infinity);
        return qok && cok && sok && pok;
      });
    }, [products, filters]);
  }
  
  function FiltersBar() {
    const { state, setFilters } = useStore();
  
    const categories = useMemo(() => {
      const s = new Set(state.products.map(p => p.category).filter(Boolean));
      return Array.from(s).sort((a, b) => a.localeCompare(b));
    }, [state.products]);
  
    return (
      <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <input
          placeholder="Search…"
          value={state.filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          style={{ flex: "1 1 220px", padding: ".5rem .6rem" }}
          aria-label="Search products"
        />
  
        <CategoryFilter
          categories={categories}
          value={state.filters.category}
          onChange={(category) => setFilters({ category })}
        />
  
        <label style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
          <input
            type="checkbox"
            checked={state.filters.inStockOnly}
            onChange={(e) => setFilters({ inStockOnly: e.target.checked })}
          />
          In stock only
        </label>
  
        <PriceFilter
          min={state.filters.priceMin}
          max={state.filters.priceMax}
          onChange={({ min, max }) => setFilters({ priceMin: min, priceMax: max })}
        />
      </div>
    );
  }
  
  function ProductGrid() {
    const filtered = useFilteredProducts();
    const { state, add } = useStore();
  
    if (state.loading) return <p>Loading…</p>;
    if (state.error) return <p style={{ color: "crimson" }}>Error: {state.error}</p>;
    if (!filtered.length) return <p>No products match your filters.</p>;
  
    return (
      <div style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      }}>
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={() => add(p, 1)} />
        ))}
      </div>
    );
  }
  
  function CartPanel() {
    const { state, setQty, remove, clear } = useStore();
    const entries = Object.values(state.cart);
  
    const total = useMemo(
      () => entries.reduce((sum, { product, qty }) => sum + (Number(product.price ?? 0) * qty), 0),
      [entries]
    );
  
    return (
      <aside style={{ border: "1px solid #eee", borderRadius: 10, padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0 }}>Cart</h3>
          <button onClick={clear} disabled={!entries.length}>Clear</button>
        </div>
  
        {!entries.length ? (
          <p style={{ color: "#666" }}>Your cart is empty.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "0.75rem 0", display: "grid", gap: ".5rem" }}>
            {entries.map(({ product, qty }) => (
              <li key={product.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: ".5rem" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{product.title}</div>
                  <small style={{ color: "#666" }}>
                    ${Number(product.price ?? 0).toFixed(2)} • stock {product.stock}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
                  <input
                    type="number"
                    min={0}
                    max={product.stock}
                    value={qty}
                    onChange={(e) => setQty(product.id, Number(e.target.value))}
                    style={{ width: 64, padding: ".3rem .4rem" }}
                    aria-label={`Quantity for ${product.title}`}
                  />
                  <button onClick={() => remove(product.id)} aria-label={`Remove ${product.title}`}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
  
        <CartSummary />
        
        <hr />
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </aside>
    );
  }
  
  export default function Catelog({ apiBase = "/api", pollMs = 15000 }) {
    return (
      <Provider apiBase={apiBase} pollMs={pollMs}>
        <div style={{
          maxWidth: 1080,
          margin: "2rem auto",
          padding: "0 1rem",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}>
          <h1 style={{ margin: 0 }}>Catalog</h1>
          <p style={{ marginTop: 4, color: "#666" }}>Shared filters & cart • Live stock polling</p>
  
          <FiltersBar />
  
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.25rem", alignItems: "start" }}>
            <ProductGrid />
            <CartPanel />
          </div>
        </div>
      </Provider>
    );
  }