'use client';

import { useEffect } from 'react';
import useAuthStore from '@/store/authStore';

/** Hidrata sesión JWT al cargar cualquier página de la app. */
export default function AuthHydrator() {
  const hydrate = useAuthStore(s => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}
