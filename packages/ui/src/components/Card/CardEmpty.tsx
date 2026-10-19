export function CardEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center text-gray-400">
      <span className="text-2xl mb-2">📭</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}
