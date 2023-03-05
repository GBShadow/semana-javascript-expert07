export default class Controller {
  #view;
  #worker;
  #camera;
  #blinkCounterLeft = 0;
  #blinkCounterRight = 0;

  constructor({ view, worker, camera }) {
    this.#view = view;
    this.#camera = camera;
    this.#worker = this.#configureWorker(worker);

    this.#view.configureOnBtnClick(this.onBtnStart.bind(this));
  }

  static async initialize(deps) {
    const controller = new Controller(deps);
    controller.log("not yet detecting eye blink! click in the button to start");
    return controller.init();
  }

  #configureWorker(worker) {
    let ready = false;
    worker.onmessage = (msg) => {
      if ("READY" === msg.data) {
        console.log("worker is ready");
        this.#view.enableButton();
        ready = true;
        return;
      }
      const { blinkedLeft, blinkedRight } = msg.data.blinked;

      this.#blinkCounterLeft += blinkedLeft;
      this.#blinkCounterRight += blinkedRight;

      this.#view.togglePlayVideo({ blinkedLeft, blinkedRight });

      console.log("blinked", { blinkedLeft, blinkedRight });
    };

    return {
      send(msg) {
        if (!ready) return;

        worker.postMessage(msg);
      },
    };
  }

  loop() {
    const video = this.#camera.video;
    const img = this.#view.getVideoFrame(video);

    this.#worker.send(img);
    this.log(`detecting eye blink...`);

    setTimeout(() => this.loop(), 100);
  }

  log(text) {
    const times = `         - blinked times: left: ${
      this.#blinkCounterLeft
    } right: ${this.#blinkCounterRight}`;
    this.#view.log(
      `logger: ${text}`.concat(
        this.#blinkCounterLeft || this.#blinkCounterRight ? times : ""
      )
    );
  }

  onBtnStart() {
    this.log("initializing detection...");
    this.#blinkCounterLeft = 0;
    this.#blinkCounterRight = 0;
    this.loop();
  }

  async init() {
    console.log("init!!!");
  }
}
