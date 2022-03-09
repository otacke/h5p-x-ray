import Dictionary from './h5p-x-ray-dictionary';
import Util from './h5p-x-ray-util';

export default class XRay extends H5P.Question {
  /**
   * @constructor
   *
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   */
  constructor(params, contentId) {
    super('x-ray');

    // Set defaults
    this.params = Util.extend({
      visual: {
        imageWidth: '100%',
        imageAlignment: 'center',
        xRayLensWidth: '20%',
        xRayLensHeight: '25%',
        darkenImageOnXRay: true
      },
      behaviour: {
        autoXRay: true,
        hideXRayIndicator: false
      }
    }, params);
    this.contentId = contentId;

    // Dictionary provides default values
    Dictionary.fill(this.params.a11y);

    this.xRayLensSize = {
      width: this.sanitizeCSS(this.params.visual.xRayLensWidth, { min: 1, default: '20 %' }),
      height: this.sanitizeCSS(this.params.visual.xRayLensHeight, { min: 1, default: '25 %' })
    };
  }

  /**
   * SanitizeCSS value.
   * @param {string|number} cssValue CSS value.
   * @param {object} [params={}] Parameters.
   * @param {number} [params.min] Minimum numerical value.
   * @param {number} [params.max] Maximum numerical value.
   * @param {string} [params.default] Default value.
   * @return {string|null} Value and unit separated by space or null.
   */
  sanitizeCSS(cssValue, params = {}) {
    params.default = typeof params.default === 'string' ? params.default : null;

    if (typeof cssCalue === 'number') {
      cssValue = cssValue.toString();
    }

    if (typeof cssValue !== 'string') {
      return params.default;
    }

    cssValue = cssValue.trim();

    let value;
    let unit;

    if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(cssValue)) {
      unit = 'px';
      value = cssValue.trim();
    }
    else if (cssValue.substr(-2) === 'px') {
      unit = 'px';
      value = cssValue.substr(0, cssValue.length - 2).trim();
    }
    else if (cssValue.substr(-1) === '%') {
      unit = '%';
      value = cssValue.substr(0, cssValue.length - 1).trim();
    }
    else {
      return params.default;
    }

    if (/^[+-]?([0-9]*[.])?[0-9]+$/.test(value) === false) {
      return params.default;
    }

    const numeric = parseFloat(value);
    if (typeof params.min === 'number' && numeric < params.min) {
      return params.default;
    }
    else if (typeof params.max === 'number' && numeric > params.max) {
      return params.default;
    }

    return `${value} ${unit}`;
  }

  /**
   * Attach content.
   */
  registerDomElements() {
    this.container = document.createElement('div');
    this.container.classList.add('h5p-x-ray-container');

    if (this.params.behaviour.autoXRay) {
      this.container.classList.add('h5p-x-ray-auto');
    }

    // Set image alignment
    if (this.params.visual.imageAlignment !== 'center') {
      this.container.style.alignItems = this.params.visual.imageAlignment;
    }

    // Leave room for side by side option in the future
    this.displays = document.createElement('div');
    this.displays.classList.add('h5p-x-ray-displays');

    // Navigation
    this.displayNavigation = document.createElement('div');
    this.displayNavigation.classList.add('h5p-x-ray-display-navigation');

    const wrapperNavigation = document.createElement('div');
    wrapperNavigation.classList.add('h5p-x-ray-wrapper-navigation');

    this.imageInstance = H5P.newRunnable(
      this.params.imageForeground,
      this.contentId,
      H5P.jQuery(wrapperNavigation),
      true,
      {}
    );
    this.imageNavigation = this.imageInstance.$img.get(0);
    this.imageNavigation.setAttribute('draggable', false);

    this.imageNavigation.classList.add('h5p-x-ray-image-navigation');
    if (this.params.visual.darkenImageOnXRay) {
      this.imageNavigation.classList.add('h5p-x-ray-darken');
    }

    this.displayNavigation.appendChild(wrapperNavigation);
    this.displays.appendChild(this.displayNavigation);

    if (this.params.imageForeground?.params?.file) {
      this.imageInstance.on('loaded', () => {
        this.imageLoaded = true;
        this.handleImageLoaded();
      });
    }
    else {
      // H5P.Image provides SVG placeholder that needs height
      wrapperNavigation.classList.add('h5p-x-ray-image-placeholder');
      this.imageLoaded = true;
      this.handleImageLoaded();
    }

    // X-ray lens
    this.wrapperLens = document.createElement('div');
    this.wrapperLens.classList.add('h5p-x-ray-wrapper-lens');

    this.imageInstanceLens = H5P.newRunnable(
      this.params.imageBackground,
      this.contentId,
      H5P.jQuery(this.wrapperLens),
      true,
      {}
    );
    this.imageLens = this.imageInstanceLens.$img.get(0);
    this.imageLens.classList.add('h5p-x-ray-image-lens');
    const lensSize = this.getLensSize();
    this.imageLens.style.transform = `scale(${1 / lensSize.widthFactor}, ${1 / lensSize.heightFactor})`;
    this.displayNavigation.appendChild(this.wrapperLens);

    // Toggle button
    this.toggleButton = document.createElement('button');
    this.toggleButton.classList.add('h5p-x-ray-button-toggle');
    if (this.params.behaviour.hideXRayIndicator) {
      this.toggleButton.classList.add('h5p-x-ray-button-toggle-hidden');
    }
    this.toggleButton.setAttribute('aria-pressed', 'false');
    this.toggleButton.setAttribute('aria-label', Dictionary.get('magnify'));
    this.displayNavigation.appendChild(this.toggleButton);

    this.container.appendChild(this.displays);

    this.setContent(this.container);

    H5P.externalDispatcher.on('initialized', () => {
      this.isInitialized = true;
      this.handleImageLoaded();
    });
  }

  /**
   * Activate X-ray.
   */
  activateXRay() {
    this.isXRaying = true;
    this.toggleButton.setAttribute('aria-pressed', 'true');
    this.container.classList.add('h5p-x-ray-active');
  }

  /**
   * Deactivate X-ray.
   */
  deactivateXRay() {
    this.isXRaying = false;
    this.toggleButton.setAttribute('aria-pressed', 'false');
    this.container.classList.remove('h5p-x-ray-active');
  }

  /**
   * Get X-ray lens width and height as percentage.
   * @return {object} X-ray lens width and height as percentage.
   */
  getLensSize() {
    let imageRect;

    const widthValue = parseFloat(this.xRayLensSize.width.split(' ')[0]);
    const widthUnit = this.xRayLensSize.width.split(' ')[1];
    let widthFactor;
    if (widthUnit === '%') {
      widthFactor = widthValue / 100;
    }
    else {
      imageRect = this.imageNavigation.getBoundingClientRect();
      widthFactor = Math.min(widthValue / imageRect.width, 1);
    }

    const heightValue = parseFloat(this.xRayLensSize.height.split(' ')[0]);
    const heightUnit = this.xRayLensSize.height.split(' ')[1];
    let heightFactor;
    if (heightUnit === '%') {
      heightFactor = heightValue / 100;
    }
    else {
      imageRect = imageRect || this.imageNavigation.getBoundingClientRect();
      heightFactor = Math.min(heightValue / imageRect.height, 1);
    }

    return {
      width: widthValue,
      widthUnit: widthUnit,
      widthFactor: widthFactor,
      height: heightValue,
      heightUnit: heightUnit,
      heightFactor: heightFactor
    };
  }

  /**
   * Get Lens position as rounded percentage.
   * @return {object} Position with x and y part.
   */
  getLensPosition() {
    let positions = this.imageLens.style.transformOrigin.split(' ');
    if (
      positions.length === 2 &&
      positions.every(position => /^\d*(.\d+)?%$/.test(position))
    ) {
      positions = positions.map((value) => {
        return `${Math.round(parseFloat(value))} %`;
      });
    }
    else {
      positions = [Dictionary.get('unknown'), Dictionary.get('unknown')];
    }

    return {
      x: positions[0],
      y: positions[1]
    };
  }

  /**
   * Update lens.
   * @param {object} position Pointer position on screen.
   * @param {number} position.x X pointer position.
   * @param {number} position.y Y pointer position.
   */
  setLensPosition(position) {
    const imageRect = this.imageNavigation.getBoundingClientRect();
    const lensRect = this.wrapperLens.getBoundingClientRect();

    const imagePointerPosition = {
      x: position.x - imageRect.left,
      y: position.y - imageRect.top
    };

    const lensPosition = {
      x: Math.max(0, Math.min(imagePointerPosition.x - lensRect.width / 2, imageRect.width - lensRect.width)),
      y: Math.max(0, Math.min(imagePointerPosition.y - lensRect.height / 2, imageRect.height - lensRect.height))
    };

    const lensPositionPercentage = {
      x: lensPosition.x / imageRect.width * 100,
      y: lensPosition.y / imageRect.height * 100
    };

    this.wrapperLens.style.left = `${lensPositionPercentage.x}%`;
    this.wrapperLens.style.top = `${lensPositionPercentage.y}%`;

    const lensOffsets = {
      minX: lensRect.width / 2,
      maxX: imageRect.width - lensRect.width / 2,
      minY: lensRect.height / 2,
      maxY: imageRect.height - lensRect.height / 2
    };

    const cappedPosition = {
      x: Math.max(lensOffsets.minX, Math.min(imagePointerPosition.x, lensOffsets.maxX)),
      y: Math.max(lensOffsets.minY, Math.min(imagePointerPosition.y, lensOffsets.maxY))
    };

    /*
     * 99.5 instead of 100, because otherwise magnification may cause margin.
     * Will still be read as 100% to screen reader due to rounding
     */
    const cappedPositionPercentage = {
      x: Util.project(cappedPosition.x, lensOffsets.minX, lensOffsets.maxX, 0, 99.5),
      y: Util.project(cappedPosition.y, lensOffsets.minY, lensOffsets.maxY, 0, 99.5)
    };

    this.imageLens.style.transformOrigin = `${cappedPositionPercentage.x}% ${cappedPositionPercentage.y}%`;
  }

  /**
   * Read lens position to screen reader.
   */
  readLensPosition() {
    let x, y;
    ({ x, y } = this.getLensPosition());

    const screenreaderText = Dictionary.get('movedLensTo')
      .replace(/@positionHorizontal/g, x)
      .replace(/@positionVertical/g, y);

    this.read(screenreaderText);
  }

  /**
   * Handle image loaded.
   */
  handleImageLoaded() {
    if (!this.isInitialized || !this.imageLoaded) {
      return;
    }

    // Set image width
    const width = this.params.visual.imageWidth === 'natural' ?
      `min(${this.imageNavigation.naturalWidth}px, 100%)` :
      this.params.visual.imageWidth;
    this.displays.style.width = width;

    // Set X-ray lens size.
    const xRayLensSize = this.getLensSize();

    this.wrapperLens.style.width = (xRayLensSize.widthUnit === '%') ?
      `calc(100% * ${xRayLensSize.widthFactor})` :
      `min(100%, ${xRayLensSize.width}px)`;

    this.wrapperLens.style.height = (xRayLensSize.heightUnit === '%') ?
      `calc(100% * ${xRayLensSize.heightFactor})` :
      `min(100%, ${xRayLensSize.height}px)`;

    this.addEventListeners();

    this.trigger('resize');
  }

  /**
   * Add event listeners
   */
  addEventListeners() {
    // Also handles enter/space on toggle button
    this.displayNavigation.addEventListener('click', event => {
      this.handleClick(event);
    });

    this.displayNavigation.addEventListener('touchstart', event => {
      this.handleTouchStart(event);
    });

    this.displayNavigation.addEventListener('mouseover', () => {
      this.handleMouseOver();
    });

    this.displayNavigation.addEventListener('touchmove', event => {
      this.handleTouchMove(event);
    });

    this.displayNavigation.addEventListener('mousemove', event => {
      this.handleMouseMove(event);
    });

    this.displayNavigation.addEventListener('mouseout', (event) => {
      this.handleMouseOut(event);
    });

    this.displayNavigation.addEventListener('touchend', event => {
      this.handleTouchEnd(event);
    });

    this.toggleButton.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });
  }

  /**
   * Handle key down.
   * @param {KeyEvent} event Key event.
   */
  handleKeydown(event) {
    if (!this.isXRaying) {
      return;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const lensRect = this.wrapperLens.getBoundingClientRect();

      let x = lensRect.left;
      let y = lensRect.top;

      if (event.key === 'ArrowLeft') {
        y += lensRect.height / 2;
      }
      else if (event.key === 'ArrowRight') {
        x += lensRect.width;
        y += lensRect.height / 2;
      }
      else if (event.key === 'ArrowUp') {
        x += lensRect.width / 2;
      }
      else if (event.key === 'ArrowDown') {
        x += lensRect.width / 2;
        y += lensRect.height;
      }

      this.setLensPosition({ x: x, y: y });
      this.readLensPosition();
    }
  }

  /**
   * Handle click.
   * @param {Event} event Click event.
   */
  handleClick(event) {
    if (event.pointerType && event.pointerType !== '' && event.pointerType !== 'mouse') {
      event.preventDefault();
      return; // Potentially touch device, use touch handler
    }

    if (this.params.behaviour.autoXRay && event.target !== this.toggleButton) {
      event.preventDefault();
      return; // Was click on lens
    }

    // iOS sometimes issues MouseEvent without TouchEvent up front.
    if (Util.isIOS()) {
      event.preventDefault();
      return;
    }

    if (this.isXRaying) {
      if (event.target === this.toggleButton) {
        this.read(`${Dictionary.get('xRayOff')}`);
      }

      this.deactivateXRay();
    }
    else {
      let position = {
        x: event.pageX,
        y: event.pageY
      };

      if (event.target === this.toggleButton) {
        this.imageNavigation.focus();

        this.read(`${Dictionary.get('xRayOn')} ${Dictionary.get('instructions')}`);

        // Use center of image for initial position if using keyboard
        const imageRect = this.imageNavigation.getBoundingClientRect();
        position = {
          x: imageRect.left + imageRect.width / 2,
          y: imageRect.height / 2
        };
      }

      this.activateXRay();
      this.setLensPosition(position);
    }
  }

  /**
   * Handle touch start.
   */
  handleTouchStart(event) {
    event.preventDefault();
    this.activateXRay();

    const lensRect = this.wrapperLens.getBoundingClientRect();
    this.setLensPosition(
      {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY - lensRect.height
      }
    );
  }

  /**
   * Handle touch moving over image.
   * @param {Event} event Touch event.
   */
  handleTouchMove(event) {
    if (event.touches.length !== 1) {
      return;
    }

    const lensRect = this.wrapperLens.getBoundingClientRect();
    this.setLensPosition(
      {
        x: event.touches[0].pageX,
        y: event.touches[0].pageY - lensRect.height
      }
    );
  }

  /**
   * Handle touch end.
   */
  handleTouchEnd() {
    this.deactivateXRay();
  }

  /**
   * Handle pointer enters image.
   */
  handleMouseOver() {
    if (
      !this.params.behaviour.autoZoom || this.isTouching ||
      Util.isIOS() // iOS sometimes triggers MouseEvent without TouchEvent
    ) {
      return;
    }

    this.activateXRay();
  }

  /**
   * Handle mouse pointer moving over image.
   * @param {Event} event Mouse event.
   */
  handleMouseMove(event) {
    if (
      this.isTouching ||
      Util.isIOS()  // iOS sometimes triggers MouseEvent without TouchEvent
    ) {
      // Event triggered by touch. Possible future: check event.pointerType
      return;
    }

    if (this.params.behaviour.autoXRay && !this.isXRaying) {
      this.activateXRay(); // Might have been deactivated by button
    }
    else if (!this.isXRaying) {
      return;
    }

    this.setLensPosition({ x: event.pageX, y: event.pageY });
  }

  /**
   * Handle pointer leaves image.
   */
  handleMouseOut() {
    if (!this.params.behaviour.autoXRay) {
      return;
    }

    this.deactivateXRay();
  }
}
