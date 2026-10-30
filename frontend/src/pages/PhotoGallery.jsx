import { useState, useEffect } from 'react'
import { Tag, Camera, Plus, Trash2, Loader } from 'lucide-react'
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage, updateGalleryImageTags, getImageUrl } from '../api/diveApi'
import PhotoLightbox from '../components/PhotoLightbox'
import './PhotoGallery.css'
import { useToast } from "../context/ToastContext"
import { useConfirm } from "../context/ConfirmContext"

const COMMON_SPECIES = [
  'Sea Turtle', 'Green Turtle', 'Hawksbill Turtle',
  'Reef Shark', 'Whitetip Reef Shark', 'Blacktip Reef Shark', 'Hammerhead Shark',
  'Manta Ray', 'Eagle Ray', 'Spotted Eagle Ray', 'Stingray',
  'Moray Eel', 'Green Moray', 'Spotted Moray',
  'Clownfish', 'Angelfish', 'Parrotfish', 'Butterflyfish', 'Lionfish', 'Pufferfish',
  'Octopus', 'Cuttlefish', 'Squid', 'Seahorse', 'Pipefish',
  'Nudibranch', 'Crab', 'Lobster', 'Shrimp', 'Sea Star', 'Urchin',
  'Barracuda', 'Grouper', 'Snapper', 'Trevally', 'Triggerfish', 'Wrasse',
  'Surgeonfish', 'Batfish', 'Frogfish', 'Scorpionfish', 'Stonefish', 'Damselfish',
  'Dolphin', 'Whale Shark', 'Mola Mola', 'Jellyfish', 'Sea Cucumber',
  'Anemone', 'Flounder', 'Goatfish', 'Blenny', 'Goby', 'Conch'
]

export default function PhotoGallery({ diveId }) {
  const toast = useToast()
  const confirmDialog = useConfirm()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [tagInput, setTagInput] = useState('')
  const [taggingPhotoId, setTaggingPhotoId] = useState(null)
  const [customTags, setCustomTags] = useState([])

  useEffect(() => {
    if (diveId) {
      loadGalleryImages()
    }
  }, [diveId])

  const loadGalleryImages = async () => {
    setLoading(true)
    try {
      const images = await getGalleryImages(diveId)
      const imagesWithUrls = await Promise.all(
        images.map(async (img) => ({
          ...img,
          url: await getImageUrl(img.imagePath),
          tagsArray: img.tags ? img.tags.split(',').map(t => t.trim()).filter(t => t) : []
        }))
      )
      setPhotos(imagesWithUrls)
    } catch (err) {
      console.error('Failed to load gallery:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files) => {
    if (!diveId) {
      toast.error('Please save the dive first before adding photos')
      return
    }
    
    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        await uploadGalleryImage(diveId, file)
      } catch (err) {
        console.error('Failed to upload image:', err)
        toast.error('Failed to upload image: ' + err.message)
      }
    }
    await loadGalleryImages()
    setUploading(false)
  }

  const handleDeletePhoto = async (imageId) => {
    const ok = await confirmDialog({ title: 'Remove photo?', message: 'Remove this photo?', confirmText: 'Remove', danger: true })
    if (!ok) return
    try {
      await deleteGalleryImage(diveId, imageId)
      await loadGalleryImages()
      toast.success('Photo removed')
    } catch (err) {
      console.error('Failed to delete image:', err)
      toast.error('Failed to delete image')
    }
  }

  const addTag = async (imageId, tag) => {
    if (!tag.trim()) return
    const photo = photos.find(p => p.id === imageId)
    const currentTags = photo.tagsArray || []
    if (!currentTags.includes(tag.trim())) {
      const newTags = [...currentTags, tag.trim()]
      try {
        await updateGalleryImageTags(diveId, imageId, newTags.join(','))
        await loadGalleryImages()
      } catch (err) {
        console.error('Failed to add tag:', err)
      }
    }
    setTagInput('')
  }

  const removeTag = async (imageId, tagToRemove) => {
    const photo = photos.find(p => p.id === imageId)
    const newTags = (photo.tagsArray || []).filter(t => t !== tagToRemove)
    try {
      await updateGalleryImageTags(diveId, imageId, newTags.join(','))
      await loadGalleryImages()
    } catch (err) {
      console.error('Failed to remove tag:', err)
    }
  }

  const speciesSuggestions = [...COMMON_SPECIES, ...customTags].filter(s => 
    s.toLowerCase().includes(tagInput.toLowerCase())
  )

  if (loading) {
    return (
      <div className="photo-gallery">
        <div className="gallery-header">
          <h3><Camera size={18} /> Dive Gallery</h3>
        </div>
        <div className="empty-gallery">
          <Loader size={32} className="spinning" />
          <p>Loading gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h3><Camera size={18} /> Dive Gallery ({photos.length})</h3>
        <label className="upload-photo-btn" style={{ opacity: uploading ? 0.5 : 1 }}>
          {uploading ? <Loader size={16} className="spinning" /> : <Plus size={16} />}
          {uploading ? 'Uploading...' : 'Add Photo'}
          <input
            type="file"
            hidden
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={(e) => handleFileUpload(e.target.files)}
          />
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="empty-gallery">
          <Camera size={32} strokeWidth={1} />
          <p>No photos yet. Add your first underwater shot!</p>
          <small style={{ color: 'var(--ink-3)', marginTop: '8px' }}>
            Note: Save the dive first before adding photos
          </small>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="gallery-item">
              <img 
                src={photo.url} 
                alt="Gallery" 
                onClick={() => setLightboxIndex(photos.indexOf(photo))}
                onError={(e) => {
                  console.error('Failed to load image:', photo.imagePath)
                  e.target.src = 'https://placehold.co/100x100?text=Error'
                }}
              />
              <div className="gallery-overlay">
                <button 
                  className="tag-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTaggingPhotoId(photo.id)
                  }}
                >
                  <Tag size={12} /> {photo.tagsArray?.length || 0}
                </button>
                <button 
                  className="delete-photo-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeletePhoto(photo.id)
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i) => setLightboxIndex(i)}
        />
      )}

      {taggingPhotoId && (
        <div className="tag-modal-overlay" onClick={() => setTaggingPhotoId(null)}>
          <div className="tag-modal" onClick={e => e.stopPropagation()}>
            <div className="tag-modal-header">
              <h4><Tag size={16} /> Tag Marine Life</h4>
              <button onClick={() => setTaggingPhotoId(null)}>×</button>
            </div>
            
            <div className="existing-tags">
              {photos.find(p => p.id === taggingPhotoId)?.tagsArray?.map((tag, i) => (
                <span key={i} className="tag-badge">
                  {tag}
                  <button onClick={() => removeTag(taggingPhotoId, tag)}>×</button>
                </span>
              ))}
            </div>

            <div className="tag-input-area">
              <input
                type="text"
                placeholder="Search or add species..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag(taggingPhotoId, tagInput)
                    if (tagInput && !COMMON_SPECIES.includes(tagInput) && !customTags.includes(tagInput)) {
                      setCustomTags(prev => [...prev, tagInput])
                    }
                    setTagInput('')
                  }
                }}
                autoFocus
              />
              <button onClick={() => {
                addTag(taggingPhotoId, tagInput)
                if (tagInput && !COMMON_SPECIES.includes(tagInput) && !customTags.includes(tagInput)) {
                  setCustomTags(prev => [...prev, tagInput])
                }
                setTagInput('')
              }}>Add</button>
            </div>

            {speciesSuggestions.length > 0 && tagInput && (
              <div className="suggested-tags">
                {speciesSuggestions.slice(0, 8).map(s => (
                  <button key={s} onClick={() => {
                    addTag(taggingPhotoId, s)
                    setTagInput('')
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}