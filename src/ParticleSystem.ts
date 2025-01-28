import * as p5 from "p5";

/**
 * Enum for different particle tags.
 */
export enum ParticleTag {
    
}

/**
 * Manages an entire particle system.
 */
export class ParticleSystem {
    /** All particles currently being updated. */
    private particles: ParticleBase[] = [];

    /** The sketch instance the particle system is running in. */
    private sketch: p5;

    /** The canvas to render particles onto. */
    private canvas: p5.Graphics | p5;

    /** "Speed of time". Must be greater than 0. */
    public timeScale: number = 1;

    /**
     * @param sketch The sketch instance the particle system is running in.
     * @param canvas The canvas to render particles onto. This is optional and defaults to the
     *      sketch instance.
     */
    constructor(sketch: p5, canvas?: p5.Graphics) {
        this.sketch = sketch;

        // default parameters don't work here because the default value is another parameter
        this.canvas = canvas ?? sketch;
    }

    /**
     * Returns the number of currently active particles.
     */
    public numParticles() { return this.particles.length; }

    /**
     * Adds a particle to the system, then returns a reference to it.
     */
    public addParticle<P extends ParticleBase>(particle: P): P {
        this.particles.push(particle);
        return particle;
    }

    /**
     * Moves (updates) all particles.
     */
    public moveAll(): void {
        // native delta time is in milliseconds
        let dt = sketch.deltaTime / 1000 * this.timeScale;

        for (let p of this.particles) {
            p.move(dt);
        }
    }

    /**
     * Draws all particles to the canvas.
     */
    public renderAll(): void {
        for (let p of this.particles) {
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
     * Removes all particles that a predicate returns true for.
     */
    public removeIf(predicate: (p: ParticleBase) => boolean): void {
        // filter removes all items that a predicate returns *false* for
        this.particles = this.particles.filter((p) => !predicate(p));
    }

    /**
     * Removes all particles with a certain tag.
     */
    public removeTagged(tag: ParticleTag): void {
        this.removeIf((p) => p.hasTag(tag));
    }

    /**
     * Returns an array containing all particles.
     */
    public getAll(): ParticleBase[] {
        // shallow copy the array to prevent issues if it gets modified later
        return this.particles.slice();
    }

    /**
     * Returns an array containing all particles that a predicate returns true for.
     */
    public getIf(predicate: (p: ParticleBase) => boolean): ParticleBase[] {
        return this.particles.filter(predicate);
    }

    /**
     * Returns an array containing all particles with a certain tag.
     */
    public getTagged(tag: ParticleTag): ParticleBase[] {
        return this.getIf((p) => p.hasTag(tag));
    }
}

/**
 * Abstract base class for particles. Cannot be directly instantiated - extend it instead.
 */
export abstract class ParticleBase {
    /**
     * The particle's tags. Tags are mainly used to access particles through
     * `ParticleSystem.getTagged()` or remove them using `ParticleSystem.removeTagged()`.
     */
    tags: ParticleTag[] = [];

    /**
     * Draws the particle to a canvas or graphics object. This method is automatically called
     * whenever the particle system renders - don't call it manually unless you know what you're
     * doing.
     */
    render(g: p5.Graphics|p5): void {}

    /**
     * Updates and moves the particle - normally I'd call this `update()`, but for some reason I'm
     * required to specifically call it `move()`. This method is automatically called whenever the
     * particle system updates - don't call it manually unless you know what you're doing.
     * @param dt The time between last two frames, in seconds. Useful for making particle speed
     *      framerate-independent.
     */
    move(dt: number): void {}

    /**
     * Returns whether the particle has a certain tag. This method is final and should not be
     * overridden.
     */
    hasTag(tag: ParticleTag): boolean {
        return this.tags.includes(tag);
    }
}