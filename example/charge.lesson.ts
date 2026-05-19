import { lesson } from "../src/index";

const contentBase = __dirname + "/content";

export default lesson("Charge is a Mystery", {
  outDir: __dirname + "/out",
  contentBase,
  theme: "auto",
})
  .description(
    "Why does electric charge exist? A deep dive from everyday physics to quantum field theory.",
  )
  .tags("physics", "electromagnetism", "quantum")
  .author("Chirayu")

  .head("./chargeIsAMystery.md")

  .sim("../chargesInteractive.js", { initialParticles: 3, showFieldLines: true })

  .add("./chargeInQFT.md")

  .divider()

  .subhead("./chargeAsWeKnowIt.md")

  .imp({
    inline:
      "Conservation of charge is one of the most precisely tested laws in physics — verified to 1 part in 10²¹.",
  })

  .note("./conservationOfCharge.md", "info")

  .quiz("./chargeQuestions.json")

  .build();
