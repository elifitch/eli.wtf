'use strict'
/* global Elastic */

import TweenMax from 'gsap'

module.exports = (function () {
  setTimeout(() => {
    const bars = document.getElementsByClassName('hero-anim__bar')
    // const evenBars = [bars[0], bars[2], bars[4]]
    // const oddBars = [bars[1], bars[3], bars[5]]
    // const barHeight = '6.25em'

    function animateFromTopAndBottom() {
      // var x = 10;
      const y = 200
      const angle = 360 - 7.77
      const x = (Math.tan(angle)) / y

      // x = (Math.tan(angle)) / y
      // var y = Math.tan(angle) / x;

      TweenMax.staggerFrom(bars, 1.2, {
        opacity: 0,
        // scale: 0.7,
        cycle: {
          x: [x, -(x), x, -(x), x, -(x)],
          y: [y, -(y), y, -(y), y, -(y)],
        },
        // delay: 2,
        ease: Elastic.easeOut.config(0.7, 0.5),
      }, 0.1)
    }

    // function animateFromSqOne() {

    //   TweenMax.staggerFrom(bars, 1.2, {
    //     opacity: 0,
    //     // scale: 0.7,
    //       cycle:{
    //       x: function(index) {
    //         return -(62.5) * (index)
    //       }
    //     },
    //     ease: Elastic.easeOut.config(0.7, 0.5),
    //   }, 0.05)
    // }

    animateFromTopAndBottom()
    // animateFromSqOne();
  }, 0)
}())
