"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

export function FilterSection({
  selectedMonth,
  selectedYear,
  searchTerm,
  availableYears,
  onMonthChange,
  onYearChange,
  onSearchChange
}) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString().padStart(2, '0'), // Format jadi 2 digit (01, 02, dst)
    label: new Date(2000, i).toLocaleDateString('id-ID', { month: 'long' })
  }));

  // Pastikan selectedMonth dalam format yang benar (string 2 digit)
  const currentMonth = selectedMonth?.toString().padStart(2, '0');
  const currentYear = selectedYear?.toString();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex gap-4 flex-1">
        <div className="flex-1">
          <select
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <select
            value={currentYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {availableYears.length > 0 ? (
              availableYears.map(year => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))
            ) : (
              <>
                <option value={new Date().getFullYear().toString()}>
                  {new Date().getFullYear()}
                </option>
                <option value={(new Date().getFullYear() - 1).toString()}>
                  {new Date().getFullYear() - 1}
                </option>
              </>
            )}
          </select>
        </div>
      </div>
      
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama pegawai atau jabatan..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>
    </div>
  );
}