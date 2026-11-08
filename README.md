# Mis Cambios de Turno

PWA personal sin servidor. Solo los cambios **realizados** afectan al saldo.

- El motivo y las observaciones son opcionales y editables (hasta 2.000 caracteres cada uno).
- «Solicitud rechazada» registra una petición al compañero con fecha y jornada, sin afectar al saldo. Se puede editar o eliminar desde su historial.
- El resumen por compañero cuenta las peticiones aceptadas (programadas o realizadas en las que trabaja por mí) y rechazadas. Los cambios anulados no cuentan como aceptados.
- Se mantiene la clave `mis-cambios-v1` y el formato JSON versión 1. Las copias anteriores siguen siendo válidas; los campos nuevos se exportan junto con los movimientos. Las versiones antiguas de la aplicación no podrán importar una copia que contenga rechazos.
- La caché del service worker se actualiza a v2. Tras recibir la actualización, vuelve a abrir la PWA para cargar la nueva interfaz.

## Pruebas de navegador

Sirve esta carpeta por HTTP, abre `index.html` en un perfil de prueba y ejecuta en DevTools:

```js
const script = document.createElement('script');
script.src = './tests/browser.js';
script.onload = async () => console.log(await runShiftTests());
document.body.append(script);
```

La prueba comprueba almacenamiento anterior, edición, estados anulados, rechazos sin saldo, persistencia, escape de HTML, copias antiguas, exportación/importación y rechazo de datos inválidos. Restaura el valor anterior de localStorage al terminar.
