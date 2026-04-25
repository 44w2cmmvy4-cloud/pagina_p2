import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { ClasificacionFuncional } from './ClasificacionFuncional';
import { DirectorioEntes }        from './DirectorioEntes';
import { CatalogoIngresos }       from './CatalogoIngresos';
import { Pagination }             from './Pagination';

const API = 'http://localhost:5000/api';

const TABS = [
  { key: 'clasificacion', label: 'Clasificacion Funcional' },
  { key: 'directorio',    label: 'Directorio de Entes'    },
  { key: 'ingresos',      label: 'Catalogo de Ingresos'   },
  { key: 'programas',     label: 'Programas y Proyectos'  },
];

const ENTITY_LABEL = {
  clasificacion: 'Clasificacion',
  directorio:    'Entidad',
  ingresos:      'Ingreso',
  programas:     'Programa',
};

function defaultForm(entity) {
  if (entity === 'directorio')
    return { id:null, codigo:'', nombre:'', descripcion:'', tipo:'Secretaria', parent_id:null, presupuesto:0 };
  if (entity === 'ingresos')
    return { id:null, codigo:'', nombre:'', descripcion:'', tipo_ingreso:'', fuente_financiamiento:'', cve_ff:'', cve_ldf:'', nivel:'', parent_id:null, monto_estimado:0, anio:new Date().getFullYear() };
  if (entity === 'programas')
    return { id:null, codigo:'', nombre:'', descripcion:'', tipo:'', ente_responsable_id:null, clasificacion_id:null, monto_total:0, monto_ejercido:0, fecha_inicio:'', fecha_fin:'', estatus:'', meta_valor:0, meta_unidad:'', ods_codigo:'', beneficiarios:'', observaciones:'' };
  return { id:null, codigo:'', nombre:'', descripcion:'', nivel:'Finalidad', parent_id:null };
}

function fmt(n) {
  if (!n && n !== 0) return '—';
  return `$${Number(n).toLocaleString('es-MX')}`;
}

export default function App() {
  const [clasificacion, setClasificacion] = useState([]);
  const [directorio,    setDirectorio]    = useState([]);
  const [ingresos,      setIngresos]      = useState([]);
  const [programas,     setProgramas]     = useState([]);
  const [activeTab,     setActiveTab]     = useState('clasificacion');
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [modalOpen,     setModalOpen]     = useState(false);
  const [formMode,      setFormMode]      = useState('crear');
  const [formEntity,    setFormEntity]    = useState('clasificacion');
  const [formData,      setFormData]      = useState(defaultForm('clasificacion'));
  const [progPage,      setProgPage]      = useState(1);
  const [progPageSize,  setProgPageSize]  = useState(10);
  const [searchTerm,    setSearchTerm]    = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(); }, []);

  function loadAll() {
    setLoading(true); setError(null);
    Promise.all([
      fetch(`${API}/clasificacion`).then(r => r.ok ? r.json() : Promise.reject(r)),
      fetch(`${API}/directorio`).then(r => r.ok ? r.json() : Promise.reject(r)),
      fetch(`${API}/ingresos`).then(r => r.ok ? r.json() : Promise.reject(r)),
      fetch(`${API}/programas`).then(r => r.ok ? r.json() : Promise.reject(r)),
    ]).then(([c,d,i,p]) => {
      setClasificacion(c.data||[]); setDirectorio(d.data||[]);
      setIngresos(i.data||[]);      setProgramas(p.data||[]);
      setLoading(false);
    }).catch(() => {
      setError('Sin conexion con el servidor. Verifica que el API este corriendo en: ' + API);
      setLoading(false);
    });
  }

  function flatClas() {
    const flat = [];
    clasificacion.forEach(fin => {
      flat.push({...fin, nivel:'Finalidad'});
      fin.funciones?.forEach(fn => {
        flat.push({...fn, nivel:'Funcion'});
        fn.subfunciones?.forEach(sub => flat.push({...sub, nivel:'Subfuncion'}));
      });
    });
    return flat;
  }

  function flatDir() {
    const flat = [];
    directorio.forEach(sec => {
      flat.push({...sec, tipo:'Secretaria'});
      sec.subsecretarias?.forEach(sub => {
        flat.push({...sub, tipo:'Subsecretaria'});
        sub.entes?.forEach(e => flat.push({...e, tipo:'Ente'}));
      });
    });
    return flat;
  }

  function parentOptsClas(nivel) {
    const f = flatClas();
    if (nivel==='Funcion')    return f.filter(i=>i.nivel==='Finalidad');
    if (nivel==='Subfuncion') return f.filter(i=>i.nivel==='Funcion');
    return [];
  }
  function parentOptsDir(tipo) {
    const f = flatDir();
    if (tipo==='Subsecretaria') return f.filter(i=>i.tipo==='Secretaria');
    if (tipo==='Ente')          return f.filter(i=>i.tipo==='Subsecretaria');
    return [];
  }

  function openCreate(entity, extra={}) {
    setFormEntity(entity); setFormMode('crear');
    setFormData({...defaultForm(entity),...extra});
    setModalOpen(true);
  }
  function openEdit(entity, item, extra={}) {
    setFormEntity(entity); setFormMode('editar');
    setFormData({...defaultForm(entity),...item,...extra});
    setModalOpen(true);
  }
  function setF(k,v) { setFormData(p=>({...p,[k]:v})); }

  function getUrl(entity) {
    return `${API}/${entity==='clasificacion'?'clasificacion':entity==='directorio'?'directorio':entity==='ingresos'?'ingresos':'programas'}`;
  }

  function save(e) {
    e.preventDefault();
    const p = {...formData};
    if (p.parent_id==='') p.parent_id=null;
    if (formEntity==='directorio') p.presupuesto=Number(p.presupuesto)||0;
    if (formEntity==='ingresos')   p.monto_estimado=Number(p.monto_estimado)||0;
    if (formEntity==='programas')  { p.monto_total=Number(p.monto_total)||0; p.monto_ejercido=Number(p.monto_ejercido)||0; p.meta_valor=Number(p.meta_valor)||0; }
    const url    = formMode==='crear' ? getUrl(formEntity) : `${getUrl(formEntity)}/${p.id}`;
    const method = formMode==='crear' ? 'POST' : 'PUT';
    fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(p)})
      .then(r=>{if(!r.ok)throw new Error('Error'); return r.json();})
      .then(()=>{setModalOpen(false);loadAll();})
      .catch(err=>alert('Error al guardar: '+(err.message||'')));
  }

  function del(entity, id) {
    if (!confirm('Eliminar este registro?\nEsta accion no se puede deshacer.')) return;
    fetch(`${getUrl(entity)}/${id}`,{method:'DELETE'})
      .then(r=>{if(!r.ok)throw new Error();return r.json();})
      .then(loadAll)
      .catch(()=>alert('Error al eliminar'));
  }

  /* ---- Campos extra por entidad ---- */
  function renderFields() {
    if (formEntity==='directorio') {
      const opts = parentOptsDir(formData.tipo);
      return (<>
        <div className="form-section">Clasificacion de la entidad</div>
        <div className="row">
          <div className="col-6 mb-3">
            <label className="form-label">Tipo *</label>
            <select className="form-select" value={formData.tipo} onChange={e=>setF('tipo',e.target.value)}>
              <option value="Secretaria">Secretaria</option>
              <option value="Subsecretaria">Subsecretaria</option>
              <option value="Ente">Ente</option>
            </select>
          </div>
          <div className="col-6 mb-3">
            <label className="form-label">Presupuesto asignado ($)</label>
            <input type="number" min="0" className="form-control" placeholder="0.00" value={formData.presupuesto} onChange={e=>setF('presupuesto',e.target.value)}/>
          </div>
        </div>
        {formData.tipo!=='Secretaria' && (
          <div className="mb-3">
            <label className="form-label">Dependencia padre *</label>
            <select className="form-select" value={formData.parent_id||''} onChange={e=>setF('parent_id',e.target.value||null)}>
              <option value="">Sin padre</option>
              {opts.map(o=><option key={o.id} value={o.id}>{o.tipo} — {o.nombre}</option>)}
            </select>
          </div>
        )}
      </>);
    }

    if (formEntity==='ingresos') return (<>
      <div className="form-section">Informacion fiscal</div>
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Tipo de ingreso</label>
          <input className="form-control" placeholder="Ej. Impuesto, Aprovechamiento..." value={formData.tipo_ingreso||''} onChange={e=>setF('tipo_ingreso',e.target.value)}/>
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Fuente de financiamiento</label>
          <input className="form-control" placeholder="Ej. Recursos propios..." value={formData.fuente_financiamiento||''} onChange={e=>setF('fuente_financiamiento',e.target.value)}/>
        </div>
      </div>
      <div className="row">
        <div className="col-3 mb-3"><label className="form-label">CVE FF</label><input className="form-control" value={formData.cve_ff||''} onChange={e=>setF('cve_ff',e.target.value)}/></div>
        <div className="col-3 mb-3"><label className="form-label">CVE LDF</label><input className="form-control" value={formData.cve_ldf||''} onChange={e=>setF('cve_ldf',e.target.value)}/></div>
        <div className="col-3 mb-3"><label className="form-label">Monto estimado ($)</label><input type="number" min="0" className="form-control" value={formData.monto_estimado||0} onChange={e=>setF('monto_estimado',e.target.value)}/></div>
        <div className="col-3 mb-3"><label className="form-label">Año fiscal</label><input type="number" className="form-control" value={formData.anio||new Date().getFullYear()} onChange={e=>setF('anio',e.target.value)}/></div>
      </div>
      <div className="mb-3">
        <label className="form-label">Ingreso padre</label>
        <select className="form-select" value={formData.parent_id||''} onChange={e=>setF('parent_id',e.target.value||null)}>
          <option value="">Nivel raiz (sin padre)</option>
          {ingresos.map(i=><option key={i.id} value={String(i.id)}>{i.codigo?`${i.codigo} — `:''}{i.nombre}</option>)}
        </select>
      </div>
    </>);

    if (formEntity==='programas') return (<>
      <div className="form-section">Clasificacion</div>
      <div className="row">
        <div className="col-6 mb-3">
          <label className="form-label">Tipo de programa</label>
          <input className="form-control" placeholder="Ej. Presupuestario, Especial..." value={formData.tipo||''} onChange={e=>setF('tipo',e.target.value)}/>
        </div>
        <div className="col-6 mb-3">
          <label className="form-label">Estatus</label>
          <select className="form-select" value={formData.estatus||''} onChange={e=>setF('estatus',e.target.value)}>
            <option value="">Sin definir</option>
            <option value="Activo">Activo</option>
            <option value="En revision">En revision</option>
            <option value="Suspendido">Suspendido</option>
            <option value="Terminado">Terminado</option>
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label">Ente responsable</label>
        <select className="form-select" value={formData.ente_responsable_id||''} onChange={e=>setF('ente_responsable_id',e.target.value||null)}>
          <option value="">Selecciona un ente</option>
          {flatDir().map(o=><option key={o.id} value={o.id}>{o.tipo} — {o.nombre}</option>)}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label">Clasificacion funcional</label>
        <select className="form-select" value={formData.clasificacion_id||''} onChange={e=>setF('clasificacion_id',e.target.value||null)}>
          <option value="">Selecciona una clasificacion</option>
          {flatClas().map(o=><option key={o.id} value={o.id}>{o.codigo?`${o.codigo} — `:''}{o.nombre}</option>)}
        </select>
      </div>
      <div className="form-section">Finanzas</div>
      <div className="row">
        <div className="col-6 mb-3"><label className="form-label">Monto total ($)</label><input type="number" min="0" className="form-control" value={formData.monto_total} onChange={e=>setF('monto_total',e.target.value)}/></div>
        <div className="col-6 mb-3"><label className="form-label">Monto ejercido ($)</label><input type="number" min="0" className="form-control" value={formData.monto_ejercido} onChange={e=>setF('monto_ejercido',e.target.value)}/></div>
      </div>
      <div className="row">
        <div className="col-6 mb-3"><label className="form-label">Fecha inicio</label><input type="date" className="form-control" value={formData.fecha_inicio||''} onChange={e=>setF('fecha_inicio',e.target.value)}/></div>
        <div className="col-6 mb-3"><label className="form-label">Fecha fin</label><input type="date" className="form-control" value={formData.fecha_fin||''} onChange={e=>setF('fecha_fin',e.target.value)}/></div>
      </div>
      <div className="form-section">Metas e indicadores</div>
      <div className="row">
        <div className="col-4 mb-3"><label className="form-label">Meta (valor)</label><input type="number" min="0" className="form-control" value={formData.meta_valor||0} onChange={e=>setF('meta_valor',e.target.value)}/></div>
        <div className="col-4 mb-3"><label className="form-label">Unidad de meta</label><input className="form-control" placeholder="Ej. Personas, Km, Ton..." value={formData.meta_unidad||''} onChange={e=>setF('meta_unidad',e.target.value)}/></div>
        <div className="col-4 mb-3"><label className="form-label">ODS (codigo)</label><input className="form-control" placeholder="Ej. 1, 4, 11..." value={formData.ods_codigo||''} onChange={e=>setF('ods_codigo',e.target.value)}/></div>
      </div>
      <div className="mb-3"><label className="form-label">Beneficiarios</label><input className="form-control" placeholder="Descripcion de beneficiarios..." value={formData.beneficiarios||''} onChange={e=>setF('beneficiarios',e.target.value)}/></div>
      <div className="mb-3"><label className="form-label">Observaciones</label><textarea className="form-control" rows={2} value={formData.observaciones||''} onChange={e=>setF('observaciones',e.target.value)}/></div>
    </>);

    // clasificacion
    const parentOpts = parentOptsClas(formData.nivel);
    return (<>
      <div className="form-section">Nivel jerarquico</div>
      <div className="mb-3">
        <label className="form-label">Nivel *</label>
        <select className="form-select" value={formData.nivel} onChange={e=>setF('nivel',e.target.value)}>
          <option value="Finalidad">Finalidad</option>
          <option value="Funcion">Funcion</option>
          <option value="Subfuncion">Subfuncion</option>
        </select>
      </div>
      {formData.nivel!=='Finalidad' && (
        <div className="mb-3">
          <label className="form-label">Pertenece a (padre) *</label>
          <select className="form-select" required value={formData.parent_id||''} onChange={e=>setF('parent_id',e.target.value||null)}>
            <option value="">Selecciona el padre</option>
            {parentOpts.map(o=><option key={o.id} value={o.id}>{o.codigo?`${o.codigo} — `:''}{o.nombre}</option>)}
          </select>
        </div>
      )}
    </>);
  }

  /* ---- Tabla de programas ---- */
  function renderProgramas(filteredProg) {
    const list    = filteredProg || programas;
    const total   = list.length;
    const pagData = list.slice((progPage-1)*progPageSize, progPage*progPageSize);

    function estCls(e) {
      const s=(e||'').toLowerCase();
      if(s==='activo')      return 'tag-activo';
      if(s==='en revision') return 'tag-revision';
      if(s==='terminado')   return 'tag-terminado';
      return 'tag-default';
    }

    return (
      <div className="hierarchy">
        {total===0 ? (
          <div className="empty-box">
            <p>Sin programas registrados</p>
            <span>Haz clic en "Nuevo registro" para agregar el primero</span>
          </div>
        ) : (<>
          <div className="prog-table-wrap">
            <table className="prog-table">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estatus</th>
                  <th>Total asignado</th>
                  <th>Monto ejercido</th>
                  <th>Avance</th>
                  <th>Meta</th>
                  <th>ODS</th>
                  <th>Periodo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagData.map(p=>{
                  const pct = p.monto_total&&p.monto_ejercido
                    ? Math.min(100,Math.round((Number(p.monto_ejercido)/Number(p.monto_total))*100)) : 0;
                  const bar = pct>80?'#dc2626':pct>50?'#d97706':'#16a34a';
                  return (
                    <tr key={p.id}>
                      <td>{p.codigo?<span className="badge-code">{p.codigo}</span>:<span className="prog-dash">—</span>}</td>
                      <td className="prog-name-cell">
                        {p.nombre}
                        {p.descripcion&&<div className="prog-desc-cell">{p.descripcion}</div>}
                      </td>
                      <td>{p.tipo?<span className="tag tag-tipo">{p.tipo}</span>:<span className="prog-dash">—</span>}</td>
                      <td>{p.estatus?<span className={`tag ${estCls(p.estatus)}`}>{p.estatus}</span>:<span className="prog-dash">—</span>}</td>
                      <td className="prog-money">{p.monto_total?fmt(p.monto_total):<span className="prog-dash">—</span>}</td>
                      <td className="prog-money">{p.monto_ejercido?fmt(p.monto_ejercido):<span className="prog-dash">—</span>}</td>
                      <td>
                        <div className="prog-progress">
                          <div className="progress-bg"><div className="progress-fill" style={{width:`${pct}%`,backgroundColor:bar}}/></div>
                          <span className="progress-pct">{pct}%</span>
                        </div>
                      </td>
                      <td style={{fontSize:'0.75rem',color:'var(--g600)'}}>
                        {p.meta_valor?<><strong>{Number(p.meta_valor).toLocaleString()}</strong>{p.meta_unidad?` ${p.meta_unidad}`:''}</>:<span className="prog-dash">—</span>}
                      </td>
                      <td>{p.ods_codigo?<span className="badge tag-default" style={{fontSize:'0.7rem'}}>{p.ods_codigo}</span>:<span className="prog-dash">—</span>}</td>
                      <td className="prog-periodo">
                        {p.fecha_inicio||p.fecha_fin?<>{p.fecha_inicio||'—'}<br/>al {p.fecha_fin||'—'}</>:<span className="prog-dash">—</span>}
                      </td>
                      <td>
                        <div className="prog-row-actions">
                          <button className="btn-edit"   onClick={()=>openEdit('programas',p)}>Editar</button>
                          <button className="btn-delete" onClick={()=>del('programas',p.id)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={progPage} pageSize={progPageSize}
            onPage={setProgPage} onPageSize={s=>{setProgPageSize(s);setProgPage(1);}}/>
        </>)}
      </div>
    );
  }

  /* ---- Filtrado de datos por busqueda ---- */
  const q = searchTerm.toLowerCase().trim();

  function matchStr(str) { return (str||'').toLowerCase().includes(q); }

  function filterClas(list) {
    if (!q) return list;
    return list.filter(fin =>
      matchStr(fin.nombre) || matchStr(fin.codigo) || matchStr(fin.descripcion) ||
      fin.funciones?.some(fn =>
        matchStr(fn.nombre) || matchStr(fn.codigo) ||
        fn.subfunciones?.some(s => matchStr(s.nombre) || matchStr(s.codigo))
      )
    );
  }

  function filterDir(list) {
    if (!q) return list;
    return list.filter(sec =>
      matchStr(sec.nombre) || matchStr(sec.codigo) || matchStr(sec.tipo) ||
      sec.subsecretarias?.some(sub =>
        matchStr(sub.nombre) || matchStr(sub.codigo) ||
        sub.entes?.some(e => matchStr(e.nombre) || matchStr(e.codigo))
      ) ||
      sec.entes?.some(e => matchStr(e.nombre) || matchStr(e.codigo))
    );
  }

  function filterIngresos(list) {
    if (!q) return list;
    return list.filter(i =>
      matchStr(i.nombre) || matchStr(i.codigo) ||
      matchStr(i.tipo_ingreso) || matchStr(i.fuente_financiamiento)
    );
  }

  function filterProgramas(list) {
    if (!q) return list;
    return list.filter(p =>
      matchStr(p.nombre) || matchStr(p.codigo) ||
      matchStr(p.tipo)   || matchStr(p.estatus) ||
      matchStr(p.descripcion) || matchStr(p.beneficiarios)
    );
  }

  function renderContent() {
    if (loading) return <div className="loading-box"><div className="spinner"/><p>Cargando datos...</p></div>;
    if (error)   return (
      <div className="alert alert-danger">
        <strong>Error de conexion</strong>
        <p style={{margin:'8px 0 0',fontSize:'0.83rem'}}>{error}</p>
        <button className="btn btn-secondary" style={{marginTop:10}} onClick={loadAll}>Reintentar</button>
      </div>
    );
    if (activeTab==='clasificacion')
      return <ClasificacionFuncional data={filterClas(clasificacion)} searchTerm={q}
        onCreate={(n,par)=>openCreate('clasificacion',{nivel:n,parent_id:par?.id??null})}
        onEdit={(it,n)=>openEdit('clasificacion',it,{nivel:n})}
        onDelete={id=>del('clasificacion',id)}/>;
    if (activeTab==='directorio')
      return <DirectorioEntes data={filterDir(directorio)} searchTerm={q}
        onCreate={(t,par)=>openCreate('directorio',{tipo:t,parent_id:par?.id??null})}
        onEdit={(it,t)=>openEdit('directorio',it,{tipo:t})}
        onDelete={id=>del('directorio',id)}/>;
    if (activeTab==='ingresos')
      return <CatalogoIngresos data={filterIngresos(ingresos)} searchTerm={q}
        onCreate={(n,par)=>openCreate('ingresos',{nivel:n,parent_id:par?.id??null})}
        onEdit={(it,n)=>openEdit('ingresos',it,{nivel:n})}
        onDelete={id=>del('ingresos',id)}/>;
    return renderProgramas(filterProgramas(programas));
  }

  const tabLabel = TABS.find(t=>t.key===activeTab)?.label||'';

  return (
    <div className="app">

      {/* HEADER GUBERNAMENTAL */}
      <header className="app-header">
        <div className="header-gov">
          <div className="header-gov-top">
            <span className="header-estado">Gobierno del Estado de Hidalgo</span>
            <span className="header-sep">|</span>
            <span className="header-dependencia">Secretaria de Finanzas Publicas</span>
          </div>
          <h1 className="header-title">Sistema de Gestion Presupuestal</h1>
        </div>
      </header>

      {/* LINEA DORADA DECORATIVA */}
      <div className="header-gold-bar" />

      {/* NAVEGACION */}
      <nav className="nav-bar">
        {TABS.map(t=>(
          <button key={t.key} className={`nav-btn${activeTab===t.key?' active':''}`} onClick={()=>{setActiveTab(t.key); setSearchTerm(''); setProgPage(1);}}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main">
        {!loading&&!error&&(
          <div className="section-bar">
            <h2 className="section-title">{tabLabel}</h2>
            <div className="section-actions">
              {/* BUSCADOR */}
              <div className="search-wrap">
                <input
                  className="search-input"
                  type="text"
                  placeholder={`Buscar en ${tabLabel}...`}
                  value={searchTerm}
                  onChange={e=>{ setSearchTerm(e.target.value); setProgPage(1); }}
                />
                {searchTerm && (
                  <button className="search-clear" onClick={()=>setSearchTerm('')} title="Limpiar">
                    x
                  </button>
                )}
              </div>
              <button className="btn btn-secondary" onClick={loadAll}>Recargar</button>
              <button className="btn btn-primary" onClick={()=>openCreate(activeTab)}>+ Nuevo</button>
            </div>
          </div>
        )}
        {searchTerm && !loading && !error && (
          <div className="search-banner">
            Resultados para: <strong>"{searchTerm}"</strong>
            <button className="search-clear-link" onClick={()=>setSearchTerm('')}>Limpiar busqueda</button>
          </div>
        )}
        {renderContent()}
        <div className="status-bar">
          {API} &nbsp;|&nbsp; {loading?'Cargando...':error?'Error de conexion':'Conectado'}
        </div>
      </main>

      <Modal show={modalOpen} onHide={()=>setModalOpen(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{formMode==='crear'?'Nuevo':'Editar'} — {ENTITY_LABEL[formEntity]}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={save} id="entity-form">
            <div className="form-section">Identificacion</div>
            <div className="row">
              <div className="col-4 mb-3">
                <label className="form-label">Codigo</label>
                <input className="form-control" placeholder="Ej. 01, A-001..." value={formData.codigo||''} onChange={e=>setF('codigo',e.target.value)}/>
              </div>
              <div className="col-8 mb-3">
                <label className="form-label">Nombre *</label>
                <input className="form-control" required placeholder="Nombre completo..." value={formData.nombre||''} onChange={e=>setF('nombre',e.target.value)}/>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Descripcion</label>
              <textarea className="form-control" rows={2} placeholder="Descripcion opcional..." value={formData.descripcion||''} onChange={e=>setF('descripcion',e.target.value)}/>
            </div>
            {renderFields()}
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancelar</Button>
          <Button variant="primary" type="submit" form="entity-form" style={{background:'var(--primary)',borderColor:'var(--primary-d)'}}>
            {formMode==='crear'?'Crear registro':'Guardar cambios'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
