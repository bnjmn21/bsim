// Der eigentliche Code befindet sich in bsim.js
// Tipp: VSCode hat die "Go to Definition" Funktion (standardweise [F12]), die wird hier helfen.

console.log(
    "%cBSim",
    "font-size: 3em;" +
    "border: 1px solid #7777;" +
    "border-radius: 3px;" +
    "background-color: #7774;" +
    "width: 100%;" +
    "display: inline-block;" +
    "text-align: center;" +
    "padding-inline: .5em;"
);
console.log(
    "%cPowered by your computer",
    "font-size: 1.5em;" +
    "width: 100%;" +
    "display: inline-block;" +
    "text-align: center;" +
    "padding-inline: .5em;"
);

const world = new World();
world.plugin(bsim);
world.run();