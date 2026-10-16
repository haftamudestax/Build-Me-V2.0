export function CardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
      <span className="text-2xl">⚠️</span>
      <p className="text-sm text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline text-gray-600">
          Try again
        </button>
      )}
    </div>
  );
}
