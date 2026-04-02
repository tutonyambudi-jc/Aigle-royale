/** Taille max par défaut (photo document / passeport côté admin). */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024

type AllowedKind = 'jpeg' | 'png' | 'webp' | 'gif' | 'pdf'

const MIME_TO_KIND: Record<string, AllowedKind> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
}

const KIND_EXT: Record<AllowedKind, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  gif: 'gif',
  pdf: 'pdf',
}

function matchesMagic(buf: Buffer, kind: AllowedKind): boolean {
  if (buf.length < 12) return false
  switch (kind) {
    case 'jpeg':
      return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
    case 'png':
      return (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
      )
    case 'gif':
      return buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
    case 'webp':
      return (
        buf.toString('ascii', 0, 4) === 'RIFF' &&
        buf.length >= 12 &&
        buf.toString('ascii', 8, 12) === 'WEBP'
      )
    case 'pdf':
      return buf.toString('ascii', 0, 5) === '%PDF-'
    default:
      return false
  }
}

export type ValidateUploadResult =
  | { ok: true; extension: string; kind: AllowedKind }
  | { ok: false; error: string }

/**
 * Vérifie taille, type déclaré et en-têtes binaires (réduit le spoofing MIME).
 */
export function validateUploadedFile(
  buffer: Buffer,
  declaredMime: string
): ValidateUploadResult {
  if (buffer.length === 0) {
    return { ok: false, error: 'Fichier vide' }
  }
  if (buffer.length > UPLOAD_MAX_BYTES) {
    return { ok: false, error: `Fichier trop volumineux (max. ${Math.round(UPLOAD_MAX_BYTES / 1024 / 1024)} Mo)` }
  }

  const normalizedMime = declaredMime.split(';')[0]?.trim().toLowerCase() || ''
  const kind = MIME_TO_KIND[normalizedMime]
  if (!kind) {
    return {
      ok: false,
      error: 'Type de fichier non autorisé (images JPEG, PNG, WebP, GIF ou PDF)',
    }
  }

  if (!matchesMagic(buffer, kind)) {
    return { ok: false, error: 'Le contenu du fichier ne correspond pas au type déclaré' }
  }

  return { ok: true, extension: KIND_EXT[kind], kind }
}
