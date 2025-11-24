# Training - YOLOv11n para Detección de Marcas

Scripts y dataset para entrenar el modelo de Computer Vision.

## Estructura

```
training/
├── dataset/           # Imágenes y anotaciones
│   ├── images/
│   │   ├── train/
│   │   ├── val/
│   │   └── test/
│   └── labels/
│       ├── train/
│       ├── val/
│       └── test/
├── scripts/          # Scripts Python
│   ├── prepare_dataset.py
│   ├── train.py
│   ├── export_onnx.py
│   └── validate.py
└── runs/            # Resultados de entrenamientos
```

## Uso

```bash
# Preparar dataset
python scripts/prepare_dataset.py

# Entrenar modelo
python scripts/train.py

# Exportar a ONNX
python scripts/export_onnx.py

# Validar modelo
python scripts/validate.py
```

## Requisitos

Ver `docs/VISION.md` para instrucciones detalladas.
