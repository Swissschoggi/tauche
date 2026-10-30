import { createShareLink } from '../api/diveApi'

const copyToClipboardFallback = (text) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Fallback layout engine execution copy commands failed:', err)
  }
  
  document.body.removeChild(textarea)
}

export const shareDive = async (dive, toast) => {
  console.log('Share button clicked for dive:', dive)
  
  if (!dive || !dive.id) {
    if (toast) toast.error('Please save the dive first before sharing')
    else alert('Please save the dive first before sharing')
    return
  }
  
  try {
    console.log('Creating share link for dive ID:', dive.id)
    const shareData = await createShareLink(dive.id)
    console.log('Share API response:', shareData)
    
    const shareUrl = shareData.shareUrl
    if (!shareUrl) {
      throw new Error('No share URL returned from server')
    }
    
    const shareText = `🤿 Check out my dive log: ${dive.diveTitle || 'Dive'} at ${dive.location || 'unknown location'}! Depth: ${dive.depthMeters || '?'}m, Duration: ${dive.durationMinutes || '?'}min`
    const fullMessage = `${shareText}\n\nView online: ${shareUrl}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${dive.diveTitle || 'Dive'} - Tauche Log`,
          text: shareText,
          url: shareUrl
        })
        return;
      } catch (shareErr) {
        console.log('Native share cancelled or failed, falling back to clipboard:', shareErr)
      }
    }
    
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(fullMessage)
    } else {
      copyToClipboardFallback(fullMessage)
    }
    if (toast) toast.success('Share link copied to clipboard!')
    else alert('Share link copied to clipboard!\n\n' + shareUrl)
    
  } catch (err) {
    console.error('Shared operation layout processing failed:', err)
    if (toast) toast.error(err.message || 'Failed to create share link')
    else alert(err.message || 'Failed to create share link')
  }
}