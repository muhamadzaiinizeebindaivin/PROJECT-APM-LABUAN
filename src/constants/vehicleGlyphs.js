// src/constants/vehicleGlyphs.js

/**
 * Static SVG inner-markup for each vehicle type shown on the Operasi map.
 * Kept separate from operasiMapTemplate.js so that file doesn't get
 * bloated with raw path data. Consumed via JSON.stringify() and injected
 * into the iframe's <script> at build time (see buildOperasiMapHtml).
 */
export const VEHICLE_GLYPHS = {
  lori: '<path d="M2 8h9v6H2z"/><path d="M11 10h4l2 2v2h-6z"/><circle cx="5" cy="15" r="1.4"/><circle cx="13.5" cy="15" r="1.4"/>',

  // motorcycle icon from SVG Repo, rescaled from its native 32x32 grid to match the other glyphs (~16x16)
  motor: '<g transform="scale(0.5)">' +
           '<path d="M27,17c-0.2,0-0.4,0-0.6,0.1l-0.6-1.9C26.2,15,26.6,15,27,15c0.7,0,1.4,0.1,2.1,0.3c0.5,0.2,1.1-0.1,1.3-0.6' +
             'c0.2-0.5-0.1-1.1-0.6-1.3C28.9,13.1,27.9,13,27,13c-0.6,0-1.3,0.1-1.9,0.2l-2.2-6.5C22.8,6.3,22.4,6,22,6h-4c-0.6,0-1,0.4-1,1' +
             's0.4,1,1,1h3.3l0.7,2H17c-0.4,0-0.7,0.2-0.9,0.5l-0.4,0.6c-1.4,2.3-4,3.4-6.6,2.9c0,0,0,0,0,0c-1.2-0.6-2.7-1-4.1-1' +
             'c-0.6,0-1,0.4-1,1s0.4,1,1,1c3.9,0,7,3.1,7,7c0,0.6,0.4,1,1,1h6c0.6,0,1-0.4,1-1c0-2.7,1.6-5.1,3.9-6.2l0.6,1.9' +
             'C23,18.6,22,20.2,22,22c0,2.8,2.2,5,5,5s5-2.2,5-5S29.8,17,27,17z"/>' +
           '<path d="M5,17c-2.8,0-5,2.2-5,5s2.2,5,5,5s5-2.2,5-5S7.8,17,5,17z"/>' +
         '</g>',

  car: '<path d="M2.5 11l1.5-4.5h8l1.5 4.5v3h-11z"/><circle cx="5" cy="14.2" r="1.3"/><circle cx="11.5" cy="14.2" r="1.3"/>',
  boat: '<path d="M1 11l2 4h10l2-4z"/><path d="M8 2v9M8 2l4 3.5H8"/>'
};