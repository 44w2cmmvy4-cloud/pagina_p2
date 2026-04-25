// Catalogo de Ingresos en arbol (usa parent_id para subniveles)
import { useState } from 'react';
import { Pagination } from './Pagination';

// Color visual por nivel de profundidad
const NIVEL_COLOR = [
  { fondo: '#F5DDE0', texto: '#5C1522', borde: '#F0C0C6' },
  { fondo: '#F5E6C8', texto: '#7A4A00', borde: '#E8C97A' },
  { fondo: '#DCF5E4', texto: '#1A6B3A', borde: '#A8DDB8' },
  { fondo: '#DCE8F5', texto: '#1A3A6B', borde: '#A8C0DD' },
  { fondo: '#EEE0F5', texto: '#4A1A6B', borde: '#C8A8DD' },
];

export function CatalogoIngresos({ data, onCreate, onEdit, onDelete }) {
  const [abiertos, setAbiertos]   = useState({}); // que filas estan expandidas
  const [pagina, setPagina]       = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // Abre o cierra una fila
  function alternar(clave) {
    setAbiertos(prev => ({ ...prev, [clave]: !prev[clave] }));
  }

  // Convierte la lista plana en arbol usando parent_id
  const mapa = {};
  const raiz = [];
  data.forEach(i => { mapa[i.id] = { ...i, hijos: [] }; });
  data.forEach(i => {
    if (i.parent_id && mapa[i.parent_id]) mapa[i.parent_id].hijos.push(mapa[i.id]);
    else if (!i.parent_id) raiz.push(mapa[i.id]);
  });

  const total   = raiz.length;
  const visible = raiz.slice((pagina - 1) * porPagina, pagina * porPagina);

  // Renderiza un nodo y sus hijos de forma recursiva
  function renderNodo(nodo, nivel) {
    const clave      = `ing-${nodo.id}`;
    const abierto    = !!abiertos[clave];
    const tieneHijos = nodo.hijos?.length > 0;
    const color      = NIVEL_COLOR[Math.min(nivel, NIVEL_COLOR.length - 1)];

    return (
      <div key={clave} className={`tree-row level-${Math.min(nivel, 4)}`}
           style={{ marginLeft: nivel > 0 ? nivel * 18 : 0 }}>
        <div className="tree-item">
          <div className="row-left">
            <div className="row-name">
              {tieneHijos
                ? <button className={`btn-exp${abierto ? ' open' : ''}`} onClick={() => alternar(clave)}>{abierto ? '-' : '+'}</button>
                : <span style={{ width: 28 }} />}
              <span className="badge" style={{ background: color.fondo, color: color.texto, border: `1px solid ${color.borde}` }}>
                {nodo.nivel || `Nivel ${nivel + 1}`}
              </span>
              &nbsp;{nodo.nombre}
              {nodo.codigo && <span className="badge-code">{nodo.codigo}</span>}
            </div>
            <div className="row-meta">
              {nodo.tipo_ingreso           && <span className="pill"><strong>Tipo:</strong> {nodo.tipo_ingreso}</span>}
              {nodo.fuente_financiamiento  && <span className="pill"><strong>Fuente:</strong> {nodo.fuente_financiamiento}</span>}
              {nodo.cve_ff                 && <span className="pill"><strong>CVE FF:</strong> {nodo.cve_ff}</span>}
              {nodo.monto_estimado != null && <span className="pill accent"><strong>Monto:</strong> ${Number(nodo.monto_estimado || 0).toLocaleString('es-MX')}</span>}
              {nodo.anio                   && <span className="pill"><strong>Año:</strong> {nodo.anio}</span>}
              {tieneHijos                  && <span className="pill"><strong>{nodo.hijos.length}</strong> subnivel(es)</span>}
            </div>
          </div>
          <div className="row-actions">
            <button className="btn-edit-sm"   onClick={() => onCreate('Ingreso', nodo)}>+ Subnivel</button>
            <button className="btn-edit-sm"   onClick={() => onEdit(nodo, 'Ingreso')}>Editar</button>
            <button className="btn-delete-sm" onClick={() => onDelete(nodo.id)}>Eliminar</button>
          </div>
        </div>

        {/* Hijos del nodo actual (recursivo) */}
        {abierto && nodo.hijos?.map(hijo => renderNodo(hijo, nivel + 1))}
      </div>
    );
  }

  return (
    <div className="hierarchy">
      <div className="hierarchy-header">
        <span className="hierarchy-count">{total} ingreso(s) raiz registrado(s)</span>
        <button className="btn btn-primary btn-sm" onClick={() => onCreate('Ingreso')}>+ Nuevo Ingreso</button>
      </div>

      {total === 0 && (
        <div className="empty-box">
          <p>Sin ingresos registrados</p>
          <span>Crea un ingreso raiz para comenzar</span>
        </div>
      )}

      {visible.map(nodo => renderNodo(nodo, 0))}

      {total > 0 && (
        <Pagination total={total} page={pagina} pageSize={porPagina}
          onPage={setPagina} onPageSize={size => { setPorPagina(size); setPagina(1); }} />
      )}
    </div>
  );
}