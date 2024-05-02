## About

This an imitation of the pre-2020 HUD used in Rainbow Six: Siege. The previous hud was based on flash, and was replaced by an Electron version following its deprecation. However, the old version looks much nicer than the new one, so it was recreated in Overwolf.

![alt text](https://github.com/notrogan/overwolf/blob/main/screenshot.png)

## Source Code

This code only leverages the "in game" window provided by Overwolf, as the others are not needed since the menu uses its own HUD renderer. You can find the main file [here](https://github.com/notrogan/overwolf/blob/main/ts/src/in_game/in_game.ts)

* This is the only file that directly interfaces with the Overwolf HUD, however it does borrow assets (operators, icons) from other directories.

Overwolf sends constant game updates (if available) which serve as refresh points for applications. There is no manual pulling of data in the code as the Overwolf framework handles that for us.

## Load as Unpacked Extension

You can load the native version of this app "as is", without any build process. Open the `ts` directory in a code editor, and run `npm run build`. Then, under Overwolf's settings, choose Support tab and then Development options. Click the Load unpacked button and choose the "dist" folder.

* In order to load an app as "unpacked", you'll first have to be whitelisted as an Overwolf dev. More details on how to be whitelisted can be found [here](https://overwolf.github.io/docs/start/sdk-introduction#whitelist-as-a-developer)
* To load the typescript version, first you should build it. More details on the readme page under the "ts" folder in this repo.

## Usage

The application will open automatically provided that Overwolf is currently running. There is no indiciation that the app is running when you're in the menu, as Overwolf does not provide game events here.

* Pressing `ctrl-f` will obscure the hud, and pressing it again will reveal it.
* Icons for new operators are not available, and are instead replaced with recruit. This is because they are drawn with a different style, which does not work with this version of the hud.

## Notes

After each Rainbow Six: Siege update, Overwolf typically disables game events to ensure that they do not conflict with any changes made in the new update. You can find the current game event status [here](https://overwolf.github.io/status/rainbow-six-siege)
