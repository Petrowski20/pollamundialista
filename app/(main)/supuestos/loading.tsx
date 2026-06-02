function GroupTableSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
      {/* Header del grupo */}
      <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="h-4 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
      </div>

      {/* Cabecera de tabla */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-slate-800">
        <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-7 h-3 bg-gray-100 dark:bg-slate-800 rounded shrink-0" />
        ))}
      </div>

      {/* 4 filas de equipos */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-1 px-3 py-2.5 border-b border-gray-50 dark:border-slate-800/50 last:border-0"
        >
          {/* Bandera circular */}
          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0 mr-1" />
          {/* Stats: 8 celdas */}
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="w-7 h-3.5 bg-gray-100 dark:bg-slate-800 rounded shrink-0" />
          ))}
          {/* Puntos */}
          <div className="w-8 h-3.5 bg-blue-100 dark:bg-blue-900/30 rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

export default function SupuestosLoading() {
  return (
    <div className="w-full max-w-6xl mx-auto animate-pulse">

      {/* Cabecera */}
      <div className="mb-6">
        <div className="h-7 w-48 bg-gray-200 dark:bg-slate-700 rounded-md" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-slate-800 rounded mt-2" />
      </div>

      {/* Banner informativo */}
      <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl mb-6 border border-gray-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-4">
          <div className="h-3.5 w-56 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-3.5 w-40 bg-gray-100 dark:bg-slate-700 rounded" />
          <div className="h-3.5 w-44 bg-gray-100 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* Grid de 6 tablas de grupo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <GroupTableSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
