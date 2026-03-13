import React from "react";
import { ProgressBoard } from "../../../src/components/ProgressBoard";
import { TrajectoryBoard } from "../../../src/components/TrajectoryBoard";
import { ScreenShell } from "../../../src/components/common/ScreenShell";

export default function ProgressScreen() {
  return (
    <ScreenShell
      title="Progress Story"
      subtitle="A warmer view of your momentum, patterns, and proof."
    >
      <TrajectoryBoard />
      <ProgressBoard days={30} />
    </ScreenShell>
  );
}
