'use client'

import { useState } from 'react'

const DEVICES = [
  { name: 'iPhone 6.9"', label: '16 Pro Max', width: 1320, height: 2868 },
  { name: 'iPhone 6.7"', label: '15 Pro Max', width: 1290, height: 2796 },
  { name: 'iPhone 6.5"', label: '11 Pro Max', width: 1242, height: 2688 },
  { name: 'iPhone 5.5"', label: '8 Plus', width: 1242, height: 2208 },
]

const SCREENS = [
  { name: 'Home', path: '/', description: 'Main landing with dropdowns' },
  { name: 'Where to Watch', path: '/?demo=streaming', description: 'Streaming modal open' },
  { name: 'My Games', path: '/?demo=mygames', description: 'My Games modal open' },
]

export default function ScreenshotHelper() {
  const [selectedDevice, setSelectedDevice] = useState(DEVICES[0])

  const previewScale = 0.18
  const previewWidth = selectedDevice.width * previewScale
  const previewHeight = selectedDevice.height * previewScale

  const openFullSize = (path: string) => {
    // Device pixels are 3x CSS pixels for retina — use CSS dimensions
    const cssWidth = Math.round(selectedDevice.width / 3)
    const cssHeight = Math.round(selectedDevice.height / 3)
    const popup = window.open(
      path,
      '_blank',
      `width=${cssWidth},height=${cssHeight},menubar=no,toolbar=no,location=no,status=no`
    )
    if (!popup) alert('Popup blocked — please allow popups for this site.')
  }

  const openAtDevicePixels = (path: string) => {
    // Open at actual pixel dimensions (for high-DPI screenshot tools)
    const popup = window.open(
      path,
      '_blank',
      `width=${selectedDevice.width},height=${selectedDevice.height},menubar=no,toolbar=no,location=no,status=no`
    )
    if (!popup) alert('Popup blocked — please allow popups for this site.')
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">App Store Screenshot Capture</h1>
        <p className="text-gray-400 mb-8">
          Select a device size, then open screens at full size to capture screenshots.
        </p>

        {/* Device selector */}
        <div className="flex flex-wrap gap-3 mb-8">
          {DEVICES.map((device) => (
            <button
              key={device.name}
              onClick={() => setSelectedDevice(device)}
              className={`px-4 py-3 rounded-lg border transition-all text-sm ${
                selectedDevice.name === device.name
                  ? 'border-green-400 bg-green-400/10 text-green-400'
                  : 'border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-semibold">{device.name}</div>
              <div className="text-xs opacity-70">{device.label} — {device.width}×{device.height}</div>
            </button>
          ))}
        </div>

        {/* Selected device info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-lg mb-1">{selectedDevice.name} ({selectedDevice.label})</h2>
          <p className="text-gray-400 text-sm">
            Required: {selectedDevice.width} × {selectedDevice.height}px
          </p>
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <p><strong>How to capture at exact pixel dimensions:</strong></p>
            <p>1. Click &quot;Open Full Size&quot; on any screen below</p>
            <p>2. In Chrome DevTools (F12), toggle device toolbar (Ctrl+Shift+M)</p>
            <p>3. Set dimensions to {selectedDevice.width} × {selectedDevice.height} and DPR to 1</p>
            <p>4. Use DevTools screenshot: Ctrl+Shift+P → &quot;Capture screenshot&quot;</p>
            <p>This gives you a PNG at exactly {selectedDevice.width}×{selectedDevice.height}px.</p>
          </div>
        </div>

        {/* Screen cards */}
        <h2 className="text-xl font-semibold mb-4">Screens to Capture</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SCREENS.map((screen) => (
            <div
              key={screen.name}
              className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
            >
              {/* Preview iframe */}
              <div
                className="relative bg-gray-950 flex items-center justify-center"
                style={{ height: previewHeight + 40 }}
              >
                <div
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                    overflow: 'hidden',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <iframe
                    src={screen.path}
                    style={{
                      width: selectedDevice.width / 3,
                      height: selectedDevice.height / 3,
                      transform: `scale(${previewScale * 3})`,
                      transformOrigin: 'top left',
                      border: 'none',
                      pointerEvents: 'none',
                    }}
                    tabIndex={-1}
                  />
                </div>
              </div>

              {/* Info + buttons */}
              <div className="p-4">
                <h3 className="font-semibold text-lg">{screen.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{screen.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => openFullSize(screen.path)}
                    className="flex-1 px-3 py-2 rounded bg-green-500/20 border border-green-500/40
                      text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                  >
                    Open Full Size
                  </button>
                  <button
                    onClick={() => openAtDevicePixels(screen.path)}
                    className="px-3 py-2 rounded bg-gray-800 border border-gray-700
                      text-gray-300 text-sm font-medium hover:bg-gray-700 transition-colors"
                    title={`Open at ${selectedDevice.width}×${selectedDevice.height}`}
                  >
                    1:1 Pixels
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-10 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3">Capture Workflow</h2>
          <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
            <li>Start the dev server: <code className="px-1.5 py-0.5 bg-gray-800 rounded text-green-400">npm run dev</code></li>
            <li>Select the device size above (start with iPhone 6.9&quot;)</li>
            <li>Click &quot;Open Full Size&quot; on each screen</li>
            <li>In the popup, open Chrome DevTools (F12) → toggle device toolbar (Ctrl+Shift+M)</li>
            <li>Set exact dimensions: <strong>{selectedDevice.width} × {selectedDevice.height}</strong>, DPR: <strong>1</strong></li>
            <li>For &quot;Where to Watch&quot;: select a team + state, click the button, then capture</li>
            <li>For &quot;My Games&quot;: add some favorites first, then click &quot;My Games&quot;</li>
            <li>Capture: Ctrl+Shift+P → type &quot;screenshot&quot; → &quot;Capture screenshot&quot;</li>
            <li>Repeat for each device size</li>
          </ol>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm">
            <strong>Tip:</strong> App Store Connect accepts the 6.7&quot; screenshots for the 6.9&quot; slot (same aspect ratio).
            The 6.5&quot; and 5.5&quot; have different ratios and need their own captures.
          </div>
        </div>
      </div>
    </main>
  )
}
