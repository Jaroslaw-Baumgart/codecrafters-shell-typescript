export interface Job {
  id: number;
  pid: number;
  command: string;
}

export class JobStore {
  private nextId = 1;
  private readonly jobs = new Map<number, Job>();

  add(pid: number, command: string): Job {
    const job = {
      id: this.nextId++,
      pid,
      command,
    };

    this.jobs.set(job.id, job);
    return job;
  }
}
