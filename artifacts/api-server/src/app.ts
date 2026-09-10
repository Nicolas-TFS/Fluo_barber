import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { renderPublicBookingPage } from "./public-booking-page";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

app.get("/book/:shopId", (req, res) => {
  res.type("html").send(renderPublicBookingPage(req.params.shopId));
});

app.use("/api", router);

export default app;
