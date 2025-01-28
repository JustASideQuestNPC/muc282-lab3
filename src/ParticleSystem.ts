import * as p5 from "p5";

/**
 * Enum for different particle types.
 */
export enum ParticleType {
    UNSET_TYPE, // used if the particle's constructor doesn't give it a type
}

/**
 * Manages an entire particle system.
 */
export class ParticleSystem {
    /** All particles currently being updated. */
    private particles: ParticleBase[] = [];

    /**
     * Adds a particle to the system, then returns a reference to it.
     */
    addParticle<P extends ParticleBase>(particle: P): P {
        this.particles.push(particle);
        return particle;
    }

    /**
     * Removes ALL particles.
     */
    removeAll(): void {
        this.particles = [];
    }
}

/**
 * Abstract base class for particles. Cannot be directly instantiated - extend it instead.
 */
export abstract class ParticleBase {
    type: ParticleType = ParticleType.UNSET_TYPE;

    /**
     * Draws the particle to a canvas or graphics object. This method is automatically called
     * whenever the particle system renders - don't call it manually unless you know what you're
     * doing.
     */
    render(g: p5.Graphics|p5.Renderer): void {}

    /**
     * Updates and moves the particle - normally I'd call this `update()`, but for some reason I'm
     * required to specifically call it `move()`. This method is automatically called whenever the
     * particle system updates - don't call it manually unless you know what you're doing.
     * @param dt The time between last two frames, in seconds. Useful for making particle speed
     *      framerate-independent.
     */
    move(dt: number): void {};
}