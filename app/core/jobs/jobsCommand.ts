import type { BuiltinHandler } from "../execution/types";
import type { JobStore } from "./jobStore";
import { reportJobs } from "./jobReporter";

export function createJobsBuiltin(jobs: JobStore): BuiltinHandler {
  return ({ output }) => {
    reportJobs(jobs, output.stdout);
    return { exitCode: 0 };
  };
}
