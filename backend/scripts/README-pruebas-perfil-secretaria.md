# Pruebas aisladas del perfil de secretaría

Desde `backend/`, ejecutar:

```powershell
node scripts/probar-perfil-medico-aislado.mjs
```

El runner completo prueba las API y las vistas de médico y secretaría con usuarios y pacientes ficticios. Lee de `backend/.env` solamente la URL de conexión configurada y comprueba que el nombre de la base sea exactamente `consultorio_db` antes de crear una base aleatoria `consultorio_medico_test_<12 caracteres hexadecimales>`. No consulta datos de la base habitual. Prepara el esquema de la base vacía con `prisma db push`; no ejecuta migraciones.

Las pruebas cubren altas y búsqueda de pacientes, numeración por fecha, estados, cancelación, permisos de roles, historia clínica, versiones/auditoría, indicadores de PostgreSQL y exportación PDF sin datos identificables. Si Microsoft Edge está instalado, también recorre las pantallas de ambos perfiles en 390×844, 768×1024 y 1440×900 y guarda capturas en `%TEMP%\consultorio-secretaria-review` y `%TEMP%\consultorio-medico-review`.

Al finalizar, el runner cierra sus procesos y elimina solo la base aleatoria que creó, incluso si falla una aserción. No modifica ni limpia `consultorio_db`. La contraseña temporal corresponde solo a los usuarios ficticios creados en la base temporal.

Si el proceso se interrumpe a la fuerza, comprobar bases residuales antes de actuar:

```sql
SELECT datname
FROM pg_database
WHERE datname ~ '^consultorio_medico_test_[0-9a-f]{12}$';
```

Verificar que el nombre corresponda a la ejecución interrumpida y eliminar únicamente ese nombre exacto, después de cerrar sus conexiones. No realizar limpieza masiva por prefijo.
