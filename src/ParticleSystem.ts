import * as p5 from "p5";
import Vector2D from "./Vector.js";

function randBool(bias: number=0.5) {
    return Math.random() < bias;
}

/**
 * Manages an entire particle system.
 */
export class ParticleSystem {
    /**
     * Minimum velocity for particles in pixels per second.
     */
    minVelocity: number = 250;    
    /**
     * Maximum velocity for particles in pixels per second.
     */
    maxVelocity: number = 400;

    /**
     * When particles update, they run calculations based on particles within this distance of them.
     */
    viewRange: number = 200;
    /**
     * Particles attempt to remain at least this far away from other particles.
     */
    minDistance: number = 75;
    /**
     * How strongly particles attempt to avoid collisions.
     */
    separationFactor: number = 5;
    /**
     * How strongly particles attempt to remain close to other particles.
     */
    cohesionFactor: number = 5;
    /**
     * How strongly particles attempt to match their velocity with other particles.
     */
    alignmentFactor: number = 5;
    /**
     * How strongly particles turn to avoid walls.
     */
    wallAvoidFactor: number = 5;
    /**
     * How likely particles are to suddenly scatter.
     */
    scatterChance: number = 0.1;

    /** Whether to draw debug info for the first particle */
    debugFirstParticle: boolean = false;

    /** "Speed of time". */
    timeScale: number = 1;

    /** All particles currently being updated. */
    private particles: Particle[] = [];
    /** The sketch instance the particle system is running in. */
    private sketch: p5;
    /** The canvas to render particles onto. */
    private canvas: p5.Graphics | p5;

    private _wallMargin: number;

    private intervalTimer: number = 1.5;
    private scattering: boolean = false;

    /**
     * @param sketch The sketch instance the particle system is running in.
     * @param canvas The canvas to render particles onto. This is optional and defaults to the
     *      sketch instance.
     */
    constructor(sketch: p5, canvas?: p5.Graphics) {
        this.sketch = sketch;

        // default parameters don't work here because the default value is another parameter
        this.canvas = canvas ?? sketch;

        // set the wall margin in the constructor so that the edges also get updated
        this.wallMargin = 150;
    }

    /**
     * Returns the number of currently active particles.
     */
    numParticles() { return this.particles.length; }

    /**
     * Adds a particle to the system with a random position and velocity.
     */
    addParticle(): void;
    /**
     * Adds a particle to the system.
     */
    addParticle(x: number, y: number, angle: number, speed: number): void;

    addParticle(x?: number, y?: number, angle?: number, speed?: number): void {
        // default parameters
        x = x ?? Math.random() * this.canvas.width;
        y = y ?? Math.random() * this.canvas.height;
        angle = angle ?? Math.random() * 360;
        speed = speed ?? Math.random() * (this.maxVelocity - this.minVelocity) + this.minVelocity;

        const position = new Vector2D(x, y);
        const velocity = Vector2D.fromPolar(angle, speed);
        this.particles.push(new Particle(position, velocity, this));
    }

    /**
     * Populates the system with some amount of particles.
     * @param amount How many particles to add.
     */
    populate(amount: number): void {
        // add a small margin around the edges
        for (let i = 0; i < amount; ++i) {
            this.addParticle();
        }
    }

    /**
     * Moves (updates) all particles.
     */
    moveAll(): void {
        // native delta time is in milliseconds
        let dt = this.sketch.deltaTime / 1000;
        dt *= 0.75; // easier than redoing all the math

        this.intervalTimer -= dt;
        if (this.intervalTimer <= 0) {
            this.intervalTimer = 1.5;
            this.scattering = randBool(this.scatterChance);
            console.log(`[ParticleSystem] scattering: ${this.scattering}`);
        }

        for (let p of this.particles) {
            p.move(dt * this.timeScale, this.scattering);
        }

        // remove deleted particles
        this.particles = this.particles.filter((p) => !p.markForRemove);
    }

    /**
     * Draws all particles to the canvas.
     */
    renderAll(): void {
        for (const p of this.particles) {
            p.render(this.canvas);
        }

        // draw overlays after drawing particles so they don't get covered up
        if (this.debugFirstParticle && this.particles.length > 0) {
            const firstParticle = this.particles[0];
            const pos = firstParticle.position.copy();

            // get which particles to highlight
            const nearbyParticles = this.particles.filter((p) => (
                // only interact with particles other than us that are within our view range
                p !== firstParticle && pos.distSq(p.position) < Math.pow(this.viewRange, 2)
            ));

            for (const p of nearbyParticles) {
                p.render(this.canvas, true);
            }

            // show distances
            this.canvas.noFill();
            this.canvas.strokeWeight(2);
            this.canvas.stroke("#ff0000");
            this.canvas.circle(pos.x, pos.y, this.viewRange * 2);
            this.canvas.circle(pos.x, pos.y, this.minDistance * 2);

            // show velocity vector
            this.canvas.stroke("#00ff00");
            const lineEnd = pos.copy().add(firstParticle.velocity.copy().mult(0.05));
            this.canvas.line(pos.x, pos.y, lineEnd.x, lineEnd.y);
        }
    }

    /**
     * Removes all particles.
     */
    removeAll(): void {
        this.particles = [];
    }

    /**
     * Removes a random particle.
     */
    removeParticle(): void {
        this.particles.splice(Math.floor(Math.random() * this.particles.length), 1);
    }

    /**
     * Gets a reference to every particle.
     */
    getAll(): Particle[] {
        return this.particles.slice();
    }

    /**
     * Particles begin turning  away from the screen edges when they are this far from them.
     */
    get wallMargin() { return this._wallMargin; }
    set wallMargin(value) {
        this._wallMargin = value;
    }

    /**
     * Particles begin turning away from the left edge of the screen when they are this far away
     * from it.
     */
    get leftEdge() { return this._wallMargin; }

    /**
     * Particles begin turning away from the right edge of the canvas when they are this far away
     * from it.
     */
    get rightEdge() { return this.canvas.width - this._wallMargin; }

    /**
     * Particles begin turning away from the top edge of the screen when they are this far away
     * from it.
     */
    get topEdge() { return this._wallMargin; }

    /**
     * Particles begin turning away from the bottom edge of the canvas when they are at least this
     * far away from it.
     */
    get bottomEdge() { return this.canvas.height - this._wallMargin; }

    /**
     * Height of the canvas the system is rendering to.
     */
    get width() { return this.canvas.width; }

    /**
     * Height of the canvas the system is rendering to.
     */
    get height() { return this.canvas.height; }
}

/**
 * A single particle.
 */
class Particle {
    /**
     * The particle system the particle is inside.
     */
    system: ParticleSystem;
    /**
     * If true, the particle will be removed from the system at the end of the current update.
     */
    markForRemove: boolean = false;
    /**
     * The position of the particle.
     */
    position: Vector2D = new Vector2D();
    /**
     * The velocity of the particle.
     */
    velocity: Vector2D = new Vector2D();

    constructor(position: Vector2D, velocity: Vector2D, system: ParticleSystem) {
        this.position = position.copy();
        this.velocity = velocity.copy();
        this.system = system;
    }

    /**
     * Draws the particle to a canvas or graphics object.
     */
    render(g: p5.Graphics|p5, highlight: boolean=false): void {
        g.push();
        g.translate(this.position.x, this.position.y);
        g.rotate(this.velocity.heading() + 90);
        g.noStroke();
        g.fill(highlight ? "#9ecaff" : "#1f84ff");
        g.beginShape();
        g.vertex(0, -8);
        g.vertex(5, 8);
        g.vertex(-5, 8);
        g.endShape("close");
        g.pop();
    }

    /**
     * Updates and moves the particle - normally I'd call this `update()`, but for some reason I'm
     * required to specifically call it `move()`.
     * @param dt The time between last two frames, in seconds. Useful for making particle speed
     *      framerate-independent.
     */
    move(dt: number, scattering: boolean): void {
        // get a list of all particles and remove any that we shouldn't be interacting with
        const nearbyParticles = this.system.getAll().filter((p) => (
            // only interact with particles other than us that are within our view range
            p !== this && this.position.distSq(p.position) < Math.pow(this.system.viewRange, 2)
        ));

        // find how much to turn and accelerate by
        const separationVector = new Vector2D();
        const alignmentVector = new Vector2D();
        const averageNearbyPosition = new Vector2D();
        let numConsidered = 0; // how many particles aren't too close to us

        // sum up a bunch of things
        for (const particle of nearbyParticles) {
            // apply separation
            if (this.position.distSq(particle.position) < Math.pow(this.system.minDistance, 2)) {
                separationVector.add(this.position.copy().sub(particle.position));
            }
            else {
                ++numConsidered;

                // add the delta 
                averageNearbyPosition.add(particle.position.copy().sub(this.position));

                // update alignment
                alignmentVector.add(particle.velocity);
            }
        }

        
        // apply everything to our velocity
        this.velocity.add(separationVector.mult(this.system.separationFactor * dt));
        
        if (numConsidered > 0) {
            this.velocity.add(
                alignmentVector.div(numConsidered)
                               .mult(this.system.alignmentFactor * dt)
            );

            let cohesion = this.system.cohesionFactor;
            if (scattering) { cohesion *= -1; }
            this.velocity.add(
                averageNearbyPosition.div(numConsidered)
                                     .mult(cohesion * dt)
            );
        }

        // avoid walls if necessary
        const wallAvoidFactor = this.system.wallAvoidFactor * 1000; // for config consistency
        if (this.position.x < this.system.leftEdge) {
            this.velocity.x += wallAvoidFactor * dt;
        }
        else if (this.position.x > this.system.rightEdge) {
            this.velocity.x -= wallAvoidFactor * dt;
        }
        if (this.position.y < this.system.topEdge) {
            this.velocity.y += wallAvoidFactor * dt;
        }
        else if (this.position.y > this.system.bottomEdge) {
            this.velocity.y -= wallAvoidFactor * dt;
        }

        // apply speed limit and delta time, then move the particle
        this.velocity.limit(this.system.minVelocity, this.system.maxVelocity);
        this.position.add(this.velocity.copy().mult(dt));

        // bounce off of walls
        if (this.position.x < 0) {
            this.position.x = 0;
            if (this.velocity.x < 0) { this.velocity.x *= -1; }
        }
        else if (this.position.x > this.system.width) {
            this.position.x = this.system.width;
            if (this.velocity.x > 0) { this.velocity.x *= -1; }
        }
        if (this.position.y < 0) {
            this.position.y = 0;
            if (this.velocity.y < 0) { this.velocity.y *= -1; }
        }
        else if (this.position.y > this.system.height) {
            this.position.y = this.system.height;
            if (this.velocity.y > 0) { this.velocity.y *= -1; }
        }
    }
}