jest.mock("../src/auth/tokenStorage", () => ({
  getAccessToken: jest.fn().mockResolvedValue("test-token"),
}));

jest.mock("../src/api/config", () => ({
  API_BASE_URL: "http://test-api.local",
  APP_VERSION: "1.0.0",
  APP_PLATFORM: "ios",
}));

type ListenerFn = (event: { data?: string }) => void;
type ErrorListenerFn = (event: unknown) => void;

const mockClose = jest.fn();
const listeners: Record<string, (ListenerFn | ErrorListenerFn)[]> = {};

jest.mock("react-native-sse", () => {
  return jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn((event: string, cb: ListenerFn | ErrorListenerFn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    close: mockClose,
  }));
});

import { streamChat } from "../src/stream/streamChat";
import type { ModelStreamEvent } from "../src/types/ai";

beforeEach(() => {
  jest.clearAllMocks();
  for (const key of Object.keys(listeners)) {
    delete listeners[key];
  }
});

describe("streamChat", () => {
  it("calls onEvent for each parsed SSE message", async () => {
    const onEvent = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent,
    });

    const messageListener = listeners["message"]?.[0] as ListenerFn;
    expect(messageListener).toBeDefined();

    const event: ModelStreamEvent = { type: "token", content: "hi" };
    messageListener({ data: JSON.stringify(event) });
    expect(onEvent).toHaveBeenCalledWith(event);
  });

  it("closes connection and calls onComplete on 'complete' event", async () => {
    const onEvent = jest.fn();
    const onComplete = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent,
      onComplete,
    });

    const messageListener = listeners["message"]?.[0] as ListenerFn;
    const completeEvent: ModelStreamEvent = { type: "complete" };
    messageListener({ data: JSON.stringify(completeEvent) });

    expect(mockClose).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it("closes connection and calls onComplete on 'error' event type", async () => {
    const onEvent = jest.fn();
    const onComplete = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent,
      onComplete,
    });

    const messageListener = listeners["message"]?.[0] as ListenerFn;
    const errorEvent: ModelStreamEvent = { type: "error", content: "fail" };
    messageListener({ data: JSON.stringify(errorEvent) });

    expect(mockClose).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it("calls onError when SSE event data is not valid JSON", async () => {
    const onEvent = jest.fn();
    const onError = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent,
      onError,
    });

    const messageListener = listeners["message"]?.[0] as ListenerFn;
    messageListener({ data: "not-json" });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toContain("Failed to parse SSE event");
  });

  it("skips messages with no data", async () => {
    const onEvent = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent,
    });

    const messageListener = listeners["message"]?.[0] as ListenerFn;
    messageListener({ data: undefined });
    expect(onEvent).not.toHaveBeenCalled();
  });

  it("calls onError and closes on SSE connection error", async () => {
    const onError = jest.fn();
    await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent: jest.fn(),
      onError,
    });

    const errorListener = listeners["error"]?.[0] as ErrorListenerFn;
    expect(errorListener).toBeDefined();
    errorListener("connection reset");

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].message).toContain("SSE connection error");
    expect(mockClose).toHaveBeenCalled();
  });

  it("returns a cleanup function that closes the connection", async () => {
    const cleanup = await streamChat({
      sessionId: "s1",
      message: "hello",
      onEvent: jest.fn(),
    });

    cleanup();
    expect(mockClose).toHaveBeenCalled();
  });
});
