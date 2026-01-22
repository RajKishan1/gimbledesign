"use client";

import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Type, Palette, Box, Layout, Code, Copy, Check, ChevronDown, Pencil } from "lucide-react";

// Theme color variables that can be used
const THEME_COLOR_VARIABLES = [
  { name: "Background", variable: "var(--background)", cssVar: "--background" },
  { name: "Foreground", variable: "var(--foreground)", cssVar: "--foreground" },
  { name: "Primary", variable: "var(--primary)", cssVar: "--primary" },
  { name: "Primary Foreground", variable: "var(--primary-foreground)", cssVar: "--primary-foreground" },
  { name: "Secondary", variable: "var(--secondary)", cssVar: "--secondary" },
  { name: "Secondary Foreground", variable: "var(--secondary-foreground)", cssVar: "--secondary-foreground" },
  { name: "Accent", variable: "var(--accent)", cssVar: "--accent" },
  { name: "Accent Foreground", variable: "var(--accent-foreground)", cssVar: "--accent-foreground" },
  { name: "Muted", variable: "var(--muted)", cssVar: "--muted" },
  { name: "Muted Foreground", variable: "var(--muted-foreground)", cssVar: "--muted-foreground" },
  { name: "Card", variable: "var(--card)", cssVar: "--card" },
  { name: "Card Foreground", variable: "var(--card-foreground)", cssVar: "--card-foreground" },
  { name: "Destructive", variable: "var(--destructive)", cssVar: "--destructive" },
  { name: "Border", variable: "var(--border)", cssVar: "--border" },
  { name: "Transparent", variable: "transparent", cssVar: "transparent" },
  { name: "White", variable: "#ffffff", cssVar: "#ffffff" },
  { name: "Black", variable: "#000000", cssVar: "#000000" },
];

interface ElementStyles {
  // Typography
  color: string;
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  textDecoration: string;
  // Background
  backgroundColor: string;
  backgroundImage: string;
  // Spacing
  padding: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  margin: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  // Border
  border: string;
  borderRadius: string;
  borderColor: string;
  borderWidth: string;
  borderStyle: string;
  // Layout
  display: string;
  position: string;
  flexDirection: string;
  justifyContent: string;
  alignItems: string;
  gap: string;
  // Size
  width: string;
  height: string;
  minWidth: string;
  minHeight: string;
  maxWidth: string;
  maxHeight: string;
  // Effects
  opacity: string;
  boxShadow: string;
  overflow: string;
}

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  rect: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
  text: string;
  uniqueKey: string;
  // Extended properties for selected elements
  styles?: ElementStyles;
  attributes?: Record<string, string>;
  innerHTML?: string;
  computedWidth?: number;
  computedHeight?: number;
}

interface ElementHoverOverlayProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isActive: boolean;
  onElementSelect?: (element: ElementInfo | null) => void;
}

const ElementHoverOverlay: React.FC<ElementHoverOverlayProps> = ({
  iframeRef,
  isActive,
  onElementSelect,
}) => {
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [copiedProperty, setCopiedProperty] = useState<string | null>(null);

  // Show properties panel when element is selected
  useEffect(() => {
    if (selectedElement) {
      setShowPropertiesPanel(true);
    }
  }, [selectedElement]);

  // Close properties panel
  const handleClosePanel = useCallback(() => {
    setShowPropertiesPanel(false);
    setSelectedElement(null);
    // Notify iframe to deselect
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "DESELECT_ELEMENT" }, "*");
    }
  }, [iframeRef]);

  // Copy to clipboard
  const handleCopyValue = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedProperty(key);
      setTimeout(() => setCopiedProperty(null), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);

  // Listen for hover and click messages from iframe
  useEffect(() => {
    if (!isActive) {
      setHoveredElement(null);
      setSelectedElement(null);
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ELEMENT_HOVER") {
        setHoveredElement(event.data.element);
      } else if (event.data.type === "ELEMENT_LEAVE") {
        setHoveredElement(null);
      } else if (event.data.type === "ELEMENT_CLICK") {
        const clickedElement = event.data.element;
        if (clickedElement) {
          setSelectedElement(clickedElement);
          onElementSelect?.(clickedElement);
        }
      } else if (event.data.type === "ELEMENT_DESELECT") {
        setSelectedElement(null);
        onElementSelect?.(null);
      } else if (event.data.type === "ELEMENT_UPDATED") {
        // Update selected element with new info after style/text change
        const updatedElement = event.data.element;
        if (updatedElement) {
          setSelectedElement(updatedElement);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isActive, onElementSelect]);

  // Clear selection when isActive becomes false
  useEffect(() => {
    if (!isActive) {
      setSelectedElement(null);
    }
  }, [isActive]);

  // Inject hover detection script into iframe when it loads
  useEffect(() => {
    if (!isActive) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const injectHoverScript = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc || !iframeDoc.body) {
          // Retry if document not ready
          setTimeout(injectHoverScript, 100);
          return;
        }

        // Check if script is already injected
        if (iframeDoc.getElementById("hover-detection-script")) {
          return;
        }

        const script = iframeDoc.createElement("script");
        script.id = "hover-detection-script";
        script.textContent = `
          (function() {
            let lastElement = null;
            let selectedElement = null;
            let isEnabled = true;
            let elementCounter = 0;
            const elementKeyMap = new WeakMap();
            
            // Elements to ignore (usually containers or layout wrappers)
            const ignoredTags = ['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'META', 'LINK'];
            
            function getElementUniqueKey(element) {
              if (!elementKeyMap.has(element)) {
                elementKeyMap.set(element, 'el-' + (++elementCounter));
              }
              return elementKeyMap.get(element);
            }
            
            function getComputedStyles(element) {
              const computed = window.getComputedStyle(element);
              return {
                // Typography
                color: computed.color,
                fontSize: computed.fontSize,
                fontFamily: computed.fontFamily,
                fontWeight: computed.fontWeight,
                lineHeight: computed.lineHeight,
                letterSpacing: computed.letterSpacing,
                textAlign: computed.textAlign,
                textDecoration: computed.textDecoration,
                // Background
                backgroundColor: computed.backgroundColor,
                backgroundImage: computed.backgroundImage,
                // Spacing
                padding: computed.padding,
                paddingTop: computed.paddingTop,
                paddingRight: computed.paddingRight,
                paddingBottom: computed.paddingBottom,
                paddingLeft: computed.paddingLeft,
                margin: computed.margin,
                marginTop: computed.marginTop,
                marginRight: computed.marginRight,
                marginBottom: computed.marginBottom,
                marginLeft: computed.marginLeft,
                // Border
                border: computed.border,
                borderRadius: computed.borderRadius,
                borderColor: computed.borderColor,
                borderWidth: computed.borderWidth,
                borderStyle: computed.borderStyle,
                // Layout
                display: computed.display,
                position: computed.position,
                flexDirection: computed.flexDirection,
                justifyContent: computed.justifyContent,
                alignItems: computed.alignItems,
                gap: computed.gap,
                // Size
                width: computed.width,
                height: computed.height,
                minWidth: computed.minWidth,
                minHeight: computed.minHeight,
                maxWidth: computed.maxWidth,
                maxHeight: computed.maxHeight,
                // Effects
                opacity: computed.opacity,
                boxShadow: computed.boxShadow,
                overflow: computed.overflow,
              };
            }
            
            function getElementAttributes(element) {
              const attrs = {};
              for (const attr of element.attributes) {
                if (attr.name !== 'style') {
                  attrs[attr.name] = attr.value;
                }
              }
              return attrs;
            }
            
            function getElementInfo(element, includeDetails = false) {
              if (!element || ignoredTags.includes(element.tagName)) return null;
              
              const rect = element.getBoundingClientRect();
              
              // Skip elements that are too small or invisible
              if (rect.width < 5 || rect.height < 5) return null;
              
              // Get meaningful text content (limited)
              let text = '';
              if (element.tagName === 'INPUT') {
                text = element.placeholder || element.value || '';
              } else if (element.tagName === 'IMG') {
                text = element.alt || 'Image';
              } else {
                // Get direct text content, not from children
                const textNodes = Array.from(element.childNodes)
                  .filter(node => node.nodeType === Node.TEXT_NODE)
                  .map(node => node.textContent.trim())
                  .join(' ');
                text = textNodes || element.textContent?.trim() || '';
              }
              
              const info = {
                tagName: element.tagName.toLowerCase(),
                className: element.className || '',
                id: element.id || '',
                rect: {
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                },
                text: text.slice(0, 500),
                uniqueKey: getElementUniqueKey(element),
              };
              
              // Include detailed properties for selected elements
              if (includeDetails) {
                info.styles = getComputedStyles(element);
                info.attributes = getElementAttributes(element);
                info.innerHTML = element.innerHTML.slice(0, 1000);
                info.computedWidth = rect.width;
                info.computedHeight = rect.height;
              }
              
              return info;
            }
            
            function findDeepestElement(x, y) {
              // Get element at point
              let element = document.elementFromPoint(x, y);
              if (!element) return null;
              
              // Walk up the tree to find a meaningful element if current is too generic
              // But prefer the deepest (most specific) element
              let current = element;
              
              while (current && ignoredTags.includes(current.tagName)) {
                current = current.parentElement;
              }
              
              return current;
            }
            
            function handleMouseMove(e) {
              if (!isEnabled) return;
              
              const element = findDeepestElement(e.clientX, e.clientY);
              
              if (element !== lastElement) {
                lastElement = element;
                
                if (element) {
                  const info = getElementInfo(element, false);
                  if (info) {
                    window.parent.postMessage({
                      type: 'ELEMENT_HOVER',
                      element: info,
                    }, '*');
                  } else {
                    window.parent.postMessage({ type: 'ELEMENT_LEAVE' }, '*');
                  }
                } else {
                  window.parent.postMessage({ type: 'ELEMENT_LEAVE' }, '*');
                }
              }
            }
            
            function handleMouseLeave() {
              lastElement = null;
              window.parent.postMessage({ type: 'ELEMENT_LEAVE' }, '*');
            }
            
            function handleClick(e) {
              if (!isEnabled) return;
              
              e.preventDefault();
              e.stopPropagation();
              
              const element = findDeepestElement(e.clientX, e.clientY);
              
              if (element) {
                const info = getElementInfo(element, true); // Include full details
                if (info) {
                  selectedElement = element;
                  window.parent.postMessage({
                    type: 'ELEMENT_CLICK',
                    element: info,
                  }, '*');
                }
              }
            }
            
            // Add event listeners
            document.addEventListener('mousemove', handleMouseMove, { passive: true });
            document.addEventListener('mouseleave', handleMouseLeave);
            document.addEventListener('click', handleClick, { capture: true });
            
            // Listen for enable/disable messages
            window.addEventListener('message', (e) => {
              if (e.data.type === 'HOVER_ENABLE') {
                isEnabled = true;
              } else if (e.data.type === 'HOVER_DISABLE') {
                isEnabled = false;
                lastElement = null;
                selectedElement = null;
              } else if (e.data.type === 'DESELECT_ELEMENT') {
                selectedElement = null;
                window.parent.postMessage({ type: 'ELEMENT_DESELECT' }, '*');
              } else if (e.data.type === 'UPDATE_SELECTED_RECT') {
                // Update rect for selected element (in case of scroll/resize)
                if (selectedElement) {
                  const info = getElementInfo(selectedElement, true);
                  if (info) {
                    window.parent.postMessage({
                      type: 'ELEMENT_CLICK',
                      element: info,
                    }, '*');
                  }
                }
              } else if (e.data.type === 'UPDATE_ELEMENT_STYLE') {
                // Update element styles
                if (selectedElement && e.data.styles) {
                  Object.entries(e.data.styles).forEach(([prop, value]) => {
                    selectedElement.style[prop] = value;
                  });
                  // Send back updated element info
                  const info = getElementInfo(selectedElement, true);
                  if (info) {
                    window.parent.postMessage({
                      type: 'ELEMENT_UPDATED',
                      element: info,
                    }, '*');
                  }
                }
              } else if (e.data.type === 'UPDATE_ELEMENT_TEXT') {
                // Update element text content
                if (selectedElement && e.data.text !== undefined) {
                  // Find the text node or update textContent
                  const textNodes = Array.from(selectedElement.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE);
                  if (textNodes.length > 0) {
                    textNodes[0].textContent = e.data.text;
                  } else if (selectedElement.childNodes.length === 0 || 
                             (selectedElement.childNodes.length === 1 && 
                              selectedElement.firstChild.nodeType === Node.TEXT_NODE)) {
                    selectedElement.textContent = e.data.text;
                  }
                  // Send back updated element info
                  const info = getElementInfo(selectedElement, true);
                  if (info) {
                    window.parent.postMessage({
                      type: 'ELEMENT_UPDATED',
                      element: info,
                    }, '*');
                  }
                }
              }
            });
            
            // Signal that hover detection is ready
            window.parent.postMessage({ type: 'HOVER_READY' }, '*');
          })();
        `;
        iframeDoc.body.appendChild(script);
      } catch (error) {
        console.warn("Could not inject hover script:", error);
      }
    };

    // Inject script when iframe loads
    const handleIframeLoad = () => {
      setTimeout(injectHoverScript, 200);
    };

    // Try to inject immediately if iframe already loaded
    injectHoverScript();

    // Also listen for load event in case iframe reloads
    iframe.addEventListener("load", handleIframeLoad);

    return () => {
      iframe.removeEventListener("load", handleIframeLoad);
    };
  }, [isActive, iframeRef]);

  // Enable/disable hover detection based on isActive
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    try {
      iframe.contentWindow.postMessage(
        { type: isActive ? "HOVER_ENABLE" : "HOVER_DISABLE" },
        "*"
      );
    } catch (error) {
      // Ignore cross-origin errors
    }
  }, [isActive, iframeRef]);

  // Build element identifier for tooltip
  const getElementLabel = useCallback((element: ElementInfo) => {
    const { tagName, text, className, id } = element;
    
    if (id) return `#${id}`;
    if (tagName === "input") return "Input";
    if (tagName === "button") return "Button";
    if (tagName === "img") return "Image";
    if (tagName === "a") return "Link";
    if (tagName === "iconify-icon") return "Icon";
    if (text && text.length > 0 && text.length < 20) return text;
    
    // Try to get a meaningful class name
    const classNames = className.toString().split(/\s+/).filter(Boolean);
    const meaningfulClass = classNames.find(c => 
      !c.startsWith("flex") && 
      !c.startsWith("w-") && 
      !c.startsWith("h-") &&
      !c.startsWith("p-") &&
      !c.startsWith("m-") &&
      !c.startsWith("bg-") &&
      !c.startsWith("text-") &&
      c.length > 2
    );
    if (meaningfulClass) return meaningfulClass;
    
    return tagName;
  }, []);

  // Check if hovered element is the same as selected element
  const isHoveredSameAsSelected = 
    hoveredElement && 
    selectedElement && 
    hoveredElement.uniqueKey === selectedElement.uniqueKey;

  if (!isActive) return null;
  
  // Don't render anything if nothing is hovered or selected
  if (!hoveredElement && !selectedElement) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {/* Selected element - solid border */}
      {selectedElement && (
        <>
          <div
            className={cn(
              "absolute border-2 border-solid border-blue-600",
              "transition-all duration-75 ease-out",
              "bg-blue-500/5"
            )}
            style={{
              left: selectedElement.rect.left,
              top: selectedElement.rect.top,
              width: selectedElement.rect.width,
              height: selectedElement.rect.height,
            }}
          >
            {/* Corner handles for selected element */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-600 rounded-sm border border-white shadow-sm" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-sm border border-white shadow-sm" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-600 rounded-sm border border-white shadow-sm" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-600 rounded-sm border border-white shadow-sm" />
          </div>

          {/* Selected element label */}
          <div
            className={cn(
              "absolute px-1.5 py-0.5 rounded text-[10px] font-medium",
              "bg-blue-600 text-white shadow-md whitespace-nowrap",
              "transition-all duration-75 ease-out"
            )}
            style={{
              left: selectedElement.rect.left,
              top: Math.max(0, selectedElement.rect.top - 22),
            }}
          >
            {getElementLabel(selectedElement)}
          </div>

          {/* Dimension indicators for selected element */}
          {selectedElement.rect.width > 50 && selectedElement.rect.height > 30 && (
            <div
              className="absolute px-1 py-0.5 rounded text-[9px] font-mono bg-blue-600 text-white shadow-sm"
              style={{
                left: selectedElement.rect.left + selectedElement.rect.width / 2,
                top: selectedElement.rect.top + selectedElement.rect.height + 6,
                transform: "translateX(-50%)",
              }}
            >
              {Math.round(selectedElement.rect.width)} × {Math.round(selectedElement.rect.height)}
            </div>
          )}
        </>
      )}

      {/* Hovered element - dashed border (only if different from selected) */}
      {hoveredElement && !isHoveredSameAsSelected && (
        <>
          <div
            className={cn(
              "absolute border-2 border-dashed border-blue-400",
              "transition-all duration-75 ease-out"
            )}
            style={{
              left: hoveredElement.rect.left,
              top: hoveredElement.rect.top,
              width: hoveredElement.rect.width,
              height: hoveredElement.rect.height,
            }}
          >
            {/* Corner indicators for hovered element */}
            <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-blue-400 rounded-sm" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-sm" />
            <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-blue-400 rounded-sm" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-400 rounded-sm" />
          </div>

          {/* Hovered element label tooltip (only show if no selected element, or if not overlapping with selected label) */}
          {(!selectedElement || Math.abs(hoveredElement.rect.top - selectedElement.rect.top) > 30) && (
            <div
              className={cn(
                "absolute px-1.5 py-0.5 rounded text-[10px] font-medium",
                "bg-blue-400 text-white shadow-md whitespace-nowrap",
                "transition-all duration-75 ease-out"
              )}
              style={{
                left: hoveredElement.rect.left,
                top: Math.max(0, hoveredElement.rect.top - 20),
              }}
            >
              {getElementLabel(hoveredElement)}
            </div>
          )}
        </>
      )}

      {/* Properties Panel */}
      {showPropertiesPanel && selectedElement && (
        <ElementPropertiesPanel
          element={selectedElement}
          onClose={handleClosePanel}
          onCopyValue={handleCopyValue}
          copiedProperty={copiedProperty}
          iframeRef={iframeRef}
          onElementUpdate={(updatedElement) => setSelectedElement(updatedElement)}
        />
      )}
    </div>
  );
};

// Properties Panel Component
interface PropertiesPanelProps {
  element: ElementInfo;
  onClose: () => void;
  onCopyValue: (value: string, key: string) => void;
  copiedProperty: string | null;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onElementUpdate: (element: ElementInfo) => void;
}

const ElementPropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  onClose,
  onCopyValue,
  copiedProperty,
  iframeRef,
  onElementUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "styles" | "layout">("edit");
  const [editableText, setEditableText] = useState(element.text || "");
  
  // Padding state
  const [paddingTop, setPaddingTop] = useState(element.styles?.paddingTop || "0px");
  const [paddingRight, setPaddingRight] = useState(element.styles?.paddingRight || "0px");
  const [paddingBottom, setPaddingBottom] = useState(element.styles?.paddingBottom || "0px");
  const [paddingLeft, setPaddingLeft] = useState(element.styles?.paddingLeft || "0px");
  
  // Color state
  const [textColor, setTextColor] = useState(element.styles?.color || "");
  const [bgColor, setBgColor] = useState(element.styles?.backgroundColor || "");
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [bgColorOpen, setBgColorOpen] = useState(false);
  
  // Border radius state
  const [borderRadius, setBorderRadius] = useState(element.styles?.borderRadius || "0px");
  
  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when element changes
  useEffect(() => {
    setEditableText(element.text || "");
    setPaddingTop(element.styles?.paddingTop || "0px");
    setPaddingRight(element.styles?.paddingRight || "0px");
    setPaddingBottom(element.styles?.paddingBottom || "0px");
    setPaddingLeft(element.styles?.paddingLeft || "0px");
    setTextColor(element.styles?.color || "");
    setBgColor(element.styles?.backgroundColor || "");
    setBorderRadius(element.styles?.borderRadius || "0px");
    setHasChanges(false);
  }, [element]);

  // Send style update to iframe
  const updateElementStyle = useCallback((styles: Record<string, string>) => {
    console.log("updateElementStyle called with:", styles); // Debug log
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      console.log("Sending UPDATE_ELEMENT_STYLE to iframe"); // Debug log
      iframe.contentWindow.postMessage({
        type: "UPDATE_ELEMENT_STYLE",
        styles,
      }, "*");
    } else {
      console.log("iframe or contentWindow not available"); // Debug log
    }
  }, [iframeRef]);

  // Send text update to iframe
  const updateElementText = useCallback((text: string) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "UPDATE_ELEMENT_TEXT",
        text,
      }, "*");
    }
  }, [iframeRef]);

  // Handle Save - just close the panel (changes already applied in real-time)
  const handleSave = useCallback(() => {
    onClose();
  }, [onClose]);

  // Helper to format value with px
  const formatWithPx = (val: string) => val.match(/^\d+$/) ? `${val}px` : val;

  // Handle padding change - apply immediately
  const handlePaddingChange = (side: string, value: string) => {
    setHasChanges(true);
    const formattedValue = formatWithPx(value);
    
    switch (side) {
      case "top":
        setPaddingTop(value);
        updateElementStyle({ paddingTop: formattedValue });
        break;
      case "right":
        setPaddingRight(value);
        updateElementStyle({ paddingRight: formattedValue });
        break;
      case "bottom":
        setPaddingBottom(value);
        updateElementStyle({ paddingBottom: formattedValue });
        break;
      case "left":
        setPaddingLeft(value);
        updateElementStyle({ paddingLeft: formattedValue });
        break;
    }
  };

  // Handle color change - apply immediately
  const handleColorChange = (property: "color" | "backgroundColor", value: string) => {
    console.log("handleColorChange called:", property, value); // Debug log
    setHasChanges(true);
    
    if (property === "color") {
      setTextColor(value);
      setTextColorOpen(false);
    }
    if (property === "backgroundColor") {
      setBgColor(value);
      setBgColorOpen(false);
    }
    
    // Apply immediately to the element
    console.log("Calling updateElementStyle with:", { [property]: value }); // Debug log
    updateElementStyle({ [property]: value });
  };
  
  // Handle text change - apply immediately
  const handleTextChange = (value: string) => {
    setEditableText(value);
    setHasChanges(true);
    updateElementText(value);
  };
  
  // Handle border radius change - apply immediately
  const handleBorderRadiusChange = (value: string) => {
    setBorderRadius(value);
    setHasChanges(true);
    updateElementStyle({ borderRadius: formatWithPx(value) });
  };

  // Extract numeric value from padding
  const extractNumber = (value: string) => {
    const match = value.match(/^(\d+)/);
    return match ? match[1] : "0";
  };

  // Helper to render color preview
  const ColorPreview = ({ color }: { color: string }) => {
    if (!color || color === "rgba(0, 0, 0, 0)" || color === "transparent") {
      return <span className="text-gray-400 text-xs">transparent</span>;
    }
    return (
      <div className="flex items-center gap-1.5">
        <div
          className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600 shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs font-mono truncate">{color}</span>
      </div>
    );
  };

  // Property Row Component
  const PropertyRow = ({ label, value, copyKey }: { label: string; value: string; copyKey?: string }) => {
    if (!value || value === "none" || value === "normal" || value === "auto") return null;
    const key = copyKey || label;
    return (
      <div className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded group">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs font-mono text-gray-900 dark:text-gray-100 truncate max-w-[140px]">
            {value}
          </span>
          <button
            onClick={() => onCopyValue(value, key)}
            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
          >
            {copiedProperty === key ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Section Header
  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/80 rounded-md mb-1">
      <Icon className="w-3.5 h-3.5 text-blue-500" />
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</span>
    </div>
  );

  // Color Selector Dropdown
  const ColorSelector = ({ 
    isOpen, 
    onSelect, 
    currentColor 
  }: { 
    isOpen: boolean; 
    onSelect: (value: string) => void;
    currentColor: string;
  }) => {
    if (!isOpen) return null;
    
    const handleSelect = (e: React.MouseEvent, value: string) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Color selected:", value); // Debug log
      onSelect(value);
    };
    
    return (
      <div 
        className="absolute right-0 top-full mt-1 z-100 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 max-h-64 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {THEME_COLOR_VARIABLES.map((color) => (
          <button
            key={color.variable}
            type="button"
            onClick={(e) => handleSelect(e, color.variable)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
              currentColor === color.variable && "bg-blue-50 dark:bg-blue-900/30"
            )}
          >
            <div
              className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 shrink-0"
              style={{ backgroundColor: color.variable }}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
              {color.name}
            </span>
          </button>
        ))}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
          <button
            type="button"
            onClick={(e) => handleSelect(e, "transparent")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <div className="w-5 h-5 rounded border border-gray-300 dark:border-gray-600 bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-size-[8px_8px]" />
            <span className="text-xs text-gray-700 dark:text-gray-300">None / Transparent</span>
          </button>
        </div>
      </div>
    );
  };

  const styles = element.styles;

  return (
    <div 
      className="fixed top-4 right-4 w-80 max-h-[85vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center">
            <Code className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              &lt;{element.tagName}&gt;
            </h3>
            {element.id && (
              <span className="text-[10px] text-gray-500">#{element.id}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "edit", label: "Edit", icon: Pencil },
          { id: "styles", label: "Styles", icon: Palette },
          { id: "layout", label: "Layout", icon: Layout },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-2">
        {/* Edit Tab - Editable properties */}
        {activeTab === "edit" && (
          <div className="space-y-4">
            {/* Text Content Editor */}
            {element.text && (
              <div>
                <SectionHeader icon={Type} title="Text Content" />
                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <textarea
                    value={editableText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter text content..."
                  />
                  {editableText !== element.text && (
                    <div className="mt-1 text-[10px] text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Modified
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colors Section */}
            <div>
              <SectionHeader icon={Palette} title="Colors" />
              <div className="space-y-2 p-2">
                {/* Text Color */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Text Color</span>
                    <button
                      onClick={() => {
                        setTextColorOpen(!textColorOpen);
                        setBgColorOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <div
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: textColor || styles?.color }}
                      />
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  <ColorSelector
                    isOpen={textColorOpen}
                    onSelect={(value) => handleColorChange("color", value)}
                    currentColor={textColor || styles?.color || ""}
                  />
                  {textColor && textColor !== styles?.color && (
                    <div className="mt-1 text-[10px] text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Modified
                    </div>
                  )}
                </div>

                {/* Background Color */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Background</span>
                    <button
                      onClick={() => {
                        setBgColorOpen(!bgColorOpen);
                        setTextColorOpen(false);
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <div
                        className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: bgColor || styles?.backgroundColor }}
                      />
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  <ColorSelector
                    isOpen={bgColorOpen}
                    onSelect={(value) => handleColorChange("backgroundColor", value)}
                    currentColor={bgColor || styles?.backgroundColor || ""}
                  />
                  {bgColor && bgColor !== styles?.backgroundColor && (
                    <div className="mt-1 text-[10px] text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Modified
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Padding Section */}
            <div>
              <SectionHeader icon={Box} title="Padding" />
              <div className="p-2">
                <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-3">
                  {/* Top */}
                  <div className="flex justify-center mb-2">
                    <input
                      type="text"
                      value={extractNumber(paddingTop)}
                      onChange={(e) => handlePaddingChange("top", e.target.value)}
                      className="w-12 px-1 py-0.5 text-xs text-center bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Middle row */}
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={extractNumber(paddingLeft)}
                      onChange={(e) => handlePaddingChange("left", e.target.value)}
                      className="w-12 px-1 py-0.5 text-xs text-center bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mx-2">
                      <span className="text-[9px] text-gray-500">content</span>
                    </div>
                    <input
                      type="text"
                      value={extractNumber(paddingRight)}
                      onChange={(e) => handlePaddingChange("right", e.target.value)}
                      className="w-12 px-1 py-0.5 text-xs text-center bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Bottom */}
                  <div className="flex justify-center mt-2">
                    <input
                      type="text"
                      value={extractNumber(paddingBottom)}
                      onChange={(e) => handlePaddingChange("bottom", e.target.value)}
                      className="w-12 px-1 py-0.5 text-xs text-center bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-1">Values in pixels</p>
                {(paddingTop !== element.styles?.paddingTop || 
                  paddingRight !== element.styles?.paddingRight || 
                  paddingBottom !== element.styles?.paddingBottom || 
                  paddingLeft !== element.styles?.paddingLeft) && (
                  <div className="mt-1 text-[10px] text-amber-500 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    Modified
                  </div>
                )}
              </div>
            </div>

            {/* Border Radius */}
            {styles?.borderRadius && styles.borderRadius !== "0px" && (
              <div>
                <SectionHeader icon={Box} title="Border Radius" />
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={extractNumber(borderRadius)}
                      onChange={(e) => handleBorderRadiusChange(e.target.value)}
                      className="w-16 px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                  {borderRadius !== element.styles?.borderRadius && (
                    <div className="mt-1 text-[10px] text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Modified
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done Button - Only show when on Edit tab */}
        {activeTab === "edit" && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3 mt-4 -mx-2 -mb-2">
            <button
              onClick={handleSave}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Done
            </button>
            {hasChanges && (
              <p className="text-[10px] text-green-500 text-center mt-2">
                Changes applied in real-time
              </p>
            )}
          </div>
        )}

        {activeTab === "styles" && styles && (
          <div className="space-y-3">
            {/* Typography */}
            <div>
              <SectionHeader icon={Type} title="Typography" />
              <div className="space-y-0.5">
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="text-xs text-gray-500">Color</span>
                  <ColorPreview color={styles.color} />
                </div>
                <PropertyRow label="Font Size" value={styles.fontSize} />
                <PropertyRow label="Font Weight" value={styles.fontWeight} />
                <PropertyRow label="Font Family" value={styles.fontFamily?.split(",")[0]?.trim()} />
                <PropertyRow label="Line Height" value={styles.lineHeight} />
                <PropertyRow label="Letter Spacing" value={styles.letterSpacing} />
                <PropertyRow label="Text Align" value={styles.textAlign} />
              </div>
            </div>

            {/* Background */}
            <div>
              <SectionHeader icon={Palette} title="Background" />
              <div className="space-y-0.5">
                <div className="flex items-center justify-between py-1.5 px-2">
                  <span className="text-xs text-gray-500">Background</span>
                  <ColorPreview color={styles.backgroundColor} />
                </div>
              </div>
            </div>

            {/* Border */}
            <div>
              <SectionHeader icon={Box} title="Border" />
              <div className="space-y-0.5">
                <PropertyRow label="Border Radius" value={styles.borderRadius} />
                <PropertyRow label="Border Width" value={styles.borderWidth} />
                <PropertyRow label="Border Style" value={styles.borderStyle} />
                {styles.borderColor && styles.borderColor !== "rgb(0, 0, 0)" && (
                  <div className="flex items-center justify-between py-1.5 px-2">
                    <span className="text-xs text-gray-500">Border Color</span>
                    <ColorPreview color={styles.borderColor} />
                  </div>
                )}
                <PropertyRow label="Box Shadow" value={styles.boxShadow} />
              </div>
            </div>

            {/* Effects */}
            <div>
              <SectionHeader icon={Palette} title="Effects" />
              <div className="space-y-0.5">
                <PropertyRow label="Opacity" value={styles.opacity} />
                <PropertyRow label="Overflow" value={styles.overflow} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "layout" && styles && (
          <div className="space-y-3">
            {/* Dimensions */}
            <div>
              <SectionHeader icon={Box} title="Dimensions" />
              <div className="grid grid-cols-2 gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round(element.computedWidth || 0)}
                  </div>
                  <div className="text-[10px] text-gray-500">Width</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-900 rounded">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Math.round(element.computedHeight || 0)}
                  </div>
                  <div className="text-[10px] text-gray-500">Height</div>
                </div>
              </div>
            </div>

            {/* Display */}
            <div>
              <SectionHeader icon={Layout} title="Display" />
              <div className="space-y-0.5">
                <PropertyRow label="Display" value={styles.display} />
                <PropertyRow label="Position" value={styles.position} />
                <PropertyRow label="Flex Direction" value={styles.flexDirection} />
                <PropertyRow label="Justify Content" value={styles.justifyContent} />
                <PropertyRow label="Align Items" value={styles.alignItems} />
                <PropertyRow label="Gap" value={styles.gap} />
              </div>
            </div>

            {/* Spacing */}
            <div>
              <SectionHeader icon={Box} title="Spacing (Read-only)" />
              {/* Padding Visual */}
              <div className="p-2">
                <div className="text-[10px] text-center text-gray-500 mb-1">Padding</div>
                <div className="relative border border-dashed border-blue-300 dark:border-blue-700 rounded p-1">
                  <div className="text-[10px] text-center text-blue-500">{styles.paddingTop}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-500">{styles.paddingLeft}</span>
                    <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-[9px] text-gray-500">content</span>
                    </div>
                    <span className="text-[10px] text-blue-500">{styles.paddingRight}</span>
                  </div>
                  <div className="text-[10px] text-center text-blue-500">{styles.paddingBottom}</div>
                </div>
              </div>
              {/* Margin Visual */}
              <div className="p-2">
                <div className="text-[10px] text-center text-gray-500 mb-1">Margin</div>
                <div className="relative border border-dashed border-orange-300 dark:border-orange-700 rounded p-1">
                  <div className="text-[10px] text-center text-orange-500">{styles.marginTop}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-orange-500">{styles.marginLeft}</span>
                    <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-[9px] text-gray-500">element</span>
                    </div>
                    <span className="text-[10px] text-orange-500">{styles.marginRight}</span>
                  </div>
                  <div className="text-[10px] text-center text-orange-500">{styles.marginBottom}</div>
                </div>
              </div>
            </div>

            {/* Class Names */}
            {element.className && (
              <div>
                <SectionHeader icon={Code} title="CSS Classes" />
                <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex flex-wrap gap-1">
                    {element.className.toString().split(/\s+/).filter(Boolean).map((cls, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                      >
                        .{cls}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onCopyValue(element.className.toString(), "classes")}
                    className="mt-2 flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
                  >
                    {copiedProperty === "classes" ? (
                      <>
                        <Check className="w-3 h-3" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy all classes
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ElementHoverOverlay;
