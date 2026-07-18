interface JobBase {
  readonly id: number;
  readonly pid: number;
  readonly command: string;
}

export type Job =
  | (JobBase & {
      readonly status: "Running";
    })
  | (JobBase & {
      readonly status: "Done";
      readonly exitCode: number;
    });

export class JobStore {
  private nextJobId(): number {
    const ids = [...this.jobs.keys()];

    if (ids.length === 0) return 1;

    return Math.max(...ids) + 1;
  }
  private readonly jobs = new Map<number, Job>();

  add(pid: number, command: string): Job {
    const job: Job = {
      id: this.nextJobId(),
      pid,
      command,
      status: "Running",
    };

    this.jobs.set(job.id, job);
    return job;
  }

  markDone(id: number, exitCode: number): void {
    const job = this.jobs.get(id);
    if (!job || job.status === "Done") {
      return;
    }

    this.jobs.set(id, {
      ...job,
      status: "Done",
      exitCode,
    });
  }

  remove(id: number): void {
    this.jobs.delete(id);
  }

  list(): Job[] {
    return [...this.jobs.values()];
  }
}
