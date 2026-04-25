// Barra de paginacion reutilizable
// Props: total, page, pageSize, onPage, onPageSize, pageSizes
export function Pagination({ total, page, pageSize, onPage, onPageSize, pageSizes = [10, 25, 50] }) {

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta  = Math.min(page * pageSize, total);

  // Genera los numeros de pagina a mostrar (maximo 7 botones)
  function generarPaginas() {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);

    const paginas = [1];
    if (page > 4) paginas.push('...');
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPaginas - 1, page + 2); i++) {
      paginas.push(i);
    }
    if (page < totalPaginas - 3) paginas.push('...');
    paginas.push(totalPaginas);
    return paginas;
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Mostrando <strong>{desde} - {hasta}</strong> de <strong>{total}</strong> registros
      </div>

      <div className="pagination-controls">
        {/* Selector de registros por pagina */}
        <select className="page-size-select" value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}>
          {pageSizes.map(s => <option key={s} value={s}>{s} por pagina</option>)}
        </select>

        {/* Boton anterior */}
        <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>
          &lsaquo;
        </button>

        {/* Botones numerados */}
        {generarPaginas().map((p, idx) =>
          p === '...'
            ? <span key={`sep-${idx}`} style={{ padding: '0 4px', color: 'var(--g400)' }}>...</span>
            : <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => onPage(p)}>{p}</button>
        )}

        {/* Boton siguiente */}
        <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPaginas}>
          &rsaquo;
        </button>
      </div>
    </div>
  );
}
