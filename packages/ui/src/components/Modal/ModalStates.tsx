export function ModalLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3">
      <div className="h-8 w-8 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Working on it…</p>
    </div>
  );
}

export function ModalError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
      <span className="text-2xl">⚠️</span>
      <p className="text-sm text-red-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function ModalSuccess({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-10 gap-3 text-center">
      <span className="text-2xl">✅</span>
      <p className="text-sm text-gray-700">{message}</p>
      <button onClick={onClose} className="text-sm underline">
        Close
      </button>
    </div>
  );
}
