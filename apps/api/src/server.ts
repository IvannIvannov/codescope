import Fastify from "fastify";
import { analyzeCode } from "@codescope/analyzer";

const app = Fastify({
  logger: true,
});

interface AnalyzeCodeBody {
  code: string;
}

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.post<{ Body: AnalyzeCodeBody }>("/analyze/code", async (request, reply) => {
  const { code } = request.body;

  if (!code || !code.trim()) {
    return reply.status(400).send({
      error: "Code is required.",
    });
  }

  const report = analyzeCode(code);

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
