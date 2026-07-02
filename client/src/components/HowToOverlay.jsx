import { X, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'template-editor-how-to-seen';

function HowToOverlay({ onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      setIsVisible(true);
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[#e0e0e0] bg-white p-6 shadow-[0_24px_70px_rgba(0,0,0,0.2)] md:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 rounded-none bg-[#ff0000]/10 p-2">
              <Info size={24} className="text-[#ff0000]" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 md:text-2xl">Welcome to LedgerX</h2>
          </div>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center border border-[#e0e0e0] bg-[#f5f5f5] text-gray-600"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-gray-700 md:space-y-6">
          <section>
            <h3 className="mb-2 text-base md:text-lg font-semibold text-gray-900">Getting Started</h3>
            <p className="mb-3 text-sm md:text-base">
              LedgerX lets you create custom ledger templates that can be used across the workspace.
              Drag and drop elements onto the canvas to design your template.
            </p>
          </section>

          <section>
            <h3 className="mb-2 text-base md:text-lg font-semibold text-gray-900">Key Features</h3>
            <ul className="space-y-2 text-sm md:text-base">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>
                  <strong>Element Palette:</strong> Add text, images, shapes, and barcodes to your template
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>
                  <strong>Dynamic Fields:</strong> Mark elements as dynamic to create form fields in LedgerX
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>
                  <strong>Properties Panel:</strong> Customize element appearance, size, and position
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-600 flex-shrink-0" />
                <span>
                  <strong>Auto-Save:</strong> Your work is automatically saved to the server
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-base md:text-lg font-semibold text-gray-900">Creating Dynamic Templates</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm md:text-base">
              <li>Add elements to your template using the palette</li>
              <li>Select an element and check "Is Dynamic" in the properties panel</li>
              <li>Choose a field type (e.g., customer name, transaction date)</li>
              <li>Set placeholder text to guide users</li>
              <li>Save your template</li>
              <li>Use it in LedgerX to fill in dynamic data</li>
            </ol>
          </section>

          <section className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Pro Tips</h3>
            <ul className="space-y-1 text-sm">
              <li>• Use Shift+Click to select multiple elements</li>
              <li>• Drag on empty space to select multiple elements at once</li>
              <li>• Use the properties panel to adjust z-order (layering)</li>
              <li>• Export your template as PNG for sharing or printing</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 flex justify-end md:mt-8">
          <button
            onClick={handleClose}
            className="w-full border border-[#ff0000] bg-[#ff0000] px-6 py-2.5 font-semibold text-white transition hover:bg-[#d60000] md:w-auto"
            type="button"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowToOverlay;