'use client'

export function PrintButton({
  label = 'Imprimer',
  className = 'flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors',
}: {
  label?: string
  className?: string
}) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <button
      onClick={handlePrint}
      className={className}
    >
      {label}
    </button>
  )
}
