'use client';

export default function ProductCard({ product, onAdd }) {
    return (
        <div>
            <h3>{product.title ?? product.name}</h3>
                <p>${product.price}</p>
            {product.stock !== undefined && (
            <small>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
            </small>
            )}

            <button
                onClick={() => onAdd?.(product)}
                disabled={product.stock === 0}
            >
                Add to Cart
            </button>
        </div>
    );
}