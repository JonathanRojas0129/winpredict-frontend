/** Mapeo entre estados del backend y la UI del frontend. */
 
export type EstadoPartidoUI = 'programado' | 'vivo' | 'finalizado';
 
export interface PartidoApi {
  id: string;
  equipo_local: string;
  equipo_visitante: string;
  bandera_local: string | null;
  bandera_visitante: string | null;
  fecha_hora: string;
  fase: string;
  grupo: string | null;  // ← nuevo
  goles_local: number | null;
  goles_visitante: number | null;
  estado: string;
  cierre_pronosticos: string;
}
 
export interface PartidoUI extends Omit<PartidoApi, 'estado'> {
  estado: EstadoPartidoUI;
}
 
export function mapEstadoPartido(estado: string): EstadoPartidoUI {
  if (estado === 'pendiente') return 'programado';
  if (estado === 'vivo') return 'vivo';
  if (estado === 'finalizado') return 'finalizado';
  return 'programado';
}
 
export function mapPartidoFromApi(p: PartidoApi): PartidoUI {
  return { ...p, estado: mapEstadoPartido(p.estado) };
}