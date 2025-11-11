const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24',
    card: 'h-64 w-full',
  };

  return (
    <div 
      className={`
        animate-pulse bg-gray-200 dark:bg-navy-700 rounded
        ${variants[variant]}
        ${className}
      `}
    />
  );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const ListEmptyState = ({ icon: Icon, title, message, actionLabel, onAction }) => (
  <div className="text-center py-12 space-y-4">
    {Icon && (
      <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-primary-600 to-teal-500 flex items-center justify-center shadow-lg">
        <Icon className="w-8 h-8 text-white" />
      </div>
    )}
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{message}</p>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const ScheduleSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
    {Array.from({ length: 5 }).map((_, idx) => (
      <div key={idx} className="p-4 border border-gray-200 dark:border-navy-700 rounded-xl space-y-4">
        <Skeleton variant="title" className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((__, innerIdx) => (
            <Skeleton key={innerIdx} className="h-20 w-full" variant="card" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;

