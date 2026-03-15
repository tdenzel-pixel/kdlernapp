import heic2any from 'heic2any';

const MAX_DIMENSION = 800;
const QUALITY = 0.5;

const HEIC_TYPES = ['image/heic', 'image/heif'];

async function toJpegBlob(file) {
  if (HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name)) {
    const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: QUALITY });
    return Array.isArray(blob) ? blob[0] : blob;
  }
  return file;
}

export async function compressImage(file) {
  const blob = await toJpegBlob(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
      const [header, data] = dataUrl.split(',');
      const mediaType = header.match(/:(.*?);/)[1];
      resolve({ data, mediaType, preview: dataUrl, name: file.name });
    };
    img.onerror = reject;
    img.src = url;
  });
}
