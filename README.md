# Spark Installer
Installer for any application based on electron, works only on Windows.
Allows easy customization for the user, such as:
* Adding icon to dekstop
* Adding icon to start menu
* Choosing installation path
* Uninstalling the application if installed

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

# Usage
1. Copy the installer folder from the repository into a new folder where you want to create your installer
3. Copy your application into the installer folder
    - Make sure your application has an `exe` file in the root of the folder
4. Open the `settings.json` file in the build folder and edit the `exeDirectory` to point to your application folder
5. That's it! You can now run the installer by running the `installer.exe` file in the build folder to install your application.

## Current State of this project
Under development.