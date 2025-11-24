# Iconos PWA

Los iconos de la PWA deben generarse en los siguientes tamaños:

- `icon-192x192.png` (192x192px)
- `icon-512x512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)
- `favicon.ico` (32x32px)

## Generación Rápida

Puedes usar estas herramientas online gratuitas:

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Sube una imagen cuadrada de alta resolución (1024x1024 mínimo)
   - Descarga todos los tamaños generados

2. **Favicon Generator**: https://realfavicongenerator.net/
   - Genera todos los formatos necesarios
   - Incluye instrucciones de implementación

3. **ImageMagick** (CLI):
   ```bash
   # Si tienes una imagen source.png de 1024x1024
   convert source.png -resize 192x192 public/icon-192x192.png
   convert source.png -resize 512x512 public/icon-512x512.png
   convert source.png -resize 180x180 public/apple-touch-icon.png
   convert source.png -resize 32x32 public/favicon.ico
   ```

## Diseño Recomendado

Para Nexam, el icono debería:
- Usar el color primario del brand (#2563eb - azul)
- Ser simple y reconocible en tamaños pequeños
- Incluir alguna referencia visual a evaluación/educación
  - Ejemplo: Hoja con checkmark
  - Ejemplo: Lápiz con círculo
  - Ejemplo: Documento con IA/tecnología

## Colores del Brand

- Primary: #2563eb (azul)
- Background: #ffffff (blanco)
- Foreground: #0f172a (gris oscuro)

## Testing

Después de agregar los iconos, puedes probar:

1. Build de producción: `npm run build`
2. Preview: `npm run preview`
3. Abrir en Chrome/Edge y verificar que aparezca la opción "Instalar app"
4. Verificar en DevTools > Application > Manifest
