import type { BuiltinHandler } from "../execution/types";
import type { Job, JobStore } from "./jobStore";

export function createJobsBuiltin(jobs: JobStore): BuiltinHandler {
  return ({ output }) => {
      const entries = jobs.list();


    for (const job of entries) {
      output.stdout.write(formatJob(job, markerFor(job, entries)));
    }

    return { exitCode: 0 };
  };
}

function markerFor(job: Job, jobs: readonly Job[]): string {
  const index = jobs.indexOf(job);

  if (index === jobs.length - 1) {
    return "+";
  }
  
  if (index === jobs.length - 2) {
    return "-";
  }

  return " ";
}

function formatJob(job: Job, marker: string): string {
  return `[${job.id}]${marker}  ${job.status.padEnd(24)}${job.command} &\n`;
}
