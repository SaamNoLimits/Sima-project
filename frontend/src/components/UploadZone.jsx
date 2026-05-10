import { useRef, useState } from 'react'

export default function UploadZone({ onFile }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const handleFiles = (files) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image (JPG, PNG).')
      return
    }
    onFile(file)
  }

  return (
    <div
      className={`upload-zone${drag ? ' dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDrag(false)
        handleFiles(e.dataTransfer.files)
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
    >
      <div className="icon-wrap">
        <span className="material-symbols-outlined">cloud_upload</span>
      </div>
      <h3>Soumettre une IRM cérébrale</h3>
      <p>
        Glissez-déposez vos fichiers DICOM, NIfTI ou JPEG ici, ou{' '}
        <span className="browse">parcourez vos fichiers</span>.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
