import { uuid } from "uuidv4";
import { fabric } from "fabric";
import type { RGBColor } from "react-color";

type JsonObjectNode = {
  type?: string;
  objects?: JsonObjectNode[];
};

type FabricFilterCtor = new (
  options?: Record<string, unknown>,
) => fabric.IBaseFilter;

const filtersRegistry = fabric.Image.filters as unknown as Record<string, FabricFilterCtor | undefined>;

export function transformText(objects: JsonObjectNode[] | undefined) {
  if (!objects) return;

  objects.forEach((item) => {
    if (item.objects) {
      transformText(item.objects);
      return;
    }

    if (item.type === "text") {
      item.type = "textbox";
    }
  });
};

export function downloadFile(file: string, type: string) {
  const anchorElement = document.createElement("a");

  anchorElement.href = file;
  anchorElement.download = `${uuid()}.${type}`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  anchorElement.remove();
};

export function isTextType(type: string | undefined) {
  return type === "text" || type === "i-text" || type === "textbox";
};

export function rgbaObjectToString(rgba: RGBColor | "transparent") {
  if (rgba === "transparent") {
    return `rgba(0,0,0,0)`;
  }

  const alpha = rgba.a === undefined ? 1 : rgba.a;

  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
};

export const createFilter = (value: string) => {
  let effect: fabric.IBaseFilter | null;

  switch (value) {
    case "greyscale":
      effect = new fabric.Image.filters.Grayscale();
      break;
    case "polaroid":
      effect = filtersRegistry.Polaroid ? new filtersRegistry.Polaroid() : null;
      break;
    case "sepia":
      effect = new fabric.Image.filters.Sepia();
      break;
    case "kodachrome":
      effect = filtersRegistry.Kodachrome ? new filtersRegistry.Kodachrome() : null;
      break;
    case "contrast":
      effect = new fabric.Image.filters.Contrast({ contrast: 0.3 });
      break;
    case "brightness":
      effect = new fabric.Image.filters.Brightness({ brightness: 0.8 });
      break;
    case "brownie":
      effect = filtersRegistry.Brownie ? new filtersRegistry.Brownie() : null;
      break;
    case "vintage":
      effect = filtersRegistry.Vintage ? new filtersRegistry.Vintage() : null;
      break;
    case "technicolor":
      effect = filtersRegistry.Technicolor ? new filtersRegistry.Technicolor() : null;
      break;
    case "pixelate":
      effect = new fabric.Image.filters.Pixelate();
      break;
    case "invert":
      effect = new fabric.Image.filters.Invert();
      break;
    case "blur":
      effect = new fabric.Image.filters.Blur();
      break;
    case "sharpen":
      effect = new fabric.Image.filters.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      });
      break;
    case "emboss":
      effect = new fabric.Image.filters.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      });
      break;
    case "removecolor":
      effect = filtersRegistry.RemoveColor
        ? new filtersRegistry.RemoveColor({
        threshold: 0.2,
        distance: 0.5
          })
        : null;
      break;
    case "blacknwhite":
      effect = filtersRegistry.BlackWhite ? new filtersRegistry.BlackWhite() : null;
      break;
    case "vibrance":
      effect = filtersRegistry.Vibrance
        ? new filtersRegistry.Vibrance({
        vibrance: 1,
          })
        : null;
      break;
    case "blendcolor":
      effect = new fabric.Image.filters.BlendColor({
        color: "#00ff00",
        mode: "multiply",
      });
      break;
    case "huerotate":
      effect = new fabric.Image.filters.HueRotation({
        rotation: 0.5,
      });
      break;
    case "resize":
      effect = new fabric.Image.filters.Resize();
      break;
    case "gamma":
      effect = filtersRegistry.Gamma
        ? new filtersRegistry.Gamma({
        gamma: [1, 0.5, 2.1]
          })
        : null;
      break;
    case "saturation":
      effect = new fabric.Image.filters.Saturation({
        saturation: 0.7,
      });
      break;
    default:
      effect = null;
      break;
  };

  return effect;
};
