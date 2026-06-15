## The Zero-Config Companion File

To make your simulation reusable and interactive from the outside, you must expose its defaults and controls via a companion configuration file. 

If your simulation code is `sims/gravity.js`, create a file named `sims/gravity.config.json` right next to it:

```json
{
  "props": { "mass": 5, "trails": true },
  "tunables": {
    "mass": { "label": "Planet Mass", "min": 1, "max": 20, "step": 1 },
    "trails": { "label": "Show trails" }
  }
}
```

Mr Markdown automatically reads this `.config.json` file during the build process and seamlessly generates beautiful UI sliders and toggles above the simulation! 
