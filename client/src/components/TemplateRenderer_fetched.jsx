import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/components/TemplateRenderer.jsx");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=3c02095d"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
let prevRefreshReg;
let prevRefreshSig;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = RefreshRuntime.getRefreshReg("C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx");
  window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;
}
import __vite__cjsImport3_react from "/node_modules/.vite/deps/react.js?v=3c02095d"; const React = __vite__cjsImport3_react.__esModule ? __vite__cjsImport3_react.default : __vite__cjsImport3_react;
export default function TemplateRenderer({ template, formData }) {
  if (!template) {
    return null;
  }
  const { width, height, backgroundColor, elements } = template;
  const getElementContent = (element) => {
    if (element.isDynamic && element.fieldKey) {
      const dynamicValue = formData?.[element.fieldKey];
      if (dynamicValue !== void 0 && dynamicValue !== null && dynamicValue !== "") {
        return dynamicValue;
      }
      return element.content || `{{${element.fieldKey}}}`;
    }
    return element.content;
  };
  const renderElement = (element) => {
    const content = getElementContent(element);
    const baseStyle = {
      position: "absolute",
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      transform: `rotate(${element.rotation || 0}deg)`,
      zIndex: element.zIndex || 0,
      fontFamily: element.fontFamily || "Inter, sans-serif",
      fontSize: `${element.fontSize || 14}px`,
      fontWeight: element.fontWeight || 400,
      color: element.color || "#000000",
      textAlign: element.textAlign || "left",
      lineHeight: element.lineHeight || 1.4,
      overflow: "hidden"
    };
    switch (element.type) {
      case "text":
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: {
              ...baseStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
              whiteSpace: "nowrap"
            },
            children: content
          },
          element.id,
          false,
          {
            fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
            lineNumber: 68,
            columnNumber: 11
          },
          this
        );
      case "shape":
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: {
              ...baseStyle,
              backgroundColor: element.color || "#000000"
            }
          },
          element.id,
          false,
          {
            fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
            lineNumber: 89,
            columnNumber: 11
          },
          this
        );
      case "barcode":
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: {
              ...baseStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ffffff"
            },
            children: content ? /* @__PURE__ */ jsxDEV(
              "img",
              {
                src: content,
                alt: "Barcode",
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
                lineNumber: 112,
                columnNumber: 13
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: {
                  width: "100%",
                  height: "100%",
                  background: "repeating-linear-gradient(90deg, #000 0px, #000 2px, transparent 2px, transparent 4px)"
                }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
                lineNumber: 122,
                columnNumber: 13
              },
              this
            )
          },
          element.id,
          false,
          {
            fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
            lineNumber: 101,
            columnNumber: 11
          },
          this
        );
      case "image":
        return /* @__PURE__ */ jsxDEV(
          "div",
          {
            style: {
              ...baseStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            children: content ? /* @__PURE__ */ jsxDEV(
              "img",
              {
                src: content,
                alt: "Element",
                style: {
                  width: "100%",
                  height: "100%",
                  objectFit: "contain"
                }
              },
              void 0,
              false,
              {
                fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
                lineNumber: 145,
                columnNumber: 13
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "div",
              {
                style: {
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  color: "#999"
                },
                children: "No Image"
              },
              void 0,
              false,
              {
                fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
                lineNumber: 155,
                columnNumber: 13
              },
              this
            )
          },
          element.id,
          false,
          {
            fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
            lineNumber: 135,
            columnNumber: 11
          },
          this
        );
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxDEV(
    "div",
    {
      className: "template-renderer",
      style: {
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor || "#ffffff",
        overflow: "hidden"
      },
      children: elements.map((element) => renderElement(element))
    },
    void 0,
    false,
    {
      fileName: "C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx",
      lineNumber: 179,
      columnNumber: 5
    },
    this
  );
}
_c = TemplateRenderer;
var _c;
$RefreshReg$(_c, "TemplateRenderer");
if (import.meta.hot && !inWebWorker) {
  window.$RefreshReg$ = prevRefreshReg;
  window.$RefreshSig$ = prevRefreshSig;
}
if (import.meta.hot && !inWebWorker) {
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/kosan/ZCodeProject/RG/client/src/components/TemplateRenderer.jsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBZ0RVOzs7Ozs7Ozs7Ozs7Ozs7O0FBN0NWLE9BQU9BLFdBQVc7QUFFbEIsd0JBQXdCQyxpQkFBaUIsRUFBRUMsVUFBVUMsU0FBUyxHQUFHO0FBQy9ELE1BQUksQ0FBQ0QsVUFBVTtBQUNiLFdBQU87QUFBQSxFQUNUO0FBRUEsUUFBTSxFQUFFRSxPQUFPQyxRQUFRQyxpQkFBaUJDLFNBQVMsSUFBSUw7QUFHckQsUUFBTU0sb0JBQW9CQSxDQUFDQyxZQUFZO0FBQ3JDLFFBQUlBLFFBQVFDLGFBQWFELFFBQVFFLFVBQVU7QUFDekMsWUFBTUMsZUFBZVQsV0FBV00sUUFBUUUsUUFBUTtBQUNoRCxVQUFJQyxpQkFBaUJDLFVBQWFELGlCQUFpQixRQUFRQSxpQkFBaUIsSUFBSTtBQUM5RSxlQUFPQTtBQUFBQSxNQUNUO0FBRUEsYUFBT0gsUUFBUUssV0FBVyxLQUFLTCxRQUFRRSxRQUFRO0FBQUEsSUFDakQ7QUFDQSxXQUFPRixRQUFRSztBQUFBQSxFQUNqQjtBQUdBLFFBQU1DLGdCQUFnQkEsQ0FBQ04sWUFBWTtBQUNqQyxVQUFNSyxVQUFVTixrQkFBa0JDLE9BQU87QUFDekMsVUFBTU8sWUFBWTtBQUFBLE1BQ2hCQyxVQUFVO0FBQUEsTUFDVkMsTUFBTSxHQUFHVCxRQUFRVSxDQUFDO0FBQUEsTUFDbEJDLEtBQUssR0FBR1gsUUFBUVksQ0FBQztBQUFBLE1BQ2pCakIsT0FBTyxHQUFHSyxRQUFRTCxLQUFLO0FBQUEsTUFDdkJDLFFBQVEsR0FBR0ksUUFBUUosTUFBTTtBQUFBLE1BQ3pCaUIsV0FBVyxVQUFVYixRQUFRYyxZQUFZLENBQUM7QUFBQSxNQUMxQ0MsUUFBUWYsUUFBUWUsVUFBVTtBQUFBLE1BQzFCQyxZQUFZaEIsUUFBUWdCLGNBQWM7QUFBQSxNQUNsQ0MsVUFBVSxHQUFHakIsUUFBUWlCLFlBQVksRUFBRTtBQUFBLE1BQ25DQyxZQUFZbEIsUUFBUWtCLGNBQWM7QUFBQSxNQUNsQ0MsT0FBT25CLFFBQVFtQixTQUFTO0FBQUEsTUFDeEJDLFdBQVdwQixRQUFRb0IsYUFBYTtBQUFBLE1BQ2hDQyxZQUFZckIsUUFBUXFCLGNBQWM7QUFBQSxNQUNsQ0MsVUFBVTtBQUFBLElBQ1o7QUFFQSxZQUFRdEIsUUFBUXVCLE1BQUk7QUFBQSxNQUNsQixLQUFLO0FBQ0gsZUFDRTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBRUMsT0FBTztBQUFBLGNBQ0wsR0FBR2hCO0FBQUFBLGNBQ0hpQixTQUFTO0FBQUEsY0FDVEMsWUFBWTtBQUFBLGNBQ1pDLGdCQUNFMUIsUUFBUW9CLGNBQWMsV0FDbEIsV0FDQXBCLFFBQVFvQixjQUFjLFVBQ3BCLGFBQ0E7QUFBQSxjQUNSTyxZQUFZO0FBQUEsWUFDZDtBQUFBLFlBRUN0QjtBQUFBQTtBQUFBQSxVQWRJTCxRQUFRNEI7QUFBQUEsVUFEZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBZ0JBO0FBQUEsTUFHSixLQUFLO0FBQ0gsZUFDRTtBQUFBLFVBQUM7QUFBQTtBQUFBLFlBRUMsT0FBTztBQUFBLGNBQ0wsR0FBR3JCO0FBQUFBLGNBQ0hWLGlCQUFpQkcsUUFBUW1CLFNBQVM7QUFBQSxZQUNwQztBQUFBO0FBQUEsVUFKS25CLFFBQVE0QjtBQUFBQSxVQURmO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsUUFLSTtBQUFBLE1BSVIsS0FBSztBQUVILGVBQ0U7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUVDLE9BQU87QUFBQSxjQUNMLEdBQUdyQjtBQUFBQSxjQUNIaUIsU0FBUztBQUFBLGNBQ1RDLFlBQVk7QUFBQSxjQUNaQyxnQkFBZ0I7QUFBQSxjQUNoQjdCLGlCQUFpQjtBQUFBLFlBQ25CO0FBQUEsWUFFQ1Esb0JBQ0M7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxLQUFLQTtBQUFBQSxnQkFDTCxLQUFJO0FBQUEsZ0JBQ0osT0FBTztBQUFBLGtCQUNMVixPQUFPO0FBQUEsa0JBQ1BDLFFBQVE7QUFBQSxrQkFDUmlDLFdBQVc7QUFBQSxnQkFDYjtBQUFBO0FBQUEsY0FQRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFPSSxJQUdKO0FBQUEsY0FBQztBQUFBO0FBQUEsZ0JBQ0MsT0FBTztBQUFBLGtCQUNMbEMsT0FBTztBQUFBLGtCQUNQQyxRQUFRO0FBQUEsa0JBQ1JrQyxZQUFZO0FBQUEsZ0JBQ2Q7QUFBQTtBQUFBLGNBTEY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBS0k7QUFBQTtBQUFBLFVBekJEOUIsUUFBUTRCO0FBQUFBLFVBRGY7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQTZCQTtBQUFBLE1BR0osS0FBSztBQUNILGVBQ0U7QUFBQSxVQUFDO0FBQUE7QUFBQSxZQUVDLE9BQU87QUFBQSxjQUNMLEdBQUdyQjtBQUFBQSxjQUNIaUIsU0FBUztBQUFBLGNBQ1RDLFlBQVk7QUFBQSxjQUNaQyxnQkFBZ0I7QUFBQSxZQUNsQjtBQUFBLFlBRUNyQixvQkFDQztBQUFBLGNBQUM7QUFBQTtBQUFBLGdCQUNDLEtBQUtBO0FBQUFBLGdCQUNMLEtBQUk7QUFBQSxnQkFDSixPQUFPO0FBQUEsa0JBQ0xWLE9BQU87QUFBQSxrQkFDUEMsUUFBUTtBQUFBLGtCQUNSaUMsV0FBVztBQUFBLGdCQUNiO0FBQUE7QUFBQSxjQVBGO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU9JLElBR0o7QUFBQSxjQUFDO0FBQUE7QUFBQSxnQkFDQyxPQUFPO0FBQUEsa0JBQ0xsQyxPQUFPO0FBQUEsa0JBQ1BDLFFBQVE7QUFBQSxrQkFDUkMsaUJBQWlCO0FBQUEsa0JBQ2pCMkIsU0FBUztBQUFBLGtCQUNUQyxZQUFZO0FBQUEsa0JBQ1pDLGdCQUFnQjtBQUFBLGtCQUNoQlQsVUFBVTtBQUFBLGtCQUNWRSxPQUFPO0FBQUEsZ0JBQ1Q7QUFBQSxnQkFBRTtBQUFBO0FBQUEsY0FWSjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsWUFhQTtBQUFBO0FBQUEsVUFoQ0duQixRQUFRNEI7QUFBQUEsVUFEZjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBbUNBO0FBQUEsTUFHSjtBQUNFLGVBQU87QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUVBLFNBQ0U7QUFBQSxJQUFDO0FBQUE7QUFBQSxNQUNDLFdBQVU7QUFBQSxNQUNWLE9BQU87QUFBQSxRQUNMcEIsVUFBVTtBQUFBLFFBQ1ZiLE9BQU8sR0FBR0EsS0FBSztBQUFBLFFBQ2ZDLFFBQVEsR0FBR0EsTUFBTTtBQUFBLFFBQ2pCQyxpQkFBaUJBLG1CQUFtQjtBQUFBLFFBQ3BDeUIsVUFBVTtBQUFBLE1BQ1o7QUFBQSxNQUVDeEIsbUJBQVNpQyxJQUFJLENBQUMvQixZQUFZTSxjQUFjTixPQUFPLENBQUM7QUFBQTtBQUFBLElBVm5EO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBO0FBRUo7QUFBQ2dDLEtBdkt1QnhDO0FBQWdCLElBQUF3QztBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJSZWFjdCIsIlRlbXBsYXRlUmVuZGVyZXIiLCJ0ZW1wbGF0ZSIsImZvcm1EYXRhIiwid2lkdGgiLCJoZWlnaHQiLCJiYWNrZ3JvdW5kQ29sb3IiLCJlbGVtZW50cyIsImdldEVsZW1lbnRDb250ZW50IiwiZWxlbWVudCIsImlzRHluYW1pYyIsImZpZWxkS2V5IiwiZHluYW1pY1ZhbHVlIiwidW5kZWZpbmVkIiwiY29udGVudCIsInJlbmRlckVsZW1lbnQiLCJiYXNlU3R5bGUiLCJwb3NpdGlvbiIsImxlZnQiLCJ4IiwidG9wIiwieSIsInRyYW5zZm9ybSIsInJvdGF0aW9uIiwiekluZGV4IiwiZm9udEZhbWlseSIsImZvbnRTaXplIiwiZm9udFdlaWdodCIsImNvbG9yIiwidGV4dEFsaWduIiwibGluZUhlaWdodCIsIm92ZXJmbG93IiwidHlwZSIsImRpc3BsYXkiLCJhbGlnbkl0ZW1zIiwianVzdGlmeUNvbnRlbnQiLCJ3aGl0ZVNwYWNlIiwiaWQiLCJvYmplY3RGaXQiLCJiYWNrZ3JvdW5kIiwibWFwIiwiX2MiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsiVGVtcGxhdGVSZW5kZXJlci5qc3giXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVGVtcGxhdGVSZW5kZXJlcjogSlNPTi1kcml2ZW4gdGVtcGxhdGUgcmVuZGVyaW5nIGNvbXBvbmVudFxyXG4vLyBSZW5kZXJzIHRlbXBsYXRlcyBiYXNlZCBvbiB0aGUgc3RhbmRhcmQgc2NoZW1hIHdpdGggZHluYW1pYyBkYXRhIHN1YnN0aXR1dGlvblxyXG5cclxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFRlbXBsYXRlUmVuZGVyZXIoeyB0ZW1wbGF0ZSwgZm9ybURhdGEgfSkge1xyXG4gIGlmICghdGVtcGxhdGUpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgY29uc3QgeyB3aWR0aCwgaGVpZ2h0LCBiYWNrZ3JvdW5kQ29sb3IsIGVsZW1lbnRzIH0gPSB0ZW1wbGF0ZTtcclxuXHJcbiAgLy8gR2V0IHRoZSBkaXNwbGF5IGNvbnRlbnQgZm9yIGFuIGVsZW1lbnQgKHN1YnN0aXR1dGluZyBkeW5hbWljIGRhdGEgaWYgbmVlZGVkKVxyXG4gIGNvbnN0IGdldEVsZW1lbnRDb250ZW50ID0gKGVsZW1lbnQpID0+IHtcclxuICAgIGlmIChlbGVtZW50LmlzRHluYW1pYyAmJiBlbGVtZW50LmZpZWxkS2V5KSB7XHJcbiAgICAgIGNvbnN0IGR5bmFtaWNWYWx1ZSA9IGZvcm1EYXRhPy5bZWxlbWVudC5maWVsZEtleV07XHJcbiAgICAgIGlmIChkeW5hbWljVmFsdWUgIT09IHVuZGVmaW5lZCAmJiBkeW5hbWljVmFsdWUgIT09IG51bGwgJiYgZHluYW1pY1ZhbHVlICE9PSAnJykge1xyXG4gICAgICAgIHJldHVybiBkeW5hbWljVmFsdWU7XHJcbiAgICAgIH1cclxuICAgICAgLy8gUmV0dXJuIHBsYWNlaG9sZGVyIGlmIG5vIGRhdGEgZXhpc3RzIHlldFxyXG4gICAgICByZXR1cm4gZWxlbWVudC5jb250ZW50IHx8IGB7eyR7ZWxlbWVudC5maWVsZEtleX19fWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZWxlbWVudC5jb250ZW50O1xyXG4gIH07XHJcblxyXG4gIC8vIFJlbmRlciBpbmRpdmlkdWFsIGVsZW1lbnQgYmFzZWQgb24gdHlwZVxyXG4gIGNvbnN0IHJlbmRlckVsZW1lbnQgPSAoZWxlbWVudCkgPT4ge1xyXG4gICAgY29uc3QgY29udGVudCA9IGdldEVsZW1lbnRDb250ZW50KGVsZW1lbnQpO1xyXG4gICAgY29uc3QgYmFzZVN0eWxlID0ge1xyXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcclxuICAgICAgbGVmdDogYCR7ZWxlbWVudC54fXB4YCxcclxuICAgICAgdG9wOiBgJHtlbGVtZW50Lnl9cHhgLFxyXG4gICAgICB3aWR0aDogYCR7ZWxlbWVudC53aWR0aH1weGAsXHJcbiAgICAgIGhlaWdodDogYCR7ZWxlbWVudC5oZWlnaHR9cHhgLFxyXG4gICAgICB0cmFuc2Zvcm06IGByb3RhdGUoJHtlbGVtZW50LnJvdGF0aW9uIHx8IDB9ZGVnKWAsXHJcbiAgICAgIHpJbmRleDogZWxlbWVudC56SW5kZXggfHwgMCxcclxuICAgICAgZm9udEZhbWlseTogZWxlbWVudC5mb250RmFtaWx5IHx8ICdJbnRlciwgc2Fucy1zZXJpZicsXHJcbiAgICAgIGZvbnRTaXplOiBgJHtlbGVtZW50LmZvbnRTaXplIHx8IDE0fXB4YCxcclxuICAgICAgZm9udFdlaWdodDogZWxlbWVudC5mb250V2VpZ2h0IHx8IDQwMCxcclxuICAgICAgY29sb3I6IGVsZW1lbnQuY29sb3IgfHwgJyMwMDAwMDAnLFxyXG4gICAgICB0ZXh0QWxpZ246IGVsZW1lbnQudGV4dEFsaWduIHx8ICdsZWZ0JyxcclxuICAgICAgbGluZUhlaWdodDogZWxlbWVudC5saW5lSGVpZ2h0IHx8IDEuNCxcclxuICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgfTtcclxuXHJcbiAgICBzd2l0Y2ggKGVsZW1lbnQudHlwZSkge1xyXG4gICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICBrZXk9e2VsZW1lbnQuaWR9XHJcbiAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgLi4uYmFzZVN0eWxlLFxyXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDpcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dEFsaWduID09PSAnY2VudGVyJ1xyXG4gICAgICAgICAgICAgICAgICA/ICdjZW50ZXInXHJcbiAgICAgICAgICAgICAgICAgIDogZWxlbWVudC50ZXh0QWxpZ24gPT09ICdyaWdodCdcclxuICAgICAgICAgICAgICAgICAgICA/ICdmbGV4LWVuZCdcclxuICAgICAgICAgICAgICAgICAgICA6ICdmbGV4LXN0YXJ0JyxcclxuICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge2NvbnRlbnR9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApO1xyXG5cclxuICAgICAgY2FzZSAnc2hhcGUnOlxyXG4gICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgIGtleT17ZWxlbWVudC5pZH1cclxuICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAuLi5iYXNlU3R5bGUsXHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBlbGVtZW50LmNvbG9yIHx8ICcjMDAwMDAwJyxcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgIC8+XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIGNhc2UgJ2JhcmNvZGUnOlxyXG4gICAgICAgIC8vIEZvciBiYXJjb2RlIGVsZW1lbnRzLCB3ZSdsbCByZW5kZXIgYSBwbGFjZWhvbGRlciBvciB0aGUgYWN0dWFsIGJhcmNvZGVcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICBrZXk9e2VsZW1lbnQuaWR9XHJcbiAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgLi4uYmFzZVN0eWxlLFxyXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAnI2ZmZmZmZicsXHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHtjb250ZW50ID8gKFxyXG4gICAgICAgICAgICAgIDxpbWdcclxuICAgICAgICAgICAgICAgIHNyYz17Y29udGVudH1cclxuICAgICAgICAgICAgICAgIGFsdD1cIkJhcmNvZGVcIlxyXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgIG9iamVjdEZpdDogJ2NvbnRhaW4nLFxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAncmVwZWF0aW5nLWxpbmVhci1ncmFkaWVudCg5MGRlZywgIzAwMCAwcHgsICMwMDAgMnB4LCB0cmFuc3BhcmVudCAycHgsIHRyYW5zcGFyZW50IDRweCknLFxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIGNhc2UgJ2ltYWdlJzpcclxuICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICBrZXk9e2VsZW1lbnQuaWR9XHJcbiAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgLi4uYmFzZVN0eWxlLFxyXG4gICAgICAgICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcclxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicsXHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHtjb250ZW50ID8gKFxyXG4gICAgICAgICAgICAgIDxpbWdcclxuICAgICAgICAgICAgICAgIHNyYz17Y29udGVudH1cclxuICAgICAgICAgICAgICAgIGFsdD1cIkVsZW1lbnRcIlxyXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAgICAgd2lkdGg6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgIG9iamVjdEZpdDogJ2NvbnRhaW4nLFxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgIHN0eWxlPXt7XHJcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICcjZjBmMGYwJyxcclxuICAgICAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxyXG4gICAgICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAganVzdGlmeUNvbnRlbnQ6ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICBmb250U2l6ZTogJzEycHgnLFxyXG4gICAgICAgICAgICAgICAgICBjb2xvcjogJyM5OTknLFxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICBObyBJbWFnZVxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXZcclxuICAgICAgY2xhc3NOYW1lPVwidGVtcGxhdGUtcmVuZGVyZXJcIlxyXG4gICAgICBzdHlsZT17e1xyXG4gICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgIHdpZHRoOiBgJHt3aWR0aH1weGAsXHJcbiAgICAgICAgaGVpZ2h0OiBgJHtoZWlnaHR9cHhgLFxyXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogYmFja2dyb3VuZENvbG9yIHx8ICcjZmZmZmZmJyxcclxuICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXHJcbiAgICAgIH19XHJcbiAgICA+XHJcbiAgICAgIHtlbGVtZW50cy5tYXAoKGVsZW1lbnQpID0+IHJlbmRlckVsZW1lbnQoZWxlbWVudCkpfVxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG4iXSwiZmlsZSI6IkM6L1VzZXJzL2tvc2FuL1pDb2RlUHJvamVjdC9SRy9jbGllbnQvc3JjL2NvbXBvbmVudHMvVGVtcGxhdGVSZW5kZXJlci5qc3gifQ==