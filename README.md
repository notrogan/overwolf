## Load as Unpacked Extension

You can load the native version of this app "as is", without any build process. Open the `ts` directory in a code editor, and run `npm run build`. Then, under Overwolf's settings, choose Support tab and then Development options. Click the Load unpacked button and choose the "dist" folder.

* In order to load an app as "unpacked", you'll first have to be whitelisted as an Overwolf dev. More details on how to be whitelisted can be found [here](https://overwolf.github.io/docs/start/sdk-introduction#whitelist-as-a-developer)
* To load the typescript version, first you should build it. More details on the readme page under the "ts" folder in this repo.

## Usage

The application will open automatically provided that Overwolf is currently running. There is no indiciation that the app is running when you're in the menu, as Overwolf does not provide game events here.

## Notes

After each Rainbow Six: Siege update, Overwolf typically disables game events to ensure that they do not conflict with any changes made in the new update. You can find the current game event status [here](https://overwolf.github.io/status/rainbow-six-siege)

For any further information or questions, contact developers@overwolf.com
