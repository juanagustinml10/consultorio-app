/**
 * PDFKit 0.20 publica los datos de las fuentes estándar como submódulos.
 * El build de Node no los necesita (los registra internamente), pero el build
 * para navegador/Workers exige llamar a `registerStdFonts()` antes de usarlas.
 *
 * TypeScript con `moduleResolution: node` no resuelve estos subpaths (los
 * expone el campo `exports` de package.json), por eso se declaran acá.
 */
declare module 'pdfkit/standard-fonts/Helvetica' {
  const fuente: { name: 'Helvetica'; [clave: string]: unknown }
  export default fuente
}

declare module 'pdfkit/standard-fonts/HelveticaBold' {
  const fuente: { name: 'Helvetica-Bold'; [clave: string]: unknown }
  export default fuente
}
