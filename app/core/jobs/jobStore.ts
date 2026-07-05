export type JobStatus = "Running" | "Done";

export interface Job {
  id: number;
  pid: number;
  command: string;
  status: JobStatus;
}

export class JobStore {
  private nextJobId(): number {
    const ids = [...this.jobs.keys()];

    if (ids.length === 0) return 1;

    return Math.max(...ids) + 1;
  }
  private readonly jobs = new Map<number, Job>();

  add(pid: number, command: string): Job {
    const job = {
      id: this.nextJobId(),
      pid,
      command,
      status: "Running" as const,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  markDone(id: number): void {
    const job = this.jobs.get(id);
    if (!job) return ;

    job.status = "Done";
  }

  remove(id: number): void {
    this.jobs.delete(id);
  }

  list(): Job[] {
    return [...this.jobs.values()];
  }
}
