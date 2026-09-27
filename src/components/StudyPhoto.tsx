type StudyPhotoProps = {
  file: string
  alt: string
  caption: string
}

export default function StudyPhoto({ file, alt, caption }: StudyPhotoProps) {
  return (
    <aside className="study-photo" aria-label="本阶段配图">
      <img src={`${import.meta.env.BASE_URL}decor/${file}`} alt={alt} loading="eager" />
      <p>{caption}</p>
    </aside>
  )
}
