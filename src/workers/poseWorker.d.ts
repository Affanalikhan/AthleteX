// Type definitions for pose worker
declare module 'worker-loader!*' {
  class WebpackWorker extends Worker {
    constructor();
  }
  export default WebpackWorker;
}

declare module '*.worker.ts' {
  class WebWorker extends Worker {
    constructor();
  }
  export default WebWorker;
}
