interface LoadingSkeletonProps {
  label: string;
  rows?: number;
}

export function LoadingSkeleton({ label, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div aria-label={label} className="loading-skeleton" role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <span
          aria-hidden="true"
          className={`loading-skeleton__line loading-skeleton__line--${index % 3}`}
          key={index}
        />
      ))}
    </div>
  );
}
