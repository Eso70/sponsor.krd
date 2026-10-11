"use client";
import React from "react";
// 1. Memoized Country Button Component to prevent unnecessary re-renders
// Uses transform-gpu and content-visibility for maximum scrolling performance
export const CountrySelectorOption = React.memo(
  ({
    country,
    isSelected,
    onClick,
  }: {
    country: { code: string; name: string };
    isSelected: boolean;
    onClick: (code: string) => void;
  }) => {
    return (
      <button
        type="button"
        onClick={() => onClick(country.code)}
        className={`w-full px-4 py-3 text-left text-sm transition-all duration-300 rounded-xl transform-gpu ${
          isSelected
            ? "theme-fill border-l-4 border-transparent font-semibold text-[var(--theme-ink)] shadow-md"
            : "text-slate-600 dark:text-gray-300 hover:bg-linear-to-r hover:from-slate-50 hover:to-gray-50 hover:text-slate-700 dark:hover:from-[#161B22] dark:hover:to-[#161B22] dark:hover:text-gray-150"
        }`}
        style={{ contentVisibility: "auto", containIntrinsicSize: "46px" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-base">+{country.code}</span>
          <span className="text-slate-500 text-sm truncate flex-1 text-left">
            {country.name}
          </span>
        </div>
      </button>
    );
  },
);

CountrySelectorOption.displayName = "CountrySelectorOption";
