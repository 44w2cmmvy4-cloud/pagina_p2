// Arbol de Clasificacion Funcional: Finalidad > Funcion > Subfuncion
import { useState } from 'react';
import { Pagination } from './Pagination';

export function ClasificacionFuncional({ data, onCreate, onEdit, onDelete }) {
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
        <span className="hierarchy-count">{total} finalidad(es) registrada(s)</span>
        <button className="btn btn-primary btn-sm" onClick={() => onCreate('Finalidad')}>+ Nueva Finalidad</button>
      </div>

      {total === 0 && (
        <div className="empty-box">
          <p>Sin clasificaciones registradas</p>
          <span>Crea una Finalidad para comenzar</span>
        </div>
      )}

      {visible.map(fin => {
        const claveF  = `fin-${fin.id}`;
        const abierto = !!abiertos[claveF];
        return (
          <div key={claveF} className="tree-row l-finalidad">

            {/* Fila Finalidad */}
            <div className="tree-item">
              <div className="row-left">
                <div className="row-name">
                  {fin.funciones?.length > 0
                    ? <button className={`btn-exp${abierto ? ' open' : ''}`} onClick={() => alternar(claveF)}>{abierto ? '-' : '+'}</button>
                    : <span style={{ width: 28 }} />}
                  <span className="badge badge-finalidad">Finalidad</span>
                  &nbsp;{fin.nombre}
                  {fin.codigo && <span className="badge-code">{fin.codigo}</span>}
                </div>
                <div className="row-meta">
                  <span className="pill"><strong>{fin.funciones?.length || 0}</strong> funcion(es)</span>
                  {fin.descripcion && <span className="pill">{fin.descripcion}</span>}
                </div>
              </div>
              <div className="row-actions">
                <button className="btn-edit-sm"   onClick={() => onCreate('Funcion', fin)}>+ Funcion</button>
                <button className="btn-edit-sm"   onClick={() => onEdit(fin, 'Finalidad')}>Editar</button>
                <button className="btn-delete-sm" onClick={() => onDelete(fin.id)}>Eliminar</button>
              </div>
            </div>

            {/* Funciones (visible si esta expandida la finalidad) */}
            {abierto && fin.funciones?.map(fn => {
              const claveN   = `fn-${fn.id}`;
              const abierto2 = !!abiertos[claveN];
              return (
                <div key={claveN} className="tree-row l-funcion">
                  <div className="tree-item">
                    <div className="row-left">
                      <div className="row-name">
                        {fn.subfunciones?.length > 0
                          ? <button className={`btn-exp${abierto2 ? ' open' : ''}`} onClick={() => alternar(claveN)}>{abierto2 ? '-' : '+'}</button>
                          : <span style={{ width: 28 }} />}
                        <span className="badge badge-funcion">Funcion</span>
                        &nbsp;{fn.nombre}
                        {fn.codigo && <span className="badge-code">{fn.codigo}</span>}
                      </div>
                      <div className="row-meta">
                        <span className="pill"><strong>{fn.subfunciones?.length || 0}</strong> subfuncion(es)</span>
                      </div>
                    </div>
                    <div className="row-actions">
                      <button className="btn-edit-sm"   onClick={() => onCreate('Subfuncion', fn)}>+ Subfuncion</button>
                      <button className="btn-edit-sm"   onClick={() => onEdit(fn, 'Funcion')}>Editar</button>
                      <button className="btn-delete-sm" onClick={() => onDelete(fn.id)}>Eliminar</button>
                    </div>
                  </div>

                  {/* Subfunciones (visible si esta expandida la funcion) */}
                  {abierto2 && fn.subfunciones?.map(sub => (
                    <div key={`sub-${sub.id}`} className="tree-row l-subfuncion">
                      <div className="tree-item">
                        <div className="row-left">
                          <div className="row-name">
                            <span style={{ width: 28 }} />
                            <span className="badge badge-subfuncion">Subfuncion</span>
                            &nbsp;{sub.nombre}
                            {sub.codigo && <span className="badge-code">{sub.codigo}</span>}
                          </div>
                          {sub.descripcion && <div className="row-meta"><span className="pill">{sub.descripcion}</span></div>}
                        </div>
                        <div className="row-actions">
                          <button className="btn-edit-sm"   onClick={() => onEdit(sub, 'Subfuncion')}>Editar</button>
                          <button className="btn-delete-sm" onClick={() => onDelete(sub.id)}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
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
