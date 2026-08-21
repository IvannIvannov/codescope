import Fastify from "fastify";
import cors from "@fastify/cors";

import { analyzeCode, type AnalyzerConfig } from "@codescope/analyzer";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
});

interface AnalyzeCodeBody {
  code: string;
  config?: Partial<AnalyzerConfig>;
}

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.post<{ Body: AnalyzeCodeBody }>("/analyze/code", async (request, reply) => {
  const { code, config } = request.body;

  if (!code || !code.trim()) {
    return reply.status(400).send({
      error: "Code is required.",
    });
  }

  const report = analyzeCode(code, config);

  return {
    report,
  };
});

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
