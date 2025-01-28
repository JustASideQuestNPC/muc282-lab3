import { ParticleBase, ParticleTag } from "../ParticleSystem.js";
import Vector2D from "../Vector.js";
import randUtils from "../utils/randUtils.js";

export class BouncyParticle extends ParticleBase {
    tags: ParticleTag[] = [
        ParticleTag.BOUNCY_PARTICLE
    ];

    constructor(x: number, y: number) {
        super(); // does literally nothing but has to be here because javascript
        this.position = new Vector2D(x, y);
        // fromPolar() creates a vector from an angle and a direction
        this.velocity = Vector2D.fromPolar(
            randUtils.float(-Math.PI, Math.PI),
            300
        );
    }

    render(g: p5.Graphics | p5): void {
        g.noStroke();
        g.fill("#fce7ab");
        g.rect(this.position.x - 3, this.position.y - 3, 6, 6);
    }

    move(dt: number): void {
        this.position.add(this.velocity.copy().mult(dt));

        // run collisions
        // left
        if (this.position.x < 0) {
            this.position.x = 0;
            this.velocity.x *= -1;
        }
        // top
        if (this.position.x > sketch.width) {
            this.position.x = sketch.width;
            this.velocity.x *= -1;
        }
        // right
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y *= -1;
        }
        // bottom
        if (this.position.y > sketch.height) {
            this.position.y = sketch.height;
            this.velocity.y *= -1;
        }
    }
}

