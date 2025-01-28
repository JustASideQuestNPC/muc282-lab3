/**
 * Utilities for random number generation.
 */
export default {
    float: randFloat
};

/**
     * Returns a random floating-point number between 0 (inclusive) and 1 (exclusive).
     */
function randFloat(): number;
/**
 * Returns a random floating-point number between 0 (inclusive) and `high` (exclusive).
 */
function randFloat(high: number): number;
/**
 * Returns a random floating-point number between `low` (inclusive) and `high` (exclusive).
 */
function randFloat(low: number, high: number): number;
// implementation with all overloads
function randFloat(low?: number, high?: number): number {
    // Math.random() always returns a number between 0 and 1
    let rawValue = Math.random();
    // calling with no arguments returns a number between 0 and 1
    if (low === undefined && high === undefined) {
        return rawValue;
    }
    // calling with 1 argument returns a number between 0 and that arguments
    else if (low !== undefined && high === undefined) {
        return rawValue * low;
    }
    // calling with 2 arguments returns a number between the first argument and the last argument
    else {
        return (high - low) * rawValue + low;
    }
}