import { randomBytes } from 'node:crypto'
import { argon2dAsync, argon2iAsync, argon2idAsync } from '@noble/hashes/argon2'

/**
 * Hash de contraseñas con Argon2id.
 *
 * `@node-rs/argon2` es un addon N-API nativo y no puede ejecutarse en el
 * runtime de Cloudflare Workers. `hash-wasm` tampoco sirve en Workers porque
 * compila WebAssembly en tiempo de ejecución y el runtime lo bloquea.
 *
 * @noble/hashes implementa Argon2 en JavaScript puro, sin WebAssembly ni
 * binarios nativos, y funciona tanto en Node.js como en Workers.
 *
 * Los parámetros coinciden exactamente con los valores por defecto que usaba
 * `@node-rs/argon2` (Argon2id v19, m=19456 KiB, t=2, p=1, sal de 16 bytes y
 * salida de 32 bytes), por lo que los hashes existentes siguen siendo válidos.
 */
const PARAMETROS_ARGON2 = {
  p: 1,
  t: 2,
  m: 19456,
  dkLen: 32,
  version: 0x13,
} as const

const SAL_BYTES = 16

type Algoritmo = 'argon2id' | 'argon2i' | 'argon2d'

const ALGORITMOS: Record<Algoritmo, typeof argon2idAsync> = {
  argon2id: argon2idAsync,
  argon2i: argon2iAsync,
  argon2d: argon2dAsync,
}

function aBase64(bytes: Uint8Array): string {
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario).replace(/=+$/, '')
}

function desdeBase64(texto: string): Uint8Array {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

/** Comparación en tiempo constante para no filtrar información por longitud ni contenido. */
function igualesEnTiempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a[i] ^ b[i]
  return diferencia === 0
}

/** Formato PHC estándar de Argon2: $argon2id$v=19$m=...,t=...,p=...$sal$hash */
const FORMATO_PHC =
  /^\$(argon2id|argon2i|argon2d)\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/

export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(SAL_BYTES)
  const derivada = await argon2idAsync(contrasena, sal, PARAMETROS_ARGON2)
  return `$argon2id$v=19$m=${PARAMETROS_ARGON2.m},t=${PARAMETROS_ARGON2.t},p=${PARAMETROS_ARGON2.p}$${aBase64(sal)}$${aBase64(derivada)}`
}

export async function verificarContrasena(hashAlmacenado: string, contrasena: string): Promise<boolean> {
  try {
    const partes = FORMATO_PHC.exec(hashAlmacenado)
    if (!partes) return false

    const [, algoritmo, version, memoria, iteraciones, paralelismo, salB64, hashB64] = partes
    const sal = desdeBase64(salB64)
    const esperado = desdeBase64(hashB64)
    if (sal.length === 0 || esperado.length === 0) return false

    const opciones = {
      p: Number(paralelismo),
      t: Number(iteraciones),
      m: Number(memoria),
      dkLen: esperado.length,
      version: Number(version),
    }
    const derivada = await ALGORITMOS[algoritmo as Algoritmo](contrasena, sal, opciones)
    return igualesEnTiempoConstante(derivada, esperado)
  } catch {
    // hash malformado, parámetros inválidos o contraseña que no cumple el formato
    return false
  }
}
