"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export function useFilters(onFilterChange) {
  const [search, setSearch] = useState("");
  const [wilayahFilter, setWilayahFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulanFilter, setBulanFilter] = useState("");
  const [tahunFilter, setTahunFilter] = useState(new Date().getFullYear());

  useEffect(() => {
    const params = {};
    if (wilayahFilter) params.wilayah = wilayahFilter;
    if (selectedDate) params.tanggal = selectedDate;
    if (bulanFilter) params.bulan = bulanFilter;
    if (tahunFilter) params.tahun = tahunFilter;
    
    console.log('Filter params dikirim:', params);
    onFilterChange(params);
  }, [wilayahFilter, selectedDate, bulanFilter, tahunFilter, onFilterChange]);

  const handleResetFilters = useCallback(() => {
    setWilayahFilter('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setBulanFilter('');
    setTahunFilter(new Date().getFullYear());
    setSearch('');
  }, []);

  const hasActiveFilters = useMemo(() => 
    wilayahFilter || search || selectedDate !== new Date().toISOString().split('T')[0],
    [wilayahFilter, search, selectedDate]
  );

  const goToPreviousDay = useCallback(() => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  }, [selectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }, []);

  return {
    search,
    setSearch,
    wilayahFilter,
    setWilayahFilter,
    selectedDate,
    setSelectedDate,
    bulanFilter,
    setBulanFilter,
    tahunFilter,
    setTahunFilter,
    handleResetFilters,
    hasActiveFilters,
    goToPreviousDay,
    goToNextDay,
    goToToday
  };
}