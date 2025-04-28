import { Container, Graphics, Text, TextStyle, IDestroyOptions } from "pixi.js";
import { gsap } from "gsap";
import { appConfig } from "../config/index";

/**
 * Defines the configuration options available when creating a new {@link Button} instance.
 */
export interface ButtonOptions {
  /** The text label displayed on the button. */
  text: string;
  /** The width of the button in pixels. Defaults to `appConfig.buttons.base.DEFAULT_WIDTH`. */
  width?: number;
  /** The height of the button in pixels. Defaults to `appConfig.buttons.base.DEFAULT_HEIGHT`. */
  height?: number;
  /** The numerical value of the button's background fill color. Defaults to `appConfig.buttons.base.FILL_COLOR`. */
  fillColor?: number;
  /** The numerical value of the button's background fill color when the pointer is hovering over it. Defaults to `appConfig.buttons.base.HOVER_COLOR`. */
  hoverColor?: number;
  /**
   * Optional partial PixiJS TextStyle object to customize the button's text appearance.
   * This will be merged with the default style defined in `appConfig.buttons.base.TEXT_STYLE`.
   * Specific `fontSize` or `textColor` options take precedence if provided.
   * @see https://pixijs.download/v7.4.3/docs/PIXI.TextStyle.html
   */
  textStyle?: Partial<TextStyle>;
  /** Directly overrides the font size specified in `textStyle` or the default style. */
  fontSize?: number;
  /** Directly overrides the text fill color specified in `textStyle` or the default style. */
  textColor?: number;
  /** The callback function to execute when the button is clicked or tapped. */
  onClick: () => void;
}

/**
 * A reusable and customizable Button component for the PixiJS stage.
 * It extends {@link Container} and provides a text label on a rounded rectangle background,
 * with built-in hover and click visual feedback animations using GSAP.
 *
 * @example
 * const myButton = new Button({
 *   text: "Click Me",
 *   width: 150,
 *   height: 50,
 *   fillColor: 0x00FF00,
 *   hoverColor: 0x00CC00,
 *   onClick: () => console.log("Button clicked!"),
 * });
 * stage.addChild(myButton);
 * myButton.position.set(100, 100);
 */
export class Button extends Container {
  /** The Graphics object used to draw the button's background shape. */
  private background: Graphics;
  /** The Text object displaying the button's label. */
  private buttonText: Text;
  /** The processed and defaulted configuration options used internally by the button instance. */
  private options: Required<Omit<ButtonOptions, "onClick" | "textStyle">> &
    Pick<ButtonOptions, "onClick">;
  /** Internal state flag indicating if the pointer is currently hovering over the button. */
  private isHovering = false;

  // Store bound event handlers to ensure proper removal in destroy()
  /** Bound reference to the onPointerOver method. */
  private boundPointerOver: () => void;
  /** Bound reference to the onPointerOut method. */
  private boundPointerOut: () => void;
  /** Bound reference to the onPointerDown method. */
  private boundPointerDown: () => void;
  /** Bound reference to the onPointerUp method. */
  private boundPointerUp: () => void;

  /**
   * Creates an instance of Button.
   * Sets up the background, text, and event listeners based on the provided options,
   * applying defaults from `appConfig` where necessary.
   *
   * @param options - The configuration options for the button. See {@link ButtonOptions}.
   */
  constructor(options: ButtonOptions) {
    super();

    // Resolve text style by merging base config, provided partial style, and direct overrides
    const baseStyle = appConfig.buttons.base.TEXT_STYLE(); // Call the getter function
    const providedStyle = options.textStyle || {};
    const finalTextStyle = new TextStyle({
      ...baseStyle,
      ...providedStyle,
      // Direct options override textStyle properties which override baseStyle
      fontSize:
        options.fontSize ?? providedStyle.fontSize ?? baseStyle.fontSize,
      fill: options.textColor ?? providedStyle.fill ?? baseStyle.fill,
    });

    // Establish final options by merging defaults and provided options
    const defaults = {
      width: appConfig.buttons.base.DEFAULT_WIDTH,
      height: appConfig.buttons.base.DEFAULT_HEIGHT,
      fillColor: appConfig.buttons.base.FILL_COLOR,
      hoverColor: appConfig.buttons.base.HOVER_COLOR,
      fontSize: finalTextStyle.fontSize as number, // Keep resolved size
      textColor: finalTextStyle.fill as number, // Keep resolved color
    };
    // Create the final options object, ensuring required props are present
    this.options = { ...defaults, ...options, onClick: options.onClick };
    // Remove textStyle property as it's been processed into finalTextStyle and direct options
    delete (this.options as any).textStyle;

    // Create and add background graphics
    this.background = new Graphics();
    this.drawBackground(); // Initial draw with default color
    this.addChild(this.background);

    // Create and add text element
    this.buttonText = new Text(options.text, finalTextStyle);
    this.buttonText.anchor.set(0.5);
    this.buttonText.x = this.options.width / 2;
    this.buttonText.y = this.options.height / 2;
    this.addChild(this.buttonText);

    // Set pivot to the center for scaling animations
    this.pivot.set(this.options.width / 2, this.options.height / 2);

    // Bind event handlers once to `this` for consistent listener removal
    this.boundPointerOver = this.onPointerOver.bind(this);
    this.boundPointerOut = this.onPointerOut.bind(this);
    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerUp = this.onPointerUp.bind(this);

    // Enable interaction
    this.eventMode = "static";
    this.cursor = "pointer";

    // Add event listeners
    this.on("pointertap", this.options.onClick);
    this.on("pointerover", this.boundPointerOver);
    this.on("pointerout", this.boundPointerOut);
    this.on("pointerdown", this.boundPointerDown);
    this.on("pointerup", this.boundPointerUp);
    this.on("pointerupoutside", this.boundPointerUp); // Handle click release outside
  }

  /**
   * Draws or redraws the button's rounded rectangle background.
   * Uses the appropriate fill color based on the `isHovering` state.
   */
  private drawBackground(): void {
    const fillColor = this.isHovering
      ? this.options.hoverColor
      : this.options.fillColor;
    this.background.clear();
    this.background.beginFill(fillColor);
    // Using a fixed corner radius for simplicity
    this.background.drawRoundedRect(
      0,
      0,
      this.options.width,
      this.options.height,
      10 // Reverted to hardcoded value
    );
    this.background.endFill();
  }

  /**
   * Handles the 'pointerover' event.
   * Sets the hover state, redraws the background with the hover color,
   * and triggers a slight scale-up animation.
   */
  private onPointerOver(): void {
    if (this.isHovering) return; // Prevent re-triggering if already hovering
    this.isHovering = true;
    this.drawBackground();
    gsap.to(this.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.15,
      ease: "power1.out",
      overwrite: true, // Overwrite any ongoing scale animation
    });
  }

  /**
   * Handles the 'pointerout' event.
   * Resets the hover state, redraws the background with the default color,
   * and triggers a scale-back animation to the normal size (unless currently pressed down).
   */
  private onPointerOut(): void {
    if (!this.isHovering) return; // Prevent re-triggering
    this.isHovering = false;
    this.drawBackground();
    // Only scale back if not currently in the 'pressed' state (scale 0.95)
    if (this.scale.x !== 0.95) {
      gsap.to(this.scale, {
        x: 1,
        y: 1,
        duration: 0.15,
        ease: "power1.out",
        overwrite: true,
      });
    }
  }

  /**
   * Handles the 'pointerdown' event.
   * Triggers a slight scale-down animation to simulate a press.
   */
  private onPointerDown(): void {
    gsap.to(this.scale, {
      x: 0.95,
      y: 0.95,
      duration: 0.1,
      ease: "power1.out",
      overwrite: true,
    });
  }

  /**
   * Handles the 'pointerup' and 'pointerupoutside' events.
   * Returns the button scale to the appropriate state (hover or normal) after being pressed.
   */
  private onPointerUp(): void {
    const targetScale = this.isHovering ? 1.05 : 1;
    gsap.to(this.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.1,
      ease: "power1.out",
      overwrite: true,
    });
  }

  /**
   * Updates the text displayed on the button.
   *
   * @param newText - The new text string to display on the button.
   */
  public setText(newText: string): void {
    this.buttonText.text = newText;
    // Optional: If text length changes significantly, might need to re-center or adjust layout.
    // this.buttonText.x = this.options.width / 2;
    // this.buttonText.y = this.options.height / 2;
  }

  /**
   * Returns the configured width of the button.
   * Note: This does not account for the current scale factor due to animations.
   *
   * @returns The configured width in pixels.
   */
  public getWidth(): number {
    return this.options.width;
  }

  /**
   * Returns the configured height of the button.
   * Note: This does not account for the current scale factor due to animations.
   *
   * @returns The configured height in pixels.
   */
  public getHeight(): number {
    return this.options.height;
  }

  /**
   * Cleans up resources used by the Button instance.
   * Removes all attached event listeners and kills any active GSAP animations
   * before calling the superclass destroy method.
   *
   * @param options - Optional destruction options passed to the superclass Container.destroy().
   *                  See {@link https://pixijs.download/v7.4.3/docs/PIXI.Container.html#destroy}.
   */
  public destroy(options?: boolean | IDestroyOptions): void {
    // Remove all event listeners using the stored bound references
    this.off("pointertap", this.options.onClick);
    this.off("pointerover", this.boundPointerOver);
    this.off("pointerout", this.boundPointerOut);
    this.off("pointerdown", this.boundPointerDown);
    this.off("pointerup", this.boundPointerUp);
    this.off("pointerupoutside", this.boundPointerUp);

    // Kill any active GSAP animations targeting this button's scale
    gsap.killTweensOf(this.scale);

    // Call the superclass destroy method to handle PixiJS object cleanup
    super.destroy(options);
  }
}
