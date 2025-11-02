'use client';

import {memo} from "react";

function toNum(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function PriceFilter({
    min = 0,
    max = Infinity,
    onChange,
    labelMin = "min $",
    labelMax = "max $",
}) {
    const showMax = Number.isFinite(max) ? String(max) : "";

    return (
        <div>
            <label>
                <span>{labelMin}</span>
                <input
                    type="number"
                    min={0}
                    value={String(min)}
                    onChange={(e) => onChange?.({ min: toNum(e.target.value,  0), max })}
                    aria-label={labelMin}
                />
            </label>
            <label>
                <span>{labelMax}</span>
                <input
                    type="number"
                    min={0}
                    value={showMax}
                    placeholder="infinite"
                    onChange={(e) => {
                        const val = e.target.value;
                        const nextMax = val === "" ? Infinity : toNum(val, Infinity);
                        onChange?.({ min, max: nextMax });
                    }}
                    aria-label={labelMax}
                />
            </label>
        </div>
    );
}

export default memo(PriceFilter);