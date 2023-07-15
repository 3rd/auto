import sinon from "sinon";

const stub = <T extends Readonly<{}>>(target: T, key: keyof T) => {
  try {
    // @ts-ignore
    target[key].restore();
  } catch {}
  return sinon.stub(target, key);
};

export { stub };
