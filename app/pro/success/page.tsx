'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import useAuthStore from '@/store/authStore';
import { getApiErrorMessage } from '@/lib/errors';

function ProSuccessCard({
  ok,
  mensaje,
  onContinuar,
}: {
  ok: boolean;
  mensaje: string;
  onContinuar: () => void;
}) {
  return (
    <div
      style={{
        maxWidth: 400,
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>{ok ? '⭐' : '⏳'}</div>
      <h1 style={{ fontFamily: 'var(--font-display, Syne, sans-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
        {ok ? '¡Bienvenido a PRO!' : 'Procesando...'}
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 24, lineHeight: 1.5 }}>{mensaje}</p>
      <button type="button" onClick={onContinuar} style={{ width: '100%', padding: 14, background: '#F5C842', color: '#1A0A3C', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
        Ir al inicio
      </button>
    </div>
  );
}

function ProSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrate, setAuth } = useAuthStore();
  const [mensaje, setMensaje] = useState('Verificando tu pago...');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const run = async () => {
      await hydrate();
      const paymentId =
        params.get('payment_id') ||
        params.get('collection_id') ||
        params.get('preference_id');

      if (!paymentId) {
        try {
          const me = await api.get('/auth/me');
          const token = localStorage.getItem('token');
          if (token) setAuth(me.data, token);
          setOk(!!me.data?.es_pro);
          setMensaje(
            me.data?.es_pro
              ? '¡Cuenta PRO activada!'
              : 'Pago en proceso. Si no ves PRO, espera unos segundos y recarga.',
          );
        } catch {
          setMensaje('Pago recibido. Revisa tu perfil en unos segundos.');
        }
        return;
      }

      try {
        const res = await api.get('/pro/payment-status', {
          params: { payment_id: paymentId },
        });
        const me = await api.get('/auth/me');
        const token = localStorage.getItem('token');
        if (token) setAuth(me.data, token);
        setOk(res.data?.status === 'approved' || res.data?.ya_era_pro);
        setMensaje(res.data?.message || '¡Pago confirmado!');
      } catch (err) {
        setMensaje(getApiErrorMessage(err, 'No pudimos confirmar el pago. Revisa tu perfil.'));
      }
    };
    run();
  }, [hydrate, params, setAuth]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0D0520',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <ProSuccessCard
        ok={ok}
        mensaje={mensaje}
        onContinuar={() => router.push('/dashboard')}
      />
    </div>
  );
}

export default function ProSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#0D0520', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Cargando...
        </div>
      }
    >
      <ProSuccessContent />
    </Suspense>
  );
}
