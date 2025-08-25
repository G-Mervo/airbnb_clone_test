export function generatePlaceholderImage(letter: string, color?: string): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }
  
  canvas.width = 400;
  canvas.height = 300;
  
  // Use darker gray background with dark gray text for better contrast
  const bgColor = color || '#E5E5E5';
  const textColor = '#6B7280';
  
  // Fill background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw letter
  ctx.fillStyle = textColor;
  ctx.font = 'bold 120px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter.toUpperCase(), canvas.width / 2, canvas.height / 2);
  
  return canvas.toDataURL();
}

function getColorForLetter(letter: string): string {
  const colors = [
    '#4F8FC7', '#58D68D', '#F39C12', '#E74C3C', '#9B59B6',
    '#3498DB', '#2ECC71', '#F1C40F', '#E67E22', '#8E44AD',
    '#1ABC9C', '#34495E', '#D35400', '#27AE60', '#2980B9'
  ];
  
  const index = letter.toUpperCase().charCodeAt(0) - 65;
  return colors[index % colors.length] || colors[0];
}

export function getImageWithFallback(
  originalSrc: string, 
  fallbackLetter: string, 
  fallbackColor?: string
): string {
  if (!originalSrc) {
    return generatePlaceholderImage(fallbackLetter, fallbackColor);
  }
  return originalSrc;
}

export function handleImageError(
  imgElement: HTMLImageElement, 
  fallbackLetter: string, 
  fallbackColor?: string
): void {
  if (imgElement.dataset.fallbackApplied === "true") return;
  imgElement.dataset.fallbackApplied = "true";
  imgElement.src = generatePlaceholderImage(fallbackLetter, fallbackColor);
}

// Some CDNs can be blocked by content blockers (e.g., a0.muscache.com).
// Route such URLs through a public image proxy to avoid blockers.
export function getSafeImageUrl(originalUrl?: string): string | undefined {
  if (!originalUrl) return originalUrl;
  try {
    const url = new URL(originalUrl);
    const host = url.hostname;
    const shouldProxy = host.includes("a0.muscache.com") || host.includes("airbnb.com");
    if (!shouldProxy) return originalUrl;
    const stripped = originalUrl.replace(/^https?:\/\//, "");
    return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`;
  } catch {
    return originalUrl;
  }
}