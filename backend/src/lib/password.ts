import { hash, verify } from '@node-rs/argon2'

// Hash de contraseñas con Argon2id (los parámetros seguros por defecto de la librería).
export async function hashearContrasena(contrasena: string): Promise<string> {
  return hash(contrasena)
}

export async function verificarContrasena(hashAlmacenado: string, contrasena: string): Promise<boolean> {
  try {
    return await verify(hashAlmacenado, contrasena)
  } catch {
    // hash malformado o vacío: tratar como credencial inválida sin filtrar detalles
    return false
  }
}
