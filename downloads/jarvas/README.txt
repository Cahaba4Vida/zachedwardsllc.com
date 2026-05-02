Jarvas Desktop (portable local Windows desktop app)

What this pack does
- Runs Jarvas Desktop in a local Windows app window (Tkinter)
- Starts a bundled/private Ollama runtime on http://127.0.0.1:11435
- Reuses a shared Ollama cache across Jarvas copies by default
- Reuses a shared models folder across Jarvas copies by default
- Keeps each Jarvas app copy lightweight while avoiding repeated Ollama/model downloads

What is included
- Jarvas desktop app source and launchers
- A bootstrapper that downloads the official standalone Ollama Windows CLI zip on first run if it is not already cached
- Local Ollama startup scripts that run `ollama serve` on port 11435

Shared cache behavior
- Default shared cache root: %LOCALAPPDATA%\JarvasDesktopShared
- Shared Ollama zip: %LOCALAPPDATA%\JarvasDesktopShared\ollama_bundle\ollama-windows-amd64.zip
- Shared Ollama runtime: %LOCALAPPDATA%\JarvasDesktopShared\ollama-runtime
- Shared models: %LOCALAPPDATA%\JarvasDesktopShared\models
- Every new Jarvas copy will reuse those shared paths automatically
- You can override the shared root by setting JARVAS_SHARED_HOME before launch

Important
- This pack removes the need for a preinstalled local Ollama app, but the first run still needs internet if the official Ollama zip is not already cached in the shared folder.
- For a fully offline first run, place the official `ollama-windows-amd64.zip` file in the shared cache folder before launching.
- On first run, the bootstrapper also pulls a lightweight default model (llama3.2:1b) into the shared models folder so Jarvas has something ready to use.
- Windows 10 22H2+ and Python 3.11+ are still required.

Quick start
1) Unzip this folder anywhere
2) Double-click `Jarvas-Install-and-Run.bat`
3) The bootstrapper will reuse the shared Ollama zip/runtime/models if they already exist
4) If nothing is cached yet, it downloads/extracts Ollama once, pulls llama3.2:1b once, starts it locally on 127.0.0.1:11435, then launches Jarvas Desktop
5) Use `Stop-Local-Ollama.bat` when you want to stop the shared local server

Notes
- This is still not a signed MSI/EXE installer.
- Preview opens workspace output in your default browser for HTML rendering.
- If you want a packaged EXE later, use `Build-EXE-If-You-Have-PyInstaller.bat`.
