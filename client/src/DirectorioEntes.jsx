// Arbol de Directorio de Entes: Secretaria > Subsecretaria > Ente
import { useState } from 'react';
import { Pagination } from './Pagination';

// Formatea un numero como moneda mexicana
function fmt(n) {
  if (!n && n !== 0) return 'No asignado';
  return '$' + Number(n).toLocaleString('es-MX');
}

export function DirectorioEntes({ data, onCreate, onEdit, onDelete }) {
  const [abiertos, setAbiertos]   = useState({}); // que filas estan expandidas
  const [pagina, setPagina]       = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  // Abre o cierra una fila
  function alternar(clave) {
    setAbiertos(prev => ({ ...prev, [clave]: !prev[clave] }));
  }

  const total   = data.length;
  const visible = data.slice((pagina - 1) * porPagina, pagina * porPagina);

  return (
    <div className="hierarchy">
      <div className="hierarchy-header">
        <span className="hierarchy-count">{total} secretaria(s) registrada(s)</span>
        <button className="btn btn-primary btn-sm" onClick={() => onCreate('Secretaria')}>+ Nueva Secretaria</button>
      </div>

      {total === 0 && (
        <div className="empty-box">
          <p>Sin entidades registradas</p>
          <span>Crea una Secretaria para comenzar</span>
        </div>
      )}

      {visible.map(sec => {
        const claveS     = `sec-${sec.id}`;
        const abierto    = !!abiertos[claveS];
        const tieneHijos = (sec.subsecretarias?.length > 0) || (sec.entes?.length > 0);

        return (
          <div key={claveS} className="tree-row l-secretaria">

            {/* Fila Secretaria */}
            <div className="tree-item">
              <div className="row-left">
                <div className="row-name">
                  {tieneHijos
                    ? <button className={`btn-exp${abierto ? ' open' : ''}`} onClick={() => alternar(claveS)}>{abierto ? '-' : '+'}</button>
                    : <span style={{ width: 28 }} />}
                  <span className="badge badge-secretaria">Secretaria</span>
                  &nbsp;{sec.nombre}
                  {sec.codigo && <span className="badge-code">{sec.codigo}</span>}
                </div>
                <div className="row-meta">
                  <span className="pill accent"><strong>Presupuesto:</strong> {fmt(sec.presupuesto)}</span>
                  {sec.subsecretarias?.length > 0 && <span className="pill"><strong>{sec.subsecretarias.length}</strong> subsecretaria(s)</span>}
                  {sec.entes?.length > 0           && <span className="pill"><strong>{sec.entes.length}</strong> ente(s)</span>}
                </div>
              </div>
              <div className="row-actions">
                <button className="btn-edit-sm"   onClick={() => onCreate('Subsecretaria', sec)}>+ Subsecretaria</button>
                <button className="btn-edit-sm"   onClick={() => onCreate('Ente', sec)}>+ Ente</button>
                <button className="btn-edit-sm"   onClick={() => onEdit(sec, 'Secretaria')}>Editar</button>
                <button className="btn-delete-sm" onClick={() => onDelete(sec.id)}>Eliminar</button>
              </div>
            </div>

            {/* Contenido expandido: Subsecretarias y Entes */}
            {abierto && (
              <>
                {sec.subsecretarias?.map(sub => {
                  const claveU   = `sub-${sub.id}`;
                  const abierto2 = !!abiertos[claveU];
                  return (
                    <div key={claveU} className="tree-row l-subsecretaria">

                      {/* Fila Subsecretaria */}
                      <div className="tree-item">
                        <div className="row-left">
                          <div className="row-name">
                            {sub.entes?.length > 0
                              ? <button className={`btn-exp${abierto2 ? ' open' : ''}`} onClick={() => alternar(claveU)}>{abierto2 ? '-' : '+'}</button>
                              : <span style={{ width: 28 }} />}
                            <span className="badge badge-subsecretaria">Subsecretaria</span>
                            &nbsp;{sub.nombre}
                            {sub.codigo && <span className="badge-code">{sub.codigo}</span>}
                          </div>
                          <div className="row-meta">
                            <span className="pill accent"><strong>Presupuesto:</strong> {fmt(sub.presupuesto)}</span>
                            {sub.entes?.length > 0 && <span className="pill"><strong>{sub.entes.length}</strong> ente(s)</span>}
                          </div>
                        </div>
                        <div className="row-actions">
                          <button className="btn-edit-sm"   onClick={() => onCreate('Ente', sub)}>+ Ente</button>
                          <button className="btn-edit-sm"   onClick={() => onEdit(sub, 'Subsecretaria')}>Editar</button>
                          <button className="btn-delete-sm" onClick={() => onDelete(sub.id)}>Eliminar</button>
                        </div>
                      </div>

                      {/* Entes de esta Subsecretaria */}
                      {abierto2 && sub.entes?.map(ente => (
                        <div key={`ente-${ente.id}`} className="tree-row l-ente">
                          <div className="tree-item">
                            <div className="row-left">
                              <div className="row-name">
                                <span style={{ width: 28 }} />
                                <span className="badge badge-ente">Ente</span>
                                &nbsp;{ente.nombre}
                                {ente.codigo && <span className="badge-code">{ente.codigo}</span>}
                              </div>
                              <div className="row-meta">
                                <span className="pill accent"><strong>Presupuesto:</strong> {fmt(ente.presupuesto)}</span>
                              </div>
                            </div>
                            <div className="row-actions">
                              <button className="btn-edit-sm"   onClick={() => onEdit(ente, 'Ente')}>Editar</button>
                              <button className="btn-delete-sm" onClick={() => onDelete(ente.id)}>Eliminar</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Entes directos de la Secretaria (sin Subsecretaria) */}
                {sec.entes?.map(ente => (
                  <div key={`ente-sec-${ente.id}`} className="tree-row l-ente">
                    <div className="tree-item">
                      <div className="row-left">
                        <div className="row-name">
                          <span style={{ width: 28 }} />
                          <span className="badge badge-ente">Ente</span>
                          &nbsp;{ente.nombre}
                          {ente.codigo && <span className="badge-code">{ente.codigo}</span>}
                        </div>
                        <div className="row-meta">
                          <span className="pill accent"><strong>Presupuesto:</strong> {fmt(ente.presupuesto)}</span>
                        </div>
                      </div>
                      <div className="row-actions">
                        <button className="btn-edit-sm"   onClick={() => onEdit(ente, 'Ente')}>Editar</button>
                        <button className="btn-delete-sm" onClick={() => onDelete(ente.id)}>Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}

      {total > 0 && (
        <Pagination total={total} page={pagina} pageSize={porPagina}
          onPage={setPagina} onPageSize={size => { setPorPagina(size); setPagina(1); }} />
      )}
    </div>
  );
}