'use client';
import ProtectedRoute from '@/components/ProtectedRoute';

import GrafikKehadiran from '@/components/atasan/rekapKehadiran';

export default function ManajemenHariPage() {
  return (
    <ProtectedRoute allowedRoles={['atasan']}>

          <main>
            <GrafikKehadiran />
          </main>

    </ProtectedRoute>
  );
}