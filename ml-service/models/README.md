# SureStep Vision YOLO Models

The service automatically uses `yolo11n.pt` when no custom model is present. Ultralytics downloads that model on first startup.

For a SureStep-specific model, place your trained weights here as:

`best.pt`

When `best.pt` exists, it is used automatically instead of the generic YOLO model.

Recommended future custom classes include:
- person
- wildlife
- fire
- smoke
- fallen_tree
- rock_obstacle
- vehicle
- water_hazard
- ice
- landslide
