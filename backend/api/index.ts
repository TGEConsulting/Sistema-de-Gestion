import { createApp } from "../src/app";

// Punto de entrada para el runtime Node.js de Vercel: una app de Express es
// directamente un request handler (req, res) => void, compatible con la
// firma que espera una función serverless de Vercel. El servidor
// tradicional (src/server.ts, usado en Docker/Railway/Render/local) sigue
// existiendo aparte y no se toca.
export default createApp();
