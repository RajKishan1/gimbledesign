import { Paddle, Environment } from "@paddle/paddle-node-sdk";

const globalForPaddle = globalThis as unknown as { paddle: Paddle };

const paddle =
  globalForPaddle.paddle ||
  new Paddle(process.env.PADDLE_API_KEY!, {
    environment:
      process.env.PADDLE_ENV === "production"
        ? Environment.production
        : Environment.sandbox,
  });

if (process.env.NODE_ENV !== "production") globalForPaddle.paddle = paddle;

export default paddle;
