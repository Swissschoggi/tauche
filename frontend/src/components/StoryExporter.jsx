// components/StoryExporter.jsx
import { useState } from 'react'
import { Download, Share2, Camera, X } from 'lucide-react'
import { useToast } from "../context/ToastContext"

export default function StoryExporter({ dive, onClose }) {
  const toast = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)

  const generateStoryImage = async () => {
    setIsGenerating(true)
    
    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1080  // Instagram story size
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    
    // Background gradient (ocean theme)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, 'var(--base)')
    gradient.addColorStop(0.5, '#1e3a8a')
    gradient.addColorStop(1, '#020617')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add wave pattern at bottom
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)'
    for (let i = 0; i < 5; i++) {
      ctx.beginPath()
      ctx.moveTo(0, canvas.height - 100 + i * 30)
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.lineTo(x, canvas.height - 80 + i * 20 + Math.sin(x * 0.01 + i) * 20)
      }
      ctx.lineTo(canvas.width, canvas.height)
      ctx.lineTo(0, canvas.height)
      ctx.fill()
    }
    
    // Main title
    ctx.font = 'bold 72px "Inter", system-ui'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 10
    const title = dive.diveTitle || 'Dive Log'
    const wrappedTitle = title.length > 30 ? title.substring(0, 27) + '...' : title
    ctx.fillText(wrappedTitle, canvas.width / 2, 300)
    
    // Depth - big number
    ctx.font = 'bold 140px "Inter", system-ui'
    ctx.fillStyle = 'var(--accent)'
    ctx.fillText(`${dive.depthMeters || '?'}m`, canvas.width / 2, 550)
    ctx.font = '40px "Inter", system-ui'
    ctx.fillStyle = 'var(--ink-3)'
    ctx.fillText('MAX DEPTH', canvas.width / 2, 650)
    
    // Duration
    ctx.font = 'bold 90px "Inter", system-ui'
    ctx.fillStyle = '#34d399'
    ctx.fillText(`${dive.durationMinutes || '?'}`, canvas.width / 2 - 150, 850)
    ctx.font = '60px "Inter", system-ui'
    ctx.fillStyle = '#34d399'
    ctx.fillText('min', canvas.width / 2 + 30, 840)
    ctx.font = '40px "Inter", system-ui'
    ctx.fillStyle = 'var(--ink-3)'
    ctx.fillText('BOTTOM TIME', canvas.width / 2, 930)
    
    // Location
    ctx.font = '32px "Inter", system-ui'
    ctx.fillStyle = '#cbd5e1'
    const location = dive.location?.split(',')[0] || 'Unknown Location'
    ctx.fillText(`📍 ${location}`, canvas.width / 2, 1150)
    
    // Date
    ctx.font = '28px "Inter", system-ui'
    ctx.fillStyle = 'var(--ink-3)'
    ctx.fillText(dive.date || new Date().toISOString().split('T')[0], canvas.width / 2, 1280)
    
    // Buddy if exists
    if (dive.buddy) {
      ctx.font = '28px "Inter", system-ui'
      ctx.fillStyle = 'var(--ink-3)'
      ctx.fillText(`🤝 With ${dive.buddy}`, canvas.width / 2, 1420)
    }
    
    // Bottom branding
    ctx.font = '20px "Inter", system-ui'
    ctx.fillStyle = 'var(--accent)'
    ctx.fillText('TAUCHE', canvas.width / 2, canvas.height - 80)
    ctx.font = '16px "Inter", system-ui'
    ctx.fillStyle = 'var(--ink-3)'
    ctx.fillText('dive logbook', canvas.width / 2, canvas.height - 50)
    
    // Add dive image if exists (circular)
    if (dive.imagePath) {
      try {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        await new Promise((resolve, reject) => {
          img.onload = () => {
            // Circular mask for profile picture style
            ctx.save()
            ctx.beginPath()
            ctx.arc(canvas.width / 2, 1650, 100, 0, Math.PI * 2)
            ctx.clip()
            ctx.drawImage(img, canvas.width / 2 - 100, 1550, 200, 200)
            ctx.restore()
            
            // Border
            ctx.beginPath()
            ctx.arc(canvas.width / 2, 1650, 100, 0, Math.PI * 2)
            ctx.strokeStyle = 'var(--accent)'
            ctx.lineWidth = 4
            ctx.stroke()
            resolve()
          }
          img.onerror = () => resolve() // Continue even if image fails to load
          img.src = dive.imagePath
        })
      } catch (err) {
        console.error('Failed to load image:', err)
      }
    }
    
    // Convert to PNG
    const imageUrl = canvas.toDataURL('image/png')
    setGeneratedImage(imageUrl)
    setIsGenerating(false)
  }
  
  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement('a')
    const safeTitle = (dive.diveTitle || 'dive').replace(/[^a-z0-9]/gi, '_').toLowerCase()
    link.download = `tauche_story_${safeTitle}.png`
    link.href = generatedImage
    link.click()
  }
  
  const shareToInstagram = () => {
    // Instagram doesn't directly accept file sharing, so we download
    // User can then post to Instagram Stories
    downloadImage()
    toast.success('Image saved! You can now post to Instagram Stories.')
  }
  
  return (
    <div className="story-exporter" style={{ padding: '24px' }}>
      <h3 style={{ color: '#f8fafc', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Camera size={24} /> Share Dive Story
      </h3>
      
      {!generatedImage ? (
        <button 
          onClick={generateStoryImage} 
          disabled={isGenerating}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: '600',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Story Image'}
        </button>
      ) : (
        <div>
          <div style={{ 
            marginBottom: '20px', 
            borderRadius: '16px', 
            overflow: 'hidden',
            border: '1px solid rgba(144, 224, 239, 0.2)'
          }}>
            <img 
              src={generatedImage} 
              alt="Story preview" 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={downloadImage} 
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '10px',
                color: 'var(--accent)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} /> Save
            </button>
            <button 
              onClick={shareToInstagram} 
              style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '10px',
                color: '#a855f7',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Share2 size={16} /> Share to Story
            </button>
          </div>
        </div>
      )}
      
      <p style={{ 
        fontSize: '12px', 
        color: 'var(--ink-3)', 
        marginTop: '20px', 
        textAlign: 'center',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        Share your dive stats on Instagram Stories! Save the image and upload it as a story.
      </p>
    </div>
  )
}