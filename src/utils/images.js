export const toWebpImage = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;

  if (imageUrl.startsWith('/')) {
    return imageUrl.replace(/\.(jpe?g|png)(?=($|\?))/i, '.webp');
  }

  try {
    const url = new URL(imageUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes('images.unsplash.com')) {
      url.searchParams.set('fm', 'webp');
      return url.toString();
    }

    if (host.includes('images.pexels.com')) {
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('fm', 'webp');
      return url.toString();
    }

    return imageUrl;
  } catch {
    return imageUrl.replace(/\.(jpe?g|png)(?=($|\?))/i, '.webp');
  }
};
