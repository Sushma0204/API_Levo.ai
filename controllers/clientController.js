import SwaggerParser from "swagger-parser";
import path, { join } from "path";
import { promises as fs } from "fs";
import SchemaVersion from "../models/schemaVersion.js";

export const runTest = async (req, res) => {
  try {
    const { application, service } = req.body;
    if (!application) {
      return res.status(400).json({ error: "application is required in body" });
    }

    // Find latest schema
    const query = { application };
    if (service) query.service = service;

    const latest = await SchemaVersion.findOne(query)
      .sort({ version: -1 })
      .lean();

    if (!latest) {
      return res.status(404).json({
        error: "No schema found for the given application/service",
      });
    }

    // Resolve schema file
    const filePath = latest.filePath
      ? (path.isAbsolute(latest.filePath)
          ? latest.filePath
          : join(process.cwd(), latest.filePath))
      : null;

    if (!filePath) {
      return res.status(500).json({ error: "No schema file found" });
    }

    // Validation
    let schemaContent = await fs.readFile(filePath, "utf8");
    let parsedSchema = null;
    let validationErrors = [];

    try {
      parsedSchema = await SwaggerParser.validate(filePath);
    } catch (err) {
      validationErrors.push(err.message);
    }

    const testSummary = {
      totalChecks: 1,
      passed: validationErrors.length === 0 ? 1 : 0,
      failed: validationErrors.length,
      details: validationErrors.length === 0
        ? [{
            id: "openapi-1",
            name: "OpenAPI schema validation",
            status: "passed",
            info: "Schema is valid"
          }]
        : [{
            id: "openapi-1",
            name: "OpenAPI schema validation",
            status: "failed",
            info: validationErrors.join("; ")
          }]
    };

    // Response Generation
    return res.json({
      application,
      service: service || null,
      schemaVersion: latest.version,
      schemaMetadata: {
        uploadedAt: latest.createdAt || latest.uploadedAt || null,
        uploadedBy: latest.uploader || latest.uploadedBy || null,
      },
      testSummary,
      schemaUsed: {
        content: schemaContent,
        filename: latest.filename || path.basename(filePath),
      },
      ranAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error("runTest error", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};
