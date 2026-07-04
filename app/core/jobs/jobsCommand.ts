import type { BuiltinHandler } from "../execution/types";
import type { Job, JobStore } from "./jobStore";

export function createJobsBuiltin(jobs: JobStore): BuiltinHandler {
  return ({ output }) => {
    for (const job of jobs.list()) {
      output.stdout.write(formatJob(job));
    }

    return { exitCode: 0 };
  };
}

function formatJob(job: Job): string {
  return `[${job.id}]+  ${job.status.padEnd(24)}${job.command} &\n`;
}
