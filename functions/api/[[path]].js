// Adaptador para Cloudflare Pages Functions.
// Mantém a lógica da API no Worker existente e permite que o projeto
// continue sendo publicado pelo fluxo Pages conectado ao GitHub.
import worker from "../../index.js";

export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
