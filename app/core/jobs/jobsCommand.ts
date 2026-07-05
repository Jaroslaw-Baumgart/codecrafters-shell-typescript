import type { BuiltinHandler } from "../execution/types";
import type { Job, JobStore } from "./jobStore";

export function createJobsBuiltin(jobs: JobStore): BuiltinHandler {
  return ({ output }) => {
      const entries = jobs.list();


    for (const job of entries) {
      output.stdout.write(formatJob(job, markerFor(job, entries)));
    }

    for (const job of entries) {
      if (job.status === "Done") {
        jobs.remove(job.id);
      }
    }

    return { exitCode: 0 };
  };
}

function markerFor(job: Job, jobs: readonly Job[]): string {
  const sorted = [...jobs].sort((a, b) => a.id - b.id);
  const index = sorted.findIndex((item) => item.id === job.id);

  if (index === jobs.length - 1) {
    return "+";
  }
  
  if (index === jobs.length - 2) {
    return "-";
  }

  return " ";
}

function formatJob(job: Job, marker: string): string {
  const command = job.status === "Running"
    ? `${job.command} &`
    : job.command;

  return `[${job.id}]${marker}  ${job.status.padEnd(24)}${command}\n`;
}
