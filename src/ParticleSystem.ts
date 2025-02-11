import * as p5 from "p5";
import Vector2D from "./Vector.js";

/**
 * Manages an entire particle system.
 */
export class ParticleSystem {
    /**
     * Minimum velocity for particles in pixels per second.
     */
    public minVelocity: number = 250;    
    /**
     * Maximum velocity for particles in pixels per second.
     */
    public maxVelocity: number = 400;

    /**
     * When particles update, they run calculations based on particles within this distance of them.
     */
    public viewRange: number = 200;
    /**
     * Particles attempt to remain at least this far away from other particles.
     */
    public minDistance: number = 75;
    /**
     * How strongly particles attempt to avoid collisions.
     */
    public separationFactor: number = 1;
    /**
     * How strongly particles attempt to remain close to other particles.
     */
    public cohesionFactor: number = 1;
    /**
     * How strongly particles attempt to match their velocity with other particles.
     */
    public alignmentFactor: number = 2;
    /**
     * How strongly particles turn to avoid walls.
     */
    public wallAvoidFactor: number = 1500;

    /** All particles currently being updated. */
    private particles: Particle[] = [];
    /** The sketch instance the particle system is running in. */
    private sketch: p5;
    /** The canvas to render particles onto. */
    private canvas: p5.Graphics | p5;

    private _wallMargin: number;

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
        this.wallMargin = 100;
    }

    /**
     * Returns the number of currently active particles.
     */
    public numParticles() { return this.particles.length; }

    /**
     * Adds a particle to the system.
     */
    public addParticle(x: number, y: number, angle: number, speed: number) {
        const position = new Vector2D(x, y);
        const velocity = Vector2D.fromPolar(angle, speed);
        this.particles.push(new Particle(position, velocity, this));
    }

    /**
     * Populates the system with some amount of particles.
     * @param amount How many particles to add.
     */
    public populate(amount: number): void {
        // add a small margin around the edges
        for (let i = 0; i < amount; ++i) {
            this.addParticle(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                Math.random() * 360,
                Math.random() * (this.maxVelocity - this.minVelocity) + this.minVelocity
            );
        }
    }

    /**
     * Moves (updates) all particles.
     */
    public moveAll(): void {
        // native delta time is in milliseconds
        const dt = this.sketch.deltaTime / 1000;

        for (let p of this.particles) {
            p.move(dt);
        }

        // remove deleted particles
        this.particles = this.particles.filter((p) => !p.markForRemove);
    }

    /**
     * Draws all particles to the canvas.
     */
    public renderAll(): void {
        for (const p of this.particles) {
            p.render(this.canvas);
        }
    }

    /**
     * Removes all particles.
     */
    public removeAll(): void {
        this.particles = [];
    }

    /**
     * Gets a reference to every particle.
     */
    public getAll(): Particle[] {
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
    public system: ParticleSystem;
    /**
     * If true, the particle will be removed from the system at the end of the current update.
     */
    public markForRemove: boolean = false;
    /**
     * The position of the particle.
     */
    private position: Vector2D = new Vector2D();
    /**
     * The velocity of the particle.
     */
    private velocity: Vector2D = new Vector2D();

    constructor(position: Vector2D, velocity: Vector2D, system: ParticleSystem) {
        this.position = position.copy();
        this.velocity = velocity.copy();
        this.system = system;
    }

    /**
     * Draws the particle to a canvas or graphics object.
     */
    render(g: p5.Graphics|p5): void {
        g.push();
        g.translate(this.position.x, this.position.y);
        g.rotate(this.velocity.heading() + 90);
        g.noStroke();
        g.fill("#1f84ff")
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
    move(dt: number): void {
        // get a list of all particles and remove any that we shouldn't be interacting with
        const nearbyParticles = this.system.getAll().filter((p) => (
            // only interact with particles  that are within our view range
            (this.position.distSq(p.position) < Math.pow(this.system.viewRange, 2))
        ));

        // find how much to turn and accelerate by
        const separationVector = new Vector2D();
        const alignmentVector = new Vector2D();
        const averageNearbyPosition = new Vector2D();
        let numConsidered = 0; // how many particles aren't too close to us
        for (const particle of nearbyParticles) {
            // apply separation
            if (this.position.distSq(particle.position) < Math.pow(this.system.minDistance, 2)) {
                separationVector.x += this.position.x - particle.position.x;
                separationVector.y += this.position.y - particle.position.y;
            }
            else {
                ++numConsidered;

                // update cohesion
                averageNearbyPosition.add(particle.position);

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

            this.velocity.add(
                averageNearbyPosition.div(numConsidered)
                                     .sub(this.position)
                                     .mult(this.system.cohesionFactor * dt)
            );
        }

        // avoid walls if necessary
        if (this.position.x < this.system.leftEdge) {
            this.velocity.x += this.system.wallAvoidFactor * dt;
        }
        else if (this.position.x > this.system.rightEdge) {
            this.velocity.x -= this.system.wallAvoidFactor * dt;
        }
        if (this.position.y < this.system.topEdge) {
            this.velocity.y += this.system.wallAvoidFactor * dt;
        }
        else if (this.position.y > this.system.bottomEdge) {
            this.velocity.y -= this.system.wallAvoidFactor * dt;
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