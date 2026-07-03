"use client";

import { useState, useMemo } from "react";

export function useFilter(data) {
  const [search, setSearch] = useState("");
  const [aktivasiFilter, setAktivasiFilter] = useState("");

  const filteredUsers = useMemo(() => {
    let filtered = data;

    if (aktivasiFilter === 'aktif') {
      filtered = filtered.filter(user => user.is_active === true || user.is_active === 1);
    } else if (aktivasiFilter === 'nonaktif') {
      filtered = filtered.filter(user => user.is_active === false || user.is_active === 0);
    }

    if (search) {
      filtered = filtered.filter((user) =>
        user.nama?.toLowerCase().includes(search.toLowerCase()) ||
        user.jabatan?.toLowerCase().includes(search.toLowerCase()) ||
        user.wilayah_penugasan?.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [data, search, aktivasiFilter]);

  const handleResetFilters = () => {
    setAktivasiFilter('');
    setSearch('');
  };

  return {
    search,
    setSearch,
    aktivasiFilter,
    setAktivasiFilter,
    filteredUsers,
    handleResetFilters
  };
}