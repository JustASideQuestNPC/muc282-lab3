import { ParticleSystem } from "./ParticleSystem.js";

// slider limits
const MIN_NUM_BOIDS = 1;
const MAX_NUM_BOIDS = 50;
const INITIAL_NUM_BOIDS = 25;

const MIN_VIEW_RANGE = 0;
const MAX_VIEW_RANGE = 400;
const INITIAL_VIEW_RANGE = 100;

const MIN_PROTECTED_DISTANCE = 0;
const MAX_PROTECTED_DISTANCE = 250;
const INITIAL_PROTECTED_DISTANCE = 50;

const MIN_SEPARATION = 0;
const MAX_SEPARATION = 20;
const INITIAL_SEPARATION = 5;

const MIN_COHESION = 0;
const MAX_COHESION = 20;
const INITIAL_COHESION = 5;

const MIN_ALIGNMENT = 0;
const MAX_ALIGNMENT = 20;
const INITIAL_ALIGNMENT = 5;

const MIN_WALL_AVOID = 0;
const MAX_WALL_AVOID = 20;
const INITIAL_WALL_AVOID = 5;

const MIN_SCATTER_CHANCE = 0;
const MAX_SCATTER_CHANCE = 100;
const INITIAL_SCATTER_CHANCE = 40;

let numParticles = INITIAL_NUM_BOIDS;

function setupSlider(name: string, min: number, max: number, initialValue: number,
                     onInput: (value: number)=>void): void;
function setupSlider(name: string, min: number, max: number, initialValue: number,
                     valueSuffix: string, onInput: (value: number)=>void): void;

/**
 * Sets up a slider input.
 * @param name The name of the div containing the slider.
 * @param min Minimum slider value.
 * @param max Maximum slider value.
 * @param initialValue Starting value of the slider
 * @param onChange Called whenever the slider moves.
 */
function setupSlider(name: string, min: number, max: number, initialValue: number,
                     valueSuffix: string |((value: number)=>void),
                     onInput?: (value: number)=>void): void {
    // handle overloads
    if (!onInput && typeof valueSuffix === "function") {
        onInput = valueSuffix;
        valueSuffix = "";
    }

    const container = document.getElementById(name);

    const valueDisplay = container.getElementsByTagName("span")[0];
    valueDisplay.innerText = initialValue.toString() + valueSuffix;

    const slider = container.getElementsByTagName("input")[0];
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = initialValue.toString();
    slider.oninput = () => {
        valueDisplay.innerText = slider.value + valueSuffix;
        onInput(Number.parseFloat(slider.value));
    };
}

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
        const rootPath = document.body.getAttribute("data-root");
        FONT_MONO = p5.loadFont(
            // path to the font
            `${rootPath}assets/IBMPlexMono-Medium.ttf`,
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
        
        const canvas = p5.createCanvas(1280, 720);
        canvas.parent("sketchContainer");
        p5.frameRate(100);
        p5.angleMode("degrees");

        particleSystem = new ParticleSystem(p5);

        // set up buttons
        const resetButton = document.getElementById("resetButton");
        resetButton.onclick = () => {
            particleSystem.removeAll();
            particleSystem.populate(numParticles);
        };
        
        // set up range sliders
        setupSlider("numParticles", MIN_NUM_BOIDS, MAX_NUM_BOIDS, INITIAL_NUM_BOIDS, (value) => {
            numParticles = value;
            // live update the number of particles
            while (particleSystem.numParticles() < numParticles) {
                particleSystem.addParticle();
            }
            while (particleSystem.numParticles() > numParticles) {
                particleSystem.removeParticle();
            }
        });
        setupSlider("viewRange", MIN_VIEW_RANGE, MAX_VIEW_RANGE, INITIAL_VIEW_RANGE, (value) => {
            particleSystem.viewRange = value;
        });
        setupSlider("minDistance", MIN_PROTECTED_DISTANCE, MAX_PROTECTED_DISTANCE,
                    INITIAL_PROTECTED_DISTANCE, (value) => {
            particleSystem.minDistance = value;
        });
        setupSlider("separation", MIN_SEPARATION, MAX_SEPARATION, INITIAL_SEPARATION, (value) => {
            particleSystem.separationFactor = value;
        });
        setupSlider("cohesion", MIN_COHESION, MAX_COHESION, INITIAL_COHESION, (value) => {
            particleSystem.cohesionFactor = value;
        });
        setupSlider("alignment", MIN_ALIGNMENT, MAX_ALIGNMENT, INITIAL_ALIGNMENT, (value) => {
            particleSystem.alignmentFactor = value;
        });
        setupSlider("wallAvoid", MIN_WALL_AVOID, MAX_WALL_AVOID, INITIAL_WALL_AVOID, (value) => {
            particleSystem.wallAvoidFactor = value;
        });
        setupSlider("scatterChance", MIN_SCATTER_CHANCE, MAX_SCATTER_CHANCE, INITIAL_SCATTER_CHANCE,
                    "%", (value) => {
            particleSystem.scatterChance = value / 100;
        });

        // final setup
        particleSystem.viewRange = INITIAL_VIEW_RANGE;
        particleSystem.minDistance = INITIAL_PROTECTED_DISTANCE;
        particleSystem.separationFactor = INITIAL_SEPARATION;
        particleSystem.cohesionFactor = INITIAL_COHESION;
        particleSystem.alignmentFactor = INITIAL_ALIGNMENT;
        particleSystem.wallAvoidFactor = INITIAL_WALL_AVOID;
        particleSystem.populate(numParticles);

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

        p5.background("#22292f");
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

            // toggle velocity vectors
            if (event.key === "v") {
                particleSystem.debugFirstParticle = !particleSystem.debugFirstParticle;
                console.log(
                    `Particle debug: ${particleSystem.debugFirstParticle ? "On" : "Off"}`
                );
            }
            // toggle slow motion
            else if (event.key === "t") {
                particleSystem.timeScale = (particleSystem.timeScale === 1 ? 0.25 : 1);
                console.log(
                    `Slow motion: ${particleSystem.timeScale === 1 ? "Disabled" : "Enabled"}`
                );
            }
            

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
    }
    
    function mouseReleased() {
        keyStates[p5.mouseButton + " mouse"] = false;
    }
};

// error checks need to be disabled here because otherwise typescript explodes for some reason
// @ts-ignore
const instance = new p5(s);