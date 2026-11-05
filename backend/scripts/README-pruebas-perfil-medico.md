# Pruebas aisladas del perfil médico

Desde `backend/`, ejecutar:

```powershell
node scripts/probar-perfil-medico-aislado.mjs
```

El runner requiere que `DATABASE_URL` en `backend/.env` apunte exactamente a `consultorio_db` y que su usuario pueda crear bases. Solo consulta el nombre de la base y el permiso del rol; no lee tablas de pacientes. Crea una base aleatoria `consultorio_medico_test_<12 caracteres hexadecimales>`, aplica el esquema con `prisma db push` (no ejecuta migraciones), agrega usuarios y pacientes ficticios y ejecuta las pruebas de API y del navegador. Usa puertos disponibles y un proxy Vite temporal.

Al terminar, incluso si una aserción falla, el runner cierra los procesos y elimina únicamente la base temporal que creó. No modifica ni limpia `consultorio_db`. La contraseña temporal se usa solo para los dos usuarios de la base de prueba. Edge guarda las capturas en `%TEMP%\consultorio-medico-review` y elimina el perfil temporal al cerrar.

Si el proceso se interrumpe a la fuerza, primero listar las bases residuales con una conexión administrativa a `consultorio_db`:

```sql
SELECT datname
FROM pg_database
WHERE datname ~ '^consultorio_medico_test_[0-9a-f]{12}$';
```

Verificar que el nombre corresponda a una ejecución interrumpida antes de eliminarlo. Cerrar sus conexiones y ejecutar `DROP DATABASE` indicando ese nombre exacto. No usar una limpieza masiva por prefijo.

Las pruebas comprueban autenticación, permisos, búsqueda, numeración y aislamiento por fecha, filtros, transiciones de atención, consulta clínica, correcciones/versiones, auditoría, envío repetido del formulario y renderizado sin desbordamiento horizontal en 390×844, 768×1024 y 1440×900. La prueba de navegador requiere Microsoft Edge instalado.
