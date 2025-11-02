'use client';

import {memo,useMemo} from "react";
import {useStore} from "./Catelog";

function CartSummary() {
    const {state} = useStore();
    const entries = Object.values(state.cart);

    const {itemCount, total} = useMemo(() => {
        return entries.reduce(
            (acc, {product, qty}) => {
                acc.itemCount += qty;
                acc.total += Number(product.price ?? 0) * qty;
                return acc;
            },
            {itemCount: 0, total: 0}
        );

    }, [entries]);

    return (
        <div>
            <div>
                <span>Items:</span>
                <strong>{itemCount}</strong>
            </div>
            <div>
                <span>Total:</span>
                <strong>${total.toFixed(2)}</strong>
            </div>
            <button disabled={!itemCount}>
                Checkout
            </button>
        </div>
    );
}

export default memo(CartSummary);