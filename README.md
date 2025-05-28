# Spark Installer
Installer for any application based on electron, works only on Windows.
Allows easy customization for the user, such as:
* Adding icon to dekstop
* Adding icon to start menu
* Choosing installation path
* Uninstalling the application if installed

It's very simple and easy to use it will just make a copy of your application into the path that the user chooses in the installer via its GUI and will create shorcuts if the user chooses to do so.

## Instalation

1. Press the blue button `<> Code`
2. Hover over the `Download Zip` button and click it to download the zip version of this repository

### &nbsp;&nbsp;&nbsp;Or

Use the git clone command to copy it onto your computer
```bash
git clone https://github.com/Spark4444/FandomAdBlocker
```
3. Load the extension into your browser of choice 
<br>(Your browser should have chromium extension support).

## Usage
1. Copy the whole sparkinstaller-win32-x64 folder from the out directory
2. Copy your application into the app folder inside the sparkinstaller-win32-x64 folder
3. Setup the installer-config.json by editing the appName to set the name for the executable shortcuts that will be created in desktop and start menu.
4. That's it! You can now run the installer by running the sparkinstaller.exe file in the sparkinstaller-win32-x64 folder and it will guide you through the installation process.

## Error Handling
If you encounter any errors while using the installer, please check the following:
- The app will show specific error messages in a dialog box of what went wrong.
- Check the above steps again to ensure everything is set up correctly.
- Also if errors persist check the debug.log file in the sparkinstaller-win32-x64 folder for more detailed information and report it on the issues page of this repository.

## Current State of this project
Under development.