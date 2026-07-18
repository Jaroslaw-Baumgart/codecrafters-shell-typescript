import type { Job, JobStore } from "./jobStore";

interface JobOutput {
  write(data: string): void;
}

export function reportJobs(jobs: JobStore, output: JobOutput): void {
  const entries = jobs.list();

  for (const job of entries) {
    output.write(formatJob(job, markerFor(job, entries)));
  }

  removeDoneJobs(jobs, entries);
}

export function reportDoneJobs(jobs: JobStore, output: JobOutput): void {
  const entries = jobs.list();
  const doneJobs = entries.filter((job) => job.status === "Done");

  for (const job of doneJobs) {
    output.write(formatJob(job, markerFor(job, entries)));
  }

  removeDoneJobs(jobs, doneJobs);
}

function removeDoneJobs(jobs: JobStore, entries: readonly Job[]): void {
  for (const job of entries) {
    if (job.status === "Done") {
      jobs.remove(job.id);
    }
  }
}

function markerFor(job: Job, jobs: readonly Job[]): string {
  const sorted = [...jobs].sort((a, b) => a.id - b.id);
  const index = sorted.findIndex((item) => item.id === job.id);

  if (index === sorted.length - 1) return "+";
  if (index === sorted.length - 2) return "-";
  return " ";
}

function formatJob(job: Job, marker: string): string {
  const command = job.status === "Running" ? `${job.command} &` : job.command;

  return `[${job.id}]${marker}  ${job.status.padEnd(24)}${command}\n`;
}
