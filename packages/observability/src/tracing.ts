import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

export function startTracing(serviceName: string) {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  });

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()]
  });

  sdk.start();

  return sdk;
}
