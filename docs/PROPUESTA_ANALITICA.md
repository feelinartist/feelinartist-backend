# Propuesta de Mejora: Retención de Datos para Analítica de Eventos

## Estado Actual (Current State)
Actualmente, el método `finalizarEvento` en `PrismaEventoRepository` ejecuta un **borrado físico** de todos los pedidos pendientes:

```typescript
// prisma-evento-repository.ts
await tx.pedidoCancion.deleteMany({
    where: {
        eventoId,
        estado: "PENDIENTE"
    }
});
```

**Consecuencia:** Se pierde información valiosa sobre la "Demanda Insatisfecha" (canciones que el público quería escuchar pero no se pusieron).

## Propuesta (To-Be)
Para habilitar reportes de analítica post-evento (ej. "Top 10 canciones ignoradas", "Géneros más solicitados pero no tocados"), se recomienda cambiar la lógica de eliminación por una de **Retención** o **Caducidad**.

### Opción A: Soft Delete / Cambio de Estado (Recomendada)
En lugar de `deleteMany`, actualizar el estado de los pedidos pendientes a un estado final que indique "No Atendido".

1.  Agregar estado `CANCELADO` o `NO_ATENDIDO` al enum `EstadoPedidoCancion`.
2.  Actualizar en lugar de borrar:
    ```typescript
    await tx.pedidoCancion.updateMany({
        where: { eventoId, estado: "PENDIENTE" },
        data: { estado: "NO_ATENDIDO" } // o CANCELADO
    });
    ```

### Opción B: Histórico Separado
Mover los pedidos a una tabla histórica `HistorialPedidos` antes de borrarlos de la tabla principal. Esto mantiene la tabla operativa ligera pero guarda la data para BI (Business Intelligence).

## Beneficios
1.  **Analítica de Sets:** El DJ puede ver qué pidieron y no puso, ayudando a preparar mejores sets futuros.
2.  **Transparencia:** Permite auditar la interacción real de la audiencia.
3.  **Métricas de Engagement:** Calcular el verdadero "Ratio de Aceptación" (Total Solicitudes vs. Total Aceptadas). Actualmente, al borrar los pendientes, el ratio se distorsiona.
