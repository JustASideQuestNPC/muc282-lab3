import { BouncyParticle } from "./particles/BouncyParticle.js";
import { ParticleSystem } from "./ParticleSystem.js";

/**
 * Run p5 in instance mode - this is harder to read than using global mode, but it's required if I
 * want to use imports and spread things over multiple files.
 */
const s = (p5: p5) => {
    // for disabling and reenabling keyboard input
    let canvasHovered = true;

    let FONT_MONO: p5.Font; // used by the frame rate counter
    let fontLoaded: boolean = false; // whether the mono font has loaded yet

    let particleSystem: ParticleSystem;

    /**
     * How many frames to average the frame rate counter over.
     */
    const FRAME_COUNTER_BUFFER_SIZE: number = 30;

    const fpsBuffer: number[] = [];

    p5.setup = () => {
        globalThis.sketch = p5;
        globalThis.keyStates = {};

        // i'm supposed to load fonts in p5.preload(), but p5.preload() is terrible - it just kind
        // of pauses the sketch until everything is loaded, and if something can't load it'll just
        // time out forever
        FONT_MONO = p5.loadFont(
            // path to the font
            "../assets/IBMPlexMono-Medium.ttf",
            // this callback runs if the font loads successfully
            () => {
                console.log("Successfully loaded FONT_MONO.");
                fontLoaded = true;
            },
            // this callback runs if the font fails to load
            () => {
                console.log("Failed to load FONT_MONO.")
            }
        );

        particleSystem = new ParticleSystem(p5);
        
        const canvas = p5.createCanvas(750, 750);
        p5.frameRate(100);

        // WHY DO THESE USE CALLBACKS????
        canvas.mouseOver(() => {
            canvasHovered = true;
        });
        canvas.mouseOut(() => {
            canvasHovered = false;
        });

        // this is the only way to make mouse functions only trigger when the mouse is actually over
        // the canvas. I SHOULD NOT HAVE TO DO THIS.
        canvas.mousePressed(mousePressed);
        canvas.mouseReleased(mouseReleased);

        // this is, as far as i'm aware, the only way to disable the right-click menu without also
        // disabling it for the entire webpage. I SHOULD NOT HAVE TO DO THIS EITHER.
        document.querySelector("canvas").addEventListener("contextmenu", e => e.preventDefault());
    };

    p5.draw = () => {
        // frame rate is averaged over many frames to prevent it from jumping around
        fpsBuffer.push(p5.frameRate());
        if (fpsBuffer.length > FRAME_COUNTER_BUFFER_SIZE) {
            fpsBuffer.shift();
        }
        const avgFps = fpsBuffer.reduce((p, c) => p + c, 0) / fpsBuffer.length;

        particleSystem.moveAll();

        p5.background("#131515");
        particleSystem.renderAll();

        // framerate counter - only draw this once the font has loaded
        if (fontLoaded) {
            p5.noStroke();
            p5.fill("#000000a0");
            p5.rect(p5.width - 65, 0, 65, 20);
            p5.textFont(FONT_MONO, 16);
            p5.textAlign("right", "top");
            p5.fill("#00ff00");
            p5.text(Math.floor(avgFps) + " FPS", p5.width - 5, -2);
        }
    }

    // error checks need to be disabled here because there's a small mistake in the typedefs
    // @ts-ignore
    p5.keyPressed = (event: KeyboardEvent) => {
        // only run when the mouse is over the canvas; also makes F12 open the debug console instead
        // of interacting with the sketch
        if (canvasHovered && event.key !== "F12") {
            keyStates[event.key] = true;
    
            // prevents default browser behavior
            return false
        }
    };
    // @ts-ignore
    p5.keyReleased = (event: KeyboardEvent) => {
        // only run when the mouse is over the canvas; also makes F12 open the debug console instead
        // of interacting with the sketch
        if (canvasHovered && event.key !== "F12") {
            keyStates[event.key] = false;
    
            // prevents default browser behavior
            return false
        }
    };

    function mousePressed() {
        keyStates[p5.mouseButton + " mouse"] = true;

        particleSystem.addParticle(new BouncyParticle(p5.mouseX, p5.mouseY));
    }
    
    function mouseReleased() {
        keyStates[p5.mouseButton + " mouse"] = false;
    }
};

// error checks need to be disabled here because otherwise typescript explodes for some reason
// @ts-ignore
const instance = new p5(s);