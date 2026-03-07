import {
  __resetOfflineQueueForTests,
  executeWithOfflineQueue,
  getOfflineQueueSnapshot,
  processOfflineQueue,
  retryOfflineQueueItem,
} from "../src/offline/offlineActionQueue";
import { medicalApi } from "../src/api/medicalApi";
import { wellnessApi } from "../src/api/wellnessApi";

jest.mock("../src/api/medicalApi", () => ({
  medicalApi: {
    logSymptom: jest.fn(),
    postRoutineAssignmentAction: jest.fn(),
  },
}));

jest.mock("../src/api/wellnessApi", () => ({
  wellnessApi: {
    setIntakeMode: jest.fn(),
    submitPrevisitAnswer: jest.fn(),
    setAppointmentContext: jest.fn(),
  },
}));

const mockMedicalApi = medicalApi as jest.Mocked<typeof medicalApi>;
const mockWellnessApi = wellnessApi as jest.Mocked<typeof wellnessApi>;

describe("offlineActionQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetOfflineQueueForTests();
  });

  it("queues symptom action on retryable network failure", async () => {
    mockMedicalApi.logSymptom.mockRejectedValueOnce(new Error("Failed to fetch"));

    const result = await executeWithOfflineQueue({
      type: "medical.logSymptom",
      payload: {
        symptom_type_id: 1,
        occurred_at: "2026-03-07T00:00:00.000Z",
        severity: 3,
        description: "Rash",
      },
    });

    expect(result.mode).toBe("queued");
    expect(result.queueItemId).toBeTruthy();
    const queue = getOfflineQueueSnapshot();
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe("queued");
    expect(queue[0].action.type).toBe("medical.logSymptom");
  });

  it("replays queued actions and clears queue on success", async () => {
    mockMedicalApi.logSymptom.mockRejectedValueOnce(new Error("Network Error"));
    const queued = await executeWithOfflineQueue({
      type: "medical.logSymptom",
      payload: {
        symptom_type_id: 2,
        occurred_at: "2026-03-07T00:00:00.000Z",
        severity: 4,
        description: "Itch",
      },
    });
    expect(queued.mode).toBe("queued");

    mockMedicalApi.logSymptom.mockResolvedValueOnce({
      id: 99,
      symptom_type_id: 2,
      occurred_at: "2026-03-07T00:00:00.000Z",
      severity: 4,
      description: "Itch",
    });
    const processed = await processOfflineQueue();

    expect(processed.synced).toBe(1);
    expect(processed.failed).toBe(0);
    expect(processed.remaining).toBe(0);
    expect(getOfflineQueueSnapshot()).toHaveLength(0);
  });

  it("marks replay failures as failed and supports retry", async () => {
    mockWellnessApi.submitPrevisitAnswer.mockRejectedValueOnce(new Error("Failed to fetch"));
    const queued = await executeWithOfflineQueue({
      type: "wellness.submitPrevisitAnswer",
      payload: {
        sessionId: "session-1",
        questionId: 12,
        answer: "yes",
      },
    });
    expect(queued.mode).toBe("queued");
    const queueId = queued.queueItemId as string;

    mockWellnessApi.submitPrevisitAnswer.mockRejectedValueOnce(new Error("still down"));
    const firstReplay = await processOfflineQueue();
    expect(firstReplay.failed).toBe(1);
    expect(getOfflineQueueSnapshot()[0].status).toBe("failed");

    mockWellnessApi.submitPrevisitAnswer.mockResolvedValueOnce({ id: 10 });
    const retried = await retryOfflineQueueItem(queueId);
    expect(retried).toBe(true);
    expect(getOfflineQueueSnapshot()).toHaveLength(0);
  });

  it("injects idempotency key for routine assignment actions", async () => {
    mockMedicalApi.postRoutineAssignmentAction.mockResolvedValueOnce({
      id: 1,
      assignment_id: 42,
      event_type: "completed",
      actor_id: "tester",
      payload: {},
      created_at: "2026-03-07T00:00:00.000Z",
    });

    const result = await executeWithOfflineQueue({
      type: "medical.routineAssignmentAction",
      payload: {
        assignmentId: 42,
        payload: {
          action: "complete",
          timezone: "UTC",
        },
      },
    });

    expect(result.mode).toBe("synced");
    expect(mockMedicalApi.postRoutineAssignmentAction).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        action: "complete",
        timezone: "UTC",
        idempotency_key: expect.any(String),
      }),
    );
  });
});
