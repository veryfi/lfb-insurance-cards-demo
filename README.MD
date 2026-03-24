# Veryfi Lens Anydoc Demo

A demo app for capturing and extracting document data using the Veryfi Lens WASM SDK.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Veryfi client ID to the `.env` file:
   ```
   VITE_VERYFI_CLIENT_ID=your_client_id_here
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Configuration

The scanner is configured for health insurance card processing in `src/main.js`:

| Setting                | Value                       | Description                          |
|------------------------|-----------------------------|--------------------------------------|
| `anydocMaxPages`       | `2`                         | Max pages to capture (front & back)  |
| `selectedBlueprint`    | `us_health_insurance_card`  | Document type blueprint              |
| `anydocShowFlipMessage`| `true`                      | Prompt user to flip the card         |
| `autoDocumentCapture`  | toggle on UI                | Auto-capture when document is detected |

## Customization

SDK component style overrides (modals, buttons, controls) live in `src/lens-overrides.css` using CSS custom properties exposed by the SDK.

## Testing on Mobile Devices

The camera API requires HTTPS. To test on a mobile device you can either use **ngrok** or a **local SSL proxy**.

### Option A: ngrok

1. Start the dev server and run ngrok:
   ```bash
   npm run dev
   ngrok http 5173
   ```

2. Add ngrok's hostname to `vite.config.js`:
   ```js
   export default defineConfig({
     server: {
       allowedHosts: ['your-subdomain.ngrok-free.app'],
     },
   });
   ```

3. Open the ngrok URL on your mobile device.

### Option B: Local SSL Proxy

1. Generate a local SSL certificate (replace the IP with your machine's local IP):
   ```bash
   mkcert localhost 192.168.X.XX
   ```

2. Copy the generated `.pem` files to the project root.

3. Run the SSL proxy to forward HTTPS traffic to the Vite dev server:
   ```bash
   npx local-ssl-proxy --key certname-key.pem --cert certname.pem --source 3001 --target 5173
   ```
> **Note:** `--target` is the port of the project's dev server (Vite defaults to `5173`), `--source` is the HTTPS port you'll open on your mobile device.

4. On your mobile device, navigate to `https://192.168.X.XX:3001`.

> **Note:** You must explicitly type `https://` in the address bar — the browser will not add it automatically.