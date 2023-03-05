export default class HandGestureView {
  #handsCanvas = document.querySelector("canvas");
  #handsCanvasContext = this.#handsCanvas.getContext("2d");
  #fingerLookupIndexes;
  #styler;

  constructor({ fingerLookupIndexes, styler }) {
    this.#handsCanvas.width = globalThis.screen.availWidth;
    this.#handsCanvas.height = globalThis.screen.availHeight;
    this.#fingerLookupIndexes = fingerLookupIndexes;
    this.#styler = styler;
    // carrega os estilos assincronamente (evitando travar a tela enquanto carrega)
    setTimeout(() => styler.loadDocumentStyles(), 200);
  }

  clearCanvas() {
    this.#handsCanvasContext.clearRect(
      0,
      0,
      this.#handsCanvas.width,
      this.#handsCanvas.height
    );
  }

  drawResults(hands) {
    for (const { keypoints } of hands) {
      if (!keypoints) continue;

      this.#handsCanvasContext.fillStyle = "rgb(44, 212, 103)";

      this.#handsCanvasContext.strokeStyle = "white";
      this.#handsCanvasContext.lineWidth = 8;
      this.#handsCanvasContext.lineJoin = "round";

      //Juntas dos dedos
      this.#drawJoints(keypoints);
      this.#drawFingersAndHoverElements(keypoints);
    }
  }

  clickOnElement(x, y) {
    const element = document.elementFromPoint(x, y);

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const event = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + x,
      clientY: rect.top + y,
    });

    element.dispatchEvent(event);
  }

  #drawJoints(keypoints) {
    for (const { x, y } of keypoints) {
      this.#handsCanvasContext.beginPath();
      const newX = x - 2;
      const newY = y - 2;
      const radius = 3;
      const startAngle = 0;
      const endAngle = 2 * Math.PI;

      this.#handsCanvasContext.arc(newX, newY, radius, startAngle, endAngle);
      this.#handsCanvasContext.fill();
    }
  }

  #drawFingersAndHoverElements(keypoints) {
    const fingers = Object.keys(this.#fingerLookupIndexes);

    for (const finger of fingers) {
      const points = this.#fingerLookupIndexes[finger].map(
        (index) => keypoints[index]
      );
      const region = new Path2D();
      // [0] é a palma da mão (wrist)
      const [{ x, y }] = points;
      region.moveTo(x, y);
      for (const point of points) {
        region.lineTo(point.x, point.y);
      }
      this.#handsCanvasContext.stroke(region);
      this.#hoverElement(finger, points);
    }
  }

  #hoverElement(finger, points) {
    if (finger !== "indexFinger") return;
    const tip = points.find((item) => item.name === "index_finger_tip");
    const element = document.elementFromPoint(tip.x, tip.y);
    if (!element) return;

    const hoverToggle = () => this.#styler.toggleStyle(element, ":hover");
    hoverToggle();
    setTimeout(() => hoverToggle(), 500);
  }

  loop(fn) {
    requestAnimationFrame(fn);
  }

  scrollPage(top) {
    scroll({ top, behavior: "smooth" });
  }
}
