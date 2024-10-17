# Auto File/Folder Generation Extension

This extension automatically generates files and folders based on a template.
It provides a user-friendly interface for creating new files and folders with predefined content.

## Features

For example, if you have the following directory structure:

```md
src/
  features/
```

And you want to create a new feature called "myFeature", you can use the extension to generate the following files and folders:

```md
src/
  features/
    myFeature/
      myFeature.default.ts
      myFeature.queries.ts
      myFeature.services.ts
      myFeature.types.ts
```

The extension will automatically create the "myFeature" folder and generate the "myFeature.feature" and "myFeature.js" files with predefined content.

## Requirements

- VSCode 1.93.0 or later

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window, or by pressing `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows and Linux).
3. Search for "Auto FGTool" and click on the Install button.
4. Restart Visual Studio Code if prompted.
5. Open the Command Palette (`Cmd+Shift+P` on macOS or `Ctrl+Shift+P` on Windows and Linux) and type "Generate... " to start using the extension.
6. Follow the prompts to create new files and folders based on the predefined templates.
7. Enjoy the convenience of automatically generated files and folders!

**Enjoy!**

## License

This extension is licensed under the MIT License. See the [MIT License](https://opensource.org/licenses/MIT) for details.
