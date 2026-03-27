# Skill: new-module

Crea la estructura completa para un nuevo módulo siguiendo la arquitectura modular de IM Platform.

## Pasos

1. Leer CONSTITUTION.md para validar que el módulo es coherente con los principios
2. Crear `/docs/modules/Mx-{nombre}.md` con:
   - Objetivo del módulo
   - Schema SQL
   - Rutas
   - Comportamiento esperado
   - Test Cases (mínimo 3)
   - Dependencias
   - Checklist de implementación
3. Crear carpeta `/src/lib/modules/{nombre}/`
4. Crear carpeta `/src/routes/admin/{nombre}/`
5. Confirmar spec con el usuario antes de escribir código
6. Solo después de aprobación: implementar

## Uso

/new-module nombre="clientes" descripcion="Gestión de base de clientes desde órdenes"
