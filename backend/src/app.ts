import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";
import incidentRoutes from "./routes/incident.routes";
import incidentUpdateRoutes from "./routes/incidentUpdate.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/projects", projectRoutes);

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1", incidentRoutes);

app.use("/api/v1", incidentUpdateRoutes);

  
export default app;
