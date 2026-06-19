import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '../useI18n'

function ImageZoomDialog({ image, onClose }) {
  const { t } = useI18n()

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="zoomOverlay" role="dialog" aria-modal="true" aria-label={t('zoom.productImage')}>
      <button className="zoomBackdrop" type="button" onClick={onClose} aria-label={t('zoom.closeImageZoom')} />
      <div className="zoomPanel">
        <button className="iconButton zoomClose" type="button" onClick={onClose} title={t('zoom.close')}>
          <X size={20} />
        </button>
        <img src={image.url} alt={image.alt} />
      </div>
    </div>
  )
}

export default ImageZoomDialog
