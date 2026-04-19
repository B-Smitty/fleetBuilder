interface Props {
  name: string
  url?: string
  className?: string
}

export default function ShipLink({ name, url, className }: Props) {
  if (!url) return <>{name}</>
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`hover:text-blue-400 transition-colors underline decoration-gray-600 underline-offset-2 ${className ?? ''}`}
    >
      {name}
    </a>
  )
}
