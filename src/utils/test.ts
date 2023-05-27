import sinon from "sinon";

export const stub = <T extends {}>(target: T, key: keyof T) => {
  try {
    // @ts-ignore
    target[key].restore();
  } catch {}
  return sinon.stub(target, key);
};
