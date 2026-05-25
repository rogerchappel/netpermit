export class NetpermitError extends Error {
  constructor(message, code = "NETPERMIT_ERROR") {
    super(message);
    this.name = "NetpermitError";
    this.code = code;
  }
}

export function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NetpermitError(`${label} must be an object`, "INVALID_SHAPE");
  }
}
