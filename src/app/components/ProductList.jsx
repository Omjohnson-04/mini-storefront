'use client';
import {useEffect, useState} from 'react';
import ProductCard from './ProductCard';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        async function load () {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(data);
        }
        load();
    }, []);

    const handleAdd = (product) => {
        console.log("Add to cart clicked:", product);
    };

    return (
        <div style={{ display: "grid", gap: "1rem" }}>
            {products.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={handleAdd} />
            ))}
        </div>
    );
}