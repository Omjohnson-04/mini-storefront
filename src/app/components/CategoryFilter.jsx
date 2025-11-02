'use client'

import {memo, useMemo} from 'react';

function CategoryFilter({categories = [], value = "all", onChange, label = "Category" }) {
    const options = useMemo(() => {
        const set = new Set(categories.filter(Boolean));
        const rest = Array.from(set).sort((a, b) => a.localeCompare(b));
        return ["all", ...rest];
    }, [categories]);

    return (
        <label>
            <span>{label}</span>
            <select
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                aria-label={label}
            >
                {options.map((c) => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </label>
    );
}

export default memo(CategoryFilter);