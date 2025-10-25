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

export default Skeleton;

