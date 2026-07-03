"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export function useFilters(onFilterChange) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [wilayahFilter, setWilayahFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
    }
  }, []);

  useEffect(() => {
    if (user?.wilayah_penugasan) {
      console.log('Setting wilayah filter dari user:', user.wilayah_penugasan);
      setWilayahFilter(user.wilayah_penugasan);
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedDate) {
      const params = {};
      
      if (wilayahFilter) {
        params.wilayah = wilayahFilter;
      } else if (user?.wilayah_penugasan) {
        params.wilayah = user.wilayah_penugasan;
      }
      
      if (selectedDate) params.tanggal = selectedDate;
      if (search) params.search = search;
      
      console.log('Filter params dikirim:', params);
      onFilterChange(params);
    }
  }, [wilayahFilter, selectedDate, search, user, onFilterChange]);

  const handleResetFilters = useCallback(() => {
    if (user?.wilayah_penugasan) {
      setWilayahFilter(user.wilayah_penugasan);
    } else {
      setWilayahFilter('');
    }
    
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    setSearch('');
  }, [user]);

  const handleRefresh = useCallback(() => {
    const params = {};
    
    if (wilayahFilter) {
      params.wilayah = wilayahFilter;
    } else if (user?.wilayah_penugasan) {
      params.wilayah = user.wilayah_penugasan;
    }
    
    if (selectedDate) params.tanggal = selectedDate;
    if (search) params.search = search;
    
    console.log('Refreshing with filters:', params);
    onFilterChange(params);
  }, [wilayahFilter, selectedDate, search, user, onFilterChange]);

  const hasActiveFilters = useMemo(() => {
    let hasFilters = false;
    
    const defaultWilayah = user?.wilayah_penugasan || '';
    if (wilayahFilter && wilayahFilter !== defaultWilayah) {
      hasFilters = true;
    }
    
    if (search) hasFilters = true;
    
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate && selectedDate !== today) hasFilters = true;
    
    return hasFilters;
  }, [wilayahFilter, search, selectedDate, user]);

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
    handleResetFilters,
    handleRefresh,
    hasActiveFilters,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    user
  };
}