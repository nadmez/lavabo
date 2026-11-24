export default function IconButton({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded p-2 hover:bg-stone-100 ${danger ? "text-red-700 hover:bg-red-50" : "text-stone-700"}`}
    >
      {children}
    </button>
  );
}
