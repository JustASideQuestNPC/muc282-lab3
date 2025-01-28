// This file will add both p5 instanced and global intellisence 
import * as p5Global from 'p5/global' 
import module = require('p5');
export = module;
export as namespace p5;

declare global {
    /**
     * The current sketch instance.
     */
    var sketch: p5
    /**
     * The state of every keyboard key and mouse button.
     */
    var keyStates: {[key: string]: boolean}
}