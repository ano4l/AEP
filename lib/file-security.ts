import { File } from 'buffer'

export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  allowedExtensions?: string[]
  maxFilenameLength?: number
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
}

export const DEFAULT_FILE_OPTIONS: FileValidationOptions = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-word',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed'
  ],
  allowedExtensions: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.txt', '.csv',
    '.xls', '.xlsx', '.doc', '.docx',
    '.zip'
  ],
  maxFilenameLength: 255
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '').replace(/[\/\\]/g, '_')
  
  // Remove dangerous characters
  filename = filename.replace(/[^a-zA-Z0-9.-_]/g, '_')
  
  // Remove consecutive underscores
  filename = filename.replace(/_+/g, '_')
  
  // Remove leading/trailing underscores and dots
  filename = filename.replace(/^[_\.]+|[_\.]+$/g, '')
  
  // Ensure filename is not empty
  if (!filename) {
    filename = 'unnamed_file'
  }
  
  return filename
}

export function getFileExtension(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[0-9a-z]+$/)
  return ext ? ext[0] : ''
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = getFileExtension(filename)
  return allowedExtensions.includes(ext)
}

export function validateFileSize(size: number, maxSize: number): boolean {
  return size <= maxSize
}

export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const opts = { ...DEFAULT_FILE_OPTIONS, ...options }
  
  // Check file size
  if (!validateFileSize(file.size, opts.maxSize!)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(opts.maxSize!)}`
    }
  }
  
  // Check file type
  if (opts.allowedTypes && !validateFileType(file, opts.allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed`
    }
  }
  
  // Check file extension
  if (opts.allowedExtensions && !validateFileExtension(file.name, opts.allowedExtensions)) {
    return {
      valid: false,
      error: `File extension "${getFileExtension(file.name)}" is not allowed`
    }
  }
  
  // Check filename length
  if (opts.maxFilenameLength && file.name.length > opts.maxFilenameLength) {
    return {
      valid: false,
      error: `Filename exceeds maximum length of ${opts.maxFilenameLength} characters`
    }
  }
  
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name)
  
  return {
    valid: true,
    sanitizedFilename
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateSecureFilename(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  const sanitized = sanitizeFilename(originalName)
  const ext = getFileExtension(sanitized)
  const nameWithoutExt = sanitized.replace(ext, '')
  
  return `${timestamp}_${random}_${nameWithoutExt}${ext}`
}

export function isExecutableFile(filename: string): boolean {
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.rpm', '.dmg', '.pkg', '.msi', '.dll', '.so', '.dylib'
  ]
  
  return dangerousExtensions.includes(getFileExtension(filename))
}

export function scanForMaliciousContent(buffer: Buffer): boolean {
  // Basic malware detection patterns
  const maliciousPatterns = [
    Buffer.from([0x4D, 0x5A]), // PE executable header
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable header
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class file
    Buffer.from([0x50, 0x4B, 0x03, 0x04]), // ZIP header (could contain executables)
  ]
  
  for (const pattern of maliciousPatterns) {
    if (buffer.subarray(0, pattern.length).equals(pattern)) {
      return true
    }
  }
  
  return false
}
