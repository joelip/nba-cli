export class NBAHttpError extends Error {
  status?: number;
  url?: string;
  body?: string;

  constructor(message: string, options?: { status?: number; url?: string; body?: string }) {
    super(message);
    this.name = "NBAHttpError";
    this.status = options?.status;
    this.url = options?.url;
    this.body = options?.body;
  }
}
